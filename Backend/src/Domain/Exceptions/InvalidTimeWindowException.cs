namespace Domain.Exceptions;

/// <summary>
/// Thrown when attempting to start a test outside its scheduled time window
/// </summary>
public class InvalidTimeWindowException : DomainException
{
    public Guid AssignmentId { get; }
    public DateTime ScheduledStart { get; }
    public DateTime Deadline { get; }
    public DateTime AttemptedAt { get; }

    public InvalidTimeWindowException(
        Guid assignmentId, 
        DateTime scheduledStart, 
        DateTime deadline, 
        DateTime attemptedAt)
        : base($"Test assignment {assignmentId} cannot be started. " +
               $"Scheduled window: {scheduledStart:u} to {deadline:u}. " +
               $"Attempted at: {attemptedAt:u}")
    {
        AssignmentId = assignmentId;
        ScheduledStart = scheduledStart;
        Deadline = deadline;
        AttemptedAt = attemptedAt;
    }
}
