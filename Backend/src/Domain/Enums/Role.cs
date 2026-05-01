namespace Domain.Enums;

/// <summary>
/// User role in the system. Stored in Candidates table, NOT in Entra ID.
/// </summary>
public enum Role
{
    /// <summary>
    /// Regular exam candidate (default for new users)
    /// </summary>
    Candidate,
    
    /// <summary>
    /// Batch administrator - can manage assigned batches and tests
    /// </summary>
    Admin,
    
    /// <summary>
    /// Super administrator - full platform control
    /// </summary>
    SuperAdmin
}
