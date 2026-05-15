using Domain.Entities;

namespace Domain.Ports.Repositories;

public interface IAuditRepository
{
    Task AddAsync(AuditEvent auditEvent, CancellationToken ct = default);
    Task<List<AuditEvent>> GetBySessionAsync(Guid sessionId, CancellationToken ct = default);
    Task<int> CountViolationsAsync(Guid sessionId, CancellationToken ct = default);
    Task<Dictionary<Guid, int>> CountViolationsBatchAsync(IEnumerable<Guid> sessionIds, CancellationToken ct = default);
}

public interface IWebhookOutboxRepository
{
    Task AddAsync(WebhookOutbox entry, CancellationToken ct = default);
    Task<List<WebhookOutbox>> GetPendingAsync(int maxRetries, CancellationToken ct = default);
    Task UpdateAsync(WebhookOutbox entry, CancellationToken ct = default);
}
