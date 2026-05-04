using Domain.Entities;
using Domain.Enums;
using Domain.Ports.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class AuditRepository : IAuditRepository
{
    private readonly AppDbContext _context;
    public AuditRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(AuditEvent auditEvent, CancellationToken ct = default)
    {
        await _context.AuditEvents.AddAsync(auditEvent, ct);
        await _context.SaveChangesAsync(ct);
    }

    public Task<List<AuditEvent>> GetBySessionAsync(Guid sessionId, CancellationToken ct = default) =>
        _context.AuditEvents
            .Where(e => e.SessionId == sessionId)
            .OrderBy(e => e.OccurredAt)
            .ToListAsync(ct);

    public Task<int> CountViolationsAsync(Guid sessionId, CancellationToken ct = default) =>
        _context.AuditEvents
            .CountAsync(e => e.SessionId == sessionId &&
                             (e.EventType == "focus_lost" ||
                              e.EventType == "multi_tab_opened" ||
                              e.EventType == "fullscreen_exit"), ct);
}

public class WebhookOutboxRepository : IWebhookOutboxRepository
{
    private readonly AppDbContext _context;
    public WebhookOutboxRepository(AppDbContext context) => _context = context;

    public async Task AddAsync(WebhookOutbox entry, CancellationToken ct = default)
    {
        await _context.WebhookOutbox.AddAsync(entry, ct);
        await _context.SaveChangesAsync(ct);
    }

    public Task<List<WebhookOutbox>> GetPendingAsync(int maxRetries, CancellationToken ct = default) =>
        _context.WebhookOutbox
            .Where(w => (w.Status == WebhookStatus.Pending || w.Status == WebhookStatus.Failed)
                        && w.RetryCount < maxRetries)
            .OrderBy(w => w.CreatedAt)
            .ToListAsync(ct);

    public async Task UpdateAsync(WebhookOutbox entry, CancellationToken ct = default)
    {
        _context.WebhookOutbox.Update(entry);
        await _context.SaveChangesAsync(ct);
    }
}
