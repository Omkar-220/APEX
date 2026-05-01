namespace Domain.Enums;

/// <summary>
/// Status of a test assignment (scheduled test for candidate/batch)
/// </summary>
public enum AssignmentStatus
{
    /// <summary>
    /// Assignment created but not yet started (before ScheduledStart)
    /// </summary>
    Pending,
    
    /// <summary>
    /// Assignment is active - within the time window, candidate can start
    /// </summary>
    Active,
    
    /// <summary>
    /// Assignment completed - all attempts used or deadline passed
    /// </summary>
    Completed,
    
    /// <summary>
    /// Assignment expired - deadline passed without completion
    /// </summary>
    Expired
}
