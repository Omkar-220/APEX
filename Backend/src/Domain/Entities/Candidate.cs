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

    // Raw string columns — EF maps these directly, no value object conversion needed
    public string EmailValue { get; private set; } = null!;
    public string AzureAdOidValue { get; private set; } = null!;
    public string DisplayNameValue { get; private set; } = null!;

    // Value object accessors — computed from raw strings, ignored by EF
    public Email Email => Email.Create(EmailValue);
    public AzureAdOid AzureAdOid => AzureAdOid.Create(AzureAdOidValue);
    public DisplayName DisplayName => DisplayName.Create(DisplayNameValue);

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

    public string? PasswordHash { get; private set; }

    // EF Core constructor
    private Candidate() 
    {
        EmailValue = null!;
        AzureAdOidValue = null!;
        DisplayNameValue = null!;
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
            EmailValue = Email.Create(email).Value,
            AzureAdOidValue = AzureAdOid.Create(azureAdOid).Value,
            DisplayNameValue = DisplayName.Create(displayName).Value,
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

    public void SetPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
            throw new ArgumentException("Password must be at least 6 characters.");
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string password)
    {
        if (PasswordHash == null) return false;
        return BCrypt.Net.BCrypt.Verify(password, PasswordHash);
    }

    /// <summary>
    /// Updates the display name (e.g., if changed in Entra ID)
    /// </summary>
    public void UpdateDisplayName(string newDisplayName)
    {
        DisplayNameValue = DisplayName.Create(newDisplayName).Value;
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
