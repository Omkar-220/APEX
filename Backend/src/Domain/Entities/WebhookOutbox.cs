using Domain.Enums;

namespace Domain.Entities;

public class WebhookOutbox
{
    public Guid OutboxId { get; private set; }
    public string EventType { get; private set; }
    public string Payload { get; private set; }
    public string TargetUrl { get; private set; }
    public WebhookStatus Status { get; private set; }
    public int RetryCount { get; private set; }
    public DateTime? LastAttempt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private WebhookOutbox()
    {
        EventType = null!;
        Payload = null!;
        TargetUrl = null!;
    }

    public static WebhookOutbox Create(string eventType, string payload, string targetUrl)
    {
        if (string.IsNullOrWhiteSpace(eventType)) throw new ArgumentException("EventType cannot be empty.", nameof(eventType));
        if (string.IsNullOrWhiteSpace(payload)) throw new ArgumentException("Payload cannot be empty.", nameof(payload));
        if (string.IsNullOrWhiteSpace(targetUrl)) throw new ArgumentException("TargetUrl cannot be empty.", nameof(targetUrl));

        return new WebhookOutbox
        {
            OutboxId = Guid.NewGuid(),
            EventType = eventType,
            Payload = payload,
            TargetUrl = targetUrl,
            Status = WebhookStatus.Pending,
            RetryCount = 0,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void RecordAttemptSuccess(DateTime utcNow)
    {
        Status = WebhookStatus.Sent;
        LastAttempt = utcNow;
    }

    public void RecordAttemptFailure(DateTime utcNow)
    {
        RetryCount++;
        LastAttempt = utcNow;
        Status = RetryCount >= 3 ? WebhookStatus.Dead : WebhookStatus.Failed;
    }
}
