namespace Domain.Enums;

/// <summary>
/// Status of a test session (candidate's attempt at a test)
/// </summary>
public enum TestSessionStatus
{
    /// <summary>
    /// Session is currently active - candidate is taking the exam
    /// </summary>
    Active,
    
    /// <summary>
    /// Session completed successfully - candidate submitted or auto-finalized
    /// </summary>
    Completed,
    
    /// <summary>
    /// Session expired - time ran out without submission
    /// </summary>
    Expired
}
