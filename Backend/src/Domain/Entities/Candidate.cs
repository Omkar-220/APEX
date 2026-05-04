using Domain.Enums;
using Domain.ValueObjects;

namespace Domain.Entities;

/// <summary>
/// Represents a user in the system (candidate, admin, or super admin).
/// Auto-provisioned on first login via Entra ID SSO.
/// Role is stored in DB, NOT in Entra ID app roles.
/// </summary>
public class Candidate
{
    /// <summary>
    /// Unique identifier for the candidate
    /// </summary>
    public Guid CandidateId { get; private set; }

    /// <summary>
    /// Email address (normalized to lowercase)
    /// </summary>
    public Email Email { get; private set; }

    /// <summary>
    /// Azure AD Object Identifier (OID) from JWT claims - canonical identity
    /// </summary>
    public AzureAdOid AzureAdOid { get; private set; }

    /// <summary>
    /// Display name from Entra ID
    /// </summary>
    public DisplayName DisplayName { get; private set; }

    /// <summary>
    /// User role in the system (Candidate, Admin, SuperAdmin)
    /// </summary>
    public Role Role { get; private set; }

    /// <summary>
    /// When the candidate record was created (UTC)
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    // Navigation properties
    public ICollection<BatchMember> BatchMemberships { get; private set; } = new List<BatchMember>();
    public ICollection<TestSession> TestSessions { get; private set; } = new List<TestSession>();
    public ICollection<TestAssignment> TestAssignments { get; private set; } = new List<TestAssignment>();

    // EF Core constructor
    private Candidate() 
    {
        Email = null!;
        AzureAdOid = null!;
        DisplayName = null!;
    }

    /// <summary>
    /// Creates a new candidate (auto-provisioned on first login)
    /// </summary>
    public static Candidate Create(
        string email,
        string azureAdOid,
        string displayName,
        Role role = Role.Candidate)
    {
        return new Candidate
        {
            CandidateId = Guid.NewGuid(),
            Email = Email.Create(email),
            AzureAdOid = AzureAdOid.Create(azureAdOid),
            DisplayName = DisplayName.Create(displayName),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Updates the candidate's role (admin operation)
    /// </summary>
    public void UpdateRole(Role newRole)
    {
        Role = newRole;
    }

    /// <summary>
    /// Updates the display name (e.g., if changed in Entra ID)
    /// </summary>
    public void UpdateDisplayName(string newDisplayName)
    {
        DisplayName = DisplayName.Create(newDisplayName);
    }

    /// <summary>
    /// Checks if the candidate has admin privileges
    /// </summary>
    public bool IsAdmin() => Role == Role.Admin || Role == Role.SuperAdmin;

    /// <summary>
    /// Checks if the candidate is a super admin
    /// </summary>
    public bool IsSuperAdmin() => Role == Role.SuperAdmin;
}
