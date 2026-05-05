using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundServices;

public class WebhookProcessorService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WebhookProcessorService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(15);
    private const int MaxRetries = 3;

    public WebhookProcessorService(
        IServiceScopeFactory scopeFactory,
        ILogger<WebhookProcessorService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(Interval, stoppingToken);
            try
            {
                await ProcessPendingWebhooksAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "WebhookProcessorService tick failed");
            }
        }
    }

    private async Task ProcessPendingWebhooksAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<Persistence.AppDbContext>();

        var pending = await context.WebhookOutbox
            .Where(w => (w.Status == WebhookStatus.Pending || w.Status == WebhookStatus.Failed)
                        && w.RetryCount < MaxRetries)
            .OrderBy(w => w.CreatedAt)
            .ToListAsync(ct);

        var client = _httpClientFactory.CreateClient("webhook");

        foreach (var entry in pending)
        {
            try
            {
                var response = await client.PostAsync(
                    entry.TargetUrl,
                    new StringContent(entry.Payload, System.Text.Encoding.UTF8, "application/json"),
                    ct);

                if (response.IsSuccessStatusCode)
                {
                    entry.RecordAttemptSuccess(DateTime.UtcNow);
                    _logger.LogInformation("Webhook sent for {EventType} OutboxId={OutboxId}",
                        entry.EventType, entry.OutboxId);
                }
                else
                {
                    entry.RecordAttemptFailure(DateTime.UtcNow);
                    _logger.LogWarning("Webhook failed ({StatusCode}) for OutboxId={OutboxId}, retry {Retry}",
                        response.StatusCode, entry.OutboxId, entry.RetryCount);
                }
            }
            catch (Exception ex)
            {
                entry.RecordAttemptFailure(DateTime.UtcNow);
                _logger.LogWarning(ex, "Webhook exception for OutboxId={OutboxId}, retry {Retry}",
                    entry.OutboxId, entry.RetryCount);
            }

            if (entry.Status == WebhookStatus.Dead)
                _logger.LogCritical("Webhook permanently dead for OutboxId={OutboxId} EventType={EventType}",
                    entry.OutboxId, entry.EventType);

            context.WebhookOutbox.Update(entry);
        }

        if (pending.Count > 0)
            await context.SaveChangesAsync(ct);
    }
}
