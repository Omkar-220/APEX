namespace Domain.Exceptions;

/// <summary>
/// Thrown when a test assignment cannot be found
/// </summary>
public class AssignmentNotFoundException : DomainException
{
    public Guid AssignmentId { get; }

    public AssignmentNotFoundException(Guid assignmentId)
        : base($"Test assignment {assignmentId} not found.")
    {
        AssignmentId = assignmentId;
    }
}
