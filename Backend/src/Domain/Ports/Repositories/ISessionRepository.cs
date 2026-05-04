using Domain.Entities;
using Domain.Enums;

namespace Domain.Ports.Repositories;

public interface ISessionRepository
{
    Task<TestSession?> GetByIdAsync(Guid sessionId, CancellationToken ct = default);
    Task<List<TestSession>> GetByAssignmentAsync(Guid assignmentId, CancellationToken ct = default);
    Task<List<TestSession>> GetActiveExpiredAsync(DateTime utcNow, int durationMinutes, CancellationToken ct = default);
    Task<List<TestSession>> GetByTestAsync(Guid testId, TestSessionStatus? status, CancellationToken ct = default);
    Task<int> CountAttemptsAsync(Guid assignmentId, Guid candidateId, CancellationToken ct = default);
    Task AddAsync(TestSession session, CancellationToken ct = default);

    /// <summary>
    /// Optimistic concurrency update — only updates if RowVersion matches.
    /// Returns false if concurrency conflict occurred.
    /// </summary>
    Task<bool> TryFinalizeAsync(Guid sessionId, int score, DateTime endTime, byte[] rowVersion, CancellationToken ct = default);
}

public interface IAnswerRepository
{
    Task<Answer?> GetByIdempotencyKeyAsync(Guid idempotencyKey, CancellationToken ct = default);
    Task<List<Answer>> GetBySessionAsync(Guid sessionId, CancellationToken ct = default);
    Task<int> CountBySessionAsync(Guid sessionId, CancellationToken ct = default);

    /// <summary>MERGE upsert with HOLDLOCK — idempotent, handles concurrent retries.</summary>
    Task UpsertAsync(Guid sessionId, Guid questionId, char selectedOption, Guid idempotencyKey, CancellationToken ct = default);
}

public interface ISessionQuestionMappingRepository
{
    Task<SessionQuestionMapping?> GetAsync(Guid sessionId, Guid questionId, CancellationToken ct = default);
    Task<SessionQuestionMapping?> GetByPositionAsync(Guid sessionId, int position, CancellationToken ct = default);
    Task<List<SessionQuestionMapping>> GetBySessionAsync(Guid sessionId, CancellationToken ct = default);
    Task BulkInsertAsync(IEnumerable<SessionQuestionMapping> mappings, CancellationToken ct = default);
}
