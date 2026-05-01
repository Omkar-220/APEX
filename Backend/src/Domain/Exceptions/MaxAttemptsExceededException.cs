namespace Domain.Exceptions;

/// <summary>
/// Thrown when a candidate tries to start a test but has already used all allowed attempts
/// </summary>
public class MaxAttemptsExceededException : DomainException
{
    public Guid AssignmentId { get; }
    public int MaxAttempts { get; }
    public int CurrentAttempts { get; }

    public MaxAttemptsExceededException(Guid assignmentId, int maxAttempts, int currentAttempts)
        : base($"Maximum attempts ({maxAttempts}) exceeded for assignment {assignmentId}. Current attempts: {currentAttempts}")
    {
        AssignmentId = assignmentId;
        MaxAttempts = maxAttempts;
        CurrentAttempts = currentAttempts;
    }
}
