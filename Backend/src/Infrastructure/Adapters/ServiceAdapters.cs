using System.Text.Json;
using Domain.Entities;
using Domain.Ports.Repositories;
using Domain.Ports.Services;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Adapters;

public class NotificationAdapter : INotificationPort
{
    private readonly IWebhookOutboxRepository _outbox;
    private readonly string _webhookUrl;

    public NotificationAdapter(IWebhookOutboxRepository outbox, IConfiguration config)
    {
        _outbox = outbox;
        _webhookUrl = config["PowerAutomate:WebhookUrl"]
            ?? throw new InvalidOperationException("PowerAutomate:WebhookUrl is not configured.");
    }

    public async Task EnqueueAsync(string eventType, object payload, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(payload);
        var entry = WebhookOutbox.Create(eventType, json, _webhookUrl);
        await _outbox.AddAsync(entry, ct);
    }
}

public class AuditAdapter : IAuditPort
{
    private readonly IAuditRepository _repo;
    public AuditAdapter(IAuditRepository repo) => _repo = repo;

    public async Task RecordAsync(Guid sessionId, string eventType, string? payload = null, CancellationToken ct = default)
    {
        var evt = AuditEvent.Create(sessionId, eventType, payload);
        await _repo.AddAsync(evt, ct);
    }

    public Task<int> GetViolationCountAsync(Guid sessionId, CancellationToken ct = default) =>
        _repo.CountViolationsAsync(sessionId, ct);
}

public class ResultCacheAdapter : IResultCachePort
{
    private readonly IMemoryCache _cache;
    public ResultCacheAdapter(IMemoryCache cache) => _cache = cache;

    public void Set(Guid sessionId, object result, TimeSpan ttl) =>
        _cache.Set(CacheKey(sessionId), result, ttl);

    public T? Get<T>(Guid sessionId) where T : class =>
        _cache.TryGetValue(CacheKey(sessionId), out var value) ? value as T : null;

    public void Remove(Guid sessionId) =>
        _cache.Remove(CacheKey(sessionId));

    private static string CacheKey(Guid sessionId) => $"result:{sessionId}";
}
