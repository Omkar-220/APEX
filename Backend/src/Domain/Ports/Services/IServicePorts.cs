namespace Domain.Ports.Services;

/// <summary>
/// Enqueues a webhook notification via the outbox pattern.
/// </summary>
public interface INotificationPort
{
    Task EnqueueAsync(string eventType, object payload, CancellationToken ct = default);
}

/// <summary>
/// Records audit/violation events for a session.
/// </summary>
public interface IAuditPort
{
    Task RecordAsync(Guid sessionId, string eventType, string? payload = null, CancellationToken ct = default);
    Task<int> GetViolationCountAsync(Guid sessionId, CancellationToken ct = default);
}

/// <summary>
/// Short-lived cache for finalized test results (1h TTL).
/// Prevents re-scoring on repeated GET /result calls.
/// </summary>
public interface IResultCachePort
{
    void Set(Guid sessionId, object result, TimeSpan ttl);
    T? Get<T>(Guid sessionId) where T : class;
    void Remove(Guid sessionId);
}
