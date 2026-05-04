namespace Domain.Entities;

public class AuditEvent
{
    public long EventId { get; private set; }
    public Guid SessionId { get; private set; }
    public string EventType { get; private set; }
    public string? Payload { get; private set; }
    public DateTime OccurredAt { get; private set; }

    // Navigation properties
    public TestSession Session { get; private set; } = null!;

    private AuditEvent() { EventType = null!; }

    public static AuditEvent Create(Guid sessionId, string eventType, string? payload = null)
    {
        if (sessionId == Guid.Empty) throw new ArgumentException("SessionId cannot be empty.", nameof(sessionId));
        if (string.IsNullOrWhiteSpace(eventType)) throw new ArgumentException("EventType cannot be empty.", nameof(eventType));

        return new AuditEvent
        {
            SessionId = sessionId,
            EventType = eventType,
            Payload = payload,
            OccurredAt = DateTime.UtcNow
        };
    }
}
