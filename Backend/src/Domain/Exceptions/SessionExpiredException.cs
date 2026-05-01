namespace Domain.Exceptions;

/// <summary>
/// Thrown when attempting to perform operations on an expired or completed test session
/// </summary>
public class SessionExpiredException : DomainException
{
    public Guid SessionId { get; }

    public SessionExpiredException(Guid sessionId) 
        : base($"Test session {sessionId} has expired or is no longer active.")
    {
        SessionId = sessionId;
    }

    public SessionExpiredException(Guid sessionId, string message) 
        : base(message)
    {
        SessionId = sessionId;
    }
}
