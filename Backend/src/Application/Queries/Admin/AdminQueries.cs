using Application.DTOs;
using Domain.Enums;
using Domain.Ports.Repositories;

namespace Application.Queries.Admin;

// ── Get Admin Users ───────────────────────────────────────────────────────────

public class GetAdminUsersHandler
{
    private readonly ICandidateRepository _repo;
    public GetAdminUsersHandler(ICandidateRepository repo) => _repo = repo;

    public async Task<List<CandidateDto>> HandleAsync(CancellationToken ct = default)
    {
        var candidates = await _repo.GetAllAsync(ct);
        return candidates.Select(c => new CandidateDto(
            c.CandidateId,
            c.Email.Value,
            c.DisplayName.Value,
            c.Role.ToString())).ToList();
    }
}

// ── Get Admin Sessions ────────────────────────────────────────────────────────

public record GetAdminSessionsQuery(Guid TestId, string? Status);

public class GetAdminSessionsHandler
{
    private readonly ISessionRepository _sessionRepo;

    public GetAdminSessionsHandler(ISessionRepository sessionRepo)
    {
        _sessionRepo = sessionRepo;
    }

    public async Task<List<AdminSessionDto>> HandleAsync(GetAdminSessionsQuery query, CancellationToken ct = default)
    {
        TestSessionStatus? status = query.Status != null
            ? Enum.Parse<TestSessionStatus>(query.Status) : null;

        var sessions = await _sessionRepo.GetByTestAsync(query.TestId, status, ct);

        return sessions.Select(s => new AdminSessionDto(
            s.SessionId,
            s.Candidate.Email.Value,
            s.Status.ToString(),
            s.Score,
            s.StartTime)).ToList();
    }
}

// ── Get Question Batches ──────────────────────────────────────────────────────

public class GetQuestionBatchesHandler
{
    private readonly IQuestionBatchRepository _repo;
    public GetQuestionBatchesHandler(IQuestionBatchRepository repo) => _repo = repo;

    public async Task<List<QuestionBatchDto>> HandleAsync(CancellationToken ct = default)
    {
        var batches = await _repo.GetAllAsync(ct);
        return batches.Select(b => new QuestionBatchDto(
            b.QuestionBatchId,
            b.Name,
            b.Domain,
            b.Topic,
            b.Difficulty?.ToString(),
            b.QuestionBatchMembers.Count,
            b.IsActive,
            b.CreatedAt)).ToList();
    }
}

// ── Get Tests ─────────────────────────────────────────────────────────────────

public class GetTestsHandler
{
    private readonly ITestRepository _repo;
    public GetTestsHandler(ITestRepository repo) => _repo = repo;

    public async Task<List<TestDto>> HandleAsync(CancellationToken ct = default)
    {
        var tests = await _repo.GetAllAsync(ct);
        return tests.Select(t => new TestDto(
            t.TestId,
            t.Title,
            t.Description,
            t.DurationMinutes,
            t.PassingScorePercent,
            t.IsActive,
            t.CreatedAt)).ToList();
    }
}

// ── Get Assignments ───────────────────────────────────────────────────────────

public class GetAssignmentsHandler
{
    private readonly ITestAssignmentRepository _repo;
    public GetAssignmentsHandler(ITestAssignmentRepository repo) => _repo = repo;

    public async Task<List<AdminAssignmentDto>> HandleAsync(CancellationToken ct = default)
    {
        var assignments = await _repo.GetAllAsync(ct);
        return assignments.Select(a => new AdminAssignmentDto(
            a.AssignmentId,
            a.TestId,
            a.Test?.Title ?? string.Empty,
            a.QuestionBatchId,
            string.Empty,
            a.BatchId,
            null,
            a.CandidateId,
            null,
            a.QuestionCount,
            a.ScheduledStart,
            a.Deadline,
            a.Status.ToString(),
            a.MaxAttempts,
            a.CreatedAt)).ToList();
    }
}

// ── Get Candidate Batches ─────────────────────────────────────────────────────

public class GetBatchesHandler
{
    private readonly IBatchRepository _repo;
    public GetBatchesHandler(IBatchRepository repo) => _repo = repo;

    public async Task<List<CandidateBatchDto>> HandleAsync(CancellationToken ct = default)
    {
        var batches = await _repo.GetAllAsync(ct);
        return batches.Select(b => new CandidateBatchDto(
            b.BatchId,
            b.Name,
            b.Domain,
            b.Topic,
            b.Difficulty?.ToString(),
            b.Members.Count,
            b.IsActive,
            b.CreatedAt)).ToList();
    }
}
