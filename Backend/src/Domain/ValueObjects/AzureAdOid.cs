namespace Domain.ValueObjects;

/// <summary>
/// Azure AD Object Identifier (OID) value object
/// Canonical identity from Entra ID JWT claims
/// </summary>
public sealed class AzureAdOid : IEquatable<AzureAdOid>
{
    public string Value { get; }

    private AzureAdOid(string value)
    {
        Value = value;
    }

    public static AzureAdOid Create(string oid)
    {
        if (string.IsNullOrWhiteSpace(oid))
            throw new ArgumentException("Azure AD OID cannot be empty.", nameof(oid));

        if (oid.Length > 128)
            throw new ArgumentException("Azure AD OID cannot exceed 128 characters.", nameof(oid));

        return new AzureAdOid(oid.Trim());
    }

    public static implicit operator string(AzureAdOid oid) => oid.Value;

    public override string ToString() => Value;

    public bool Equals(AzureAdOid? other)
    {
        if (other is null) return false;
        return Value.Equals(other.Value, StringComparison.Ordinal);
    }

    public override bool Equals(object? obj) => obj is AzureAdOid other && Equals(other);

    public override int GetHashCode() => Value.GetHashCode(StringComparison.Ordinal);

    public static bool operator ==(AzureAdOid? left, AzureAdOid? right) => 
        left?.Equals(right) ?? right is null;

    public static bool operator !=(AzureAdOid? left, AzureAdOid? right) => !(left == right);
}
