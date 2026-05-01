namespace Domain.Enums;

/// <summary>
/// Status of webhook delivery in the outbox pattern
/// </summary>
public enum WebhookStatus
{
    /// <summary>
    /// Webhook queued, not yet sent
    /// </summary>
    Pending,
    
    /// <summary>
    /// Webhook successfully delivered
    /// </summary>
    Sent,
    
    /// <summary>
    /// Webhook delivery failed, will retry (RetryCount < 3)
    /// </summary>
    Failed,
    
    /// <summary>
    /// Webhook delivery failed permanently (RetryCount >= 3)
    /// </summary>
    Dead
}
