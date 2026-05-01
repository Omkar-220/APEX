namespace Domain.ValueObjects;

/// <summary>
/// Display name value object with validation
/// </summary>
public sealed class DisplayName : IEquatable<DisplayName>
{
    public string Value { get; }

    private DisplayName(string value)
    {
        Value = value;
    }

    public static DisplayName Create(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            throw new ArgumentException("Display name cannot be empty.", nameof(displayName));

        if (displayName.Length > 255)
            throw new ArgumentException("Display name cannot exceed 255 characters.", nameof(displayName));

        return new DisplayName(displayName.Trim());
    }

    public static implicit operator string(DisplayName displayName) => displayName.Value;

    public override string ToString() => Value;

    public bool Equals(DisplayName? other)
    {
        if (other is null) return false;
        return Value.Equals(other.Value, StringComparison.Ordinal);
    }

    public override bool Equals(object? obj) => obj is DisplayName other && Equals(other);

    public override int GetHashCode() => Value.GetHashCode(StringComparison.Ordinal);

    public static bool operator ==(DisplayName? left, DisplayName? right) => 
        left?.Equals(right) ?? right is null;

    public static bool operator !=(DisplayName? left, DisplayName? right) => !(left == right);
}
