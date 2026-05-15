using Domain.Entities;
using Domain.Enums;
using Domain.Ports.Repositories;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class SessionRepository : ISessionRepository
{
    private readonly AppDbContext _context;
    public SessionRepository(AppDbContext context) => _context = context;

    public Task<TestSession?> GetByIdAsync(Guid sessionId, CancellationToken ct = default) =>
        _context.TestSessions
            .Include(s => s.Test)
            .Include(s => s.Candidate)
            .FirstOrDefaultAsync(s => s.SessionId == sessionId, ct);

    public Task<List<TestSession>> GetByAssignmentAsync(Guid assignmentId, CancellationToken ct = default) =>
        _context.TestSessions
            .Where(s => s.AssignmentId == assignmentId)
            .ToListAsync(ct);

    public Task<int> CountAttemptsAsync(Guid assignmentId, Guid candidateId, CancellationToken ct = default) =>
        _context.TestSessions
            .CountAsync(s => s.AssignmentId == assignmentId
                          && s.CandidateId == candidateId
                          && s.Status != TestSessionStatus.Expired, ct);

    public async Task<int> GetMaxAttemptNumberAsync(Guid assignmentId, Guid candidateId, CancellationToken ct = default)
    {
        var max = await _context.TestSessions
            .Where(s => s.AssignmentId == assignmentId && s.CandidateId == candidateId)
            .MaxAsync(s => (int?)s.AttemptNumber, ct);
        return max ?? 0;
    }

    public Task<List<TestSession>> GetActiveExpiredAsync(DateTime utcNow, int durationMinutes, CancellationToken ct = default) =>
        _context.TestSessions
            .Where(s => s.Status == TestSessionStatus.Active &&
                        EF.Functions.DateDiffSecond(s.StartTime, utcNow) >= durationMinutes * 60)
            .ToListAsync(ct);

    public Task<List<TestSession>> GetByTestAsync(Guid testId, TestSessionStatus? status, CancellationToken ct = default) =>
        _context.TestSessions
            .Include(s => s.Candidate)
            .Where(s => s.TestId == testId && (status == null || s.Status == status))
            .ToListAsync(ct);

    public async Task<Dictionary<Guid, TestSession>> GetLatestCompletedByAssignmentsAsync(
        IEnumerable<Guid> assignmentIds, CancellationToken ct = default)
    {
        var ids = assignmentIds.ToList();
        if (ids.Count == 0) return new Dictionary<Guid, TestSession>();

        // For each assignment, pick the completed session with the highest score
        // (last attempt that finished). Group client-side — set is already small.
        var sessions = await _context.TestSessions
            .Include(s => s.Candidate)
            .Where(s => ids.Contains(s.AssignmentId) && s.Status == TestSessionStatus.Completed)
            .ToListAsync(ct);

        return sessions
            .GroupBy(s => s.AssignmentId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(s => s.EndTime).First());
    }

    public async Task AddAsync(TestSession session, CancellationToken ct = default)
    {
        await _context.TestSessions.AddAsync(session, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AddWithMappingsAsync(TestSession session, IEnumerable<SessionQuestionMapping> mappings, CancellationToken ct = default)
    {
        var mappingList = mappings.ToList();
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            // Clear tracker before each attempt — prevents duplicate-insert on retry
            _context.ChangeTracker.Clear();
            await using var tx = await _context.Database.BeginTransactionAsync(ct);
            try
            {
                await _context.TestSessions.AddAsync(session, ct);
                await _context.SessionQuestionMappings.AddRangeAsync(mappingList, ct);
                await _context.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
        });
    }

    public async Task<bool> TryFinalizeAsync(Guid sessionId, int score, DateTime endTime, byte[] rowVersion, CancellationToken ct = default)
    {
        var rows = await _context.TestSessions
            .Where(s => s.SessionId == sessionId && s.RowVersion == rowVersion)
            .ExecuteUpdateAsync(s => s
                .SetProperty(x => x.Score, score)
                .SetProperty(x => x.EndTime, endTime)
                .SetProperty(x => x.Status, TestSessionStatus.Completed), ct);

        return rows > 0;
    }
}

public class AnswerRepository : IAnswerRepository
{
    private readonly AppDbContext _context;
    public AnswerRepository(AppDbContext context) => _context = context;

    public Task<Answer?> GetByIdempotencyKeyAsync(Guid idempotencyKey, CancellationToken ct = default) =>
        _context.Answers.FirstOrDefaultAsync(a => a.IdempotencyKey == idempotencyKey, ct);

    public Task<List<Answer>> GetBySessionAsync(Guid sessionId, CancellationToken ct = default) =>
        _context.Answers.Where(a => a.SessionId == sessionId).ToListAsync(ct);

    public Task<int> CountBySessionAsync(Guid sessionId, CancellationToken ct = default) =>
        _context.Answers.CountAsync(a => a.SessionId == sessionId, ct);

    public async Task UpsertAsync(Guid sessionId, Guid questionId, char selectedOption, Guid idempotencyKey, CancellationToken ct = default)
    {
        const string sql = @"
            MERGE Answers WITH (HOLDLOCK, UPDLOCK) AS target
            USING (SELECT @SessionId AS SessionId, @QuestionId AS QuestionId) AS source
            ON (target.SessionId = source.SessionId AND target.QuestionId = source.QuestionId)
            WHEN MATCHED THEN
                UPDATE SET SelectedOption = @Option, IdempotencyKey = @IdempotencyKey, SubmittedAt = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT (AnswerId, SessionId, QuestionId, SelectedOption, IdempotencyKey, SubmittedAt)
                VALUES (NEWID(), @SessionId, @QuestionId, @Option, @IdempotencyKey, SYSUTCDATETIME());";

        try
        {
            var parameters = new SqlParameter[]
            {
                new("@SessionId",      sessionId),
                new("@QuestionId",     questionId),
                new("@Option",         selectedOption.ToString()),
                new("@IdempotencyKey", idempotencyKey)
            };
            await _context.Database.ExecuteSqlRawAsync(sql, parameters, ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx &&
            (sqlEx.Number == 2601 || sqlEx.Number == 2627))
        {
            // Idempotent — key already processed by concurrent request
        }
    }
}

public class SessionQuestionMappingRepository : ISessionQuestionMappingRepository
{
    private readonly AppDbContext _context;
    public SessionQuestionMappingRepository(AppDbContext context) => _context = context;

    public Task<SessionQuestionMapping?> GetAsync(Guid sessionId, Guid questionId, CancellationToken ct = default) =>
        _context.SessionQuestionMappings
            .FirstOrDefaultAsync(m => m.SessionId == sessionId && m.QuestionId == questionId, ct);

    public Task<SessionQuestionMapping?> GetByPositionAsync(Guid sessionId, int position, CancellationToken ct = default) =>
        _context.SessionQuestionMappings
            .FirstOrDefaultAsync(m => m.SessionId == sessionId && m.QuestionPosition == position, ct);

    public Task<List<SessionQuestionMapping>> GetBySessionAsync(Guid sessionId, CancellationToken ct = default) =>
        _context.SessionQuestionMappings
            .Where(m => m.SessionId == sessionId)
            .OrderBy(m => m.QuestionPosition)
            .ToListAsync(ct);

    public async Task BulkInsertAsync(IEnumerable<SessionQuestionMapping> mappings, CancellationToken ct = default)
    {
        await _context.SessionQuestionMappings.AddRangeAsync(mappings, ct);
        await _context.SaveChangesAsync(ct);
    }
}
