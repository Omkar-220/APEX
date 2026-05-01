using System.Text.Json;
using Domain.Enums;

namespace Domain.ValueObjects;

/// <summary>
/// Represents the mapping between display options (shown to candidate) 
/// and original options (stored in Questions table).
/// Format: { "A": "C", "B": "A", "C": "D", "D": "B" }
/// Key = display option, Value = original option
/// </summary>
public sealed class OptionMapping : IEquatable<OptionMapping>
{
    private readonly Dictionary<char, char> _mapping;

    public IReadOnlyDictionary<char, char> Mapping => _mapping;

    private OptionMapping(Dictionary<char, char> mapping)
    {
        _mapping = mapping;
    }

    /// <summary>
    /// Creates an OptionMapping from a dictionary
    /// </summary>
    public static OptionMapping Create(Dictionary<char, char> mapping)
    {
        if (mapping == null || mapping.Count != 4)
            throw new ArgumentException("Option mapping must contain exactly 4 entries (A, B, C, D).", nameof(mapping));

        var validOptions = new[] { 'A', 'B', 'C', 'D' };
        
        if (!validOptions.All(mapping.ContainsKey))
            throw new ArgumentException("Option mapping must contain keys A, B, C, and D.", nameof(mapping));

        if (!validOptions.All(o => mapping.Values.Contains(o)))
            throw new ArgumentException("Option mapping must contain values A, B, C, and D.", nameof(mapping));

        return new OptionMapping(new Dictionary<char, char>(mapping));
    }

    /// <summary>
    /// Creates an OptionMapping from JSON string
    /// </summary>
    public static OptionMapping FromJson(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
            throw new ArgumentException("JSON cannot be empty.", nameof(json));

        try
        {
            var mapping = JsonSerializer.Deserialize<Dictionary<char, char>>(json);
            if (mapping == null)
                throw new ArgumentException("Failed to deserialize option mapping.", nameof(json));

            return Create(mapping);
        }
        catch (JsonException ex)
        {
            throw new ArgumentException($"Invalid JSON format for option mapping: {ex.Message}", nameof(json), ex);
        }
    }

    /// <summary>
    /// Converts the mapping to JSON string for storage
    /// </summary>
    public string ToJson()
    {
        return JsonSerializer.Serialize(_mapping);
    }

    /// <summary>
    /// Gets the original option key for a given display option
    /// </summary>
    public char GetOriginalOption(char displayOption)
    {
        if (!_mapping.TryGetValue(displayOption, out var originalOption))
            throw new ArgumentException($"Invalid display option: {displayOption}", nameof(displayOption));

        return originalOption;
    }

    /// <summary>
    /// Gets the display option for a given original option
    /// </summary>
    public char GetDisplayOption(char originalOption)
    {
        var displayOption = _mapping.FirstOrDefault(kvp => kvp.Value == originalOption).Key;
        if (displayOption == default)
            throw new ArgumentException($"Invalid original option: {originalOption}", nameof(originalOption));

        return displayOption;
    }

    public bool Equals(OptionMapping? other)
    {
        if (other is null) return false;
        return _mapping.Count == other._mapping.Count &&
               _mapping.All(kvp => other._mapping.TryGetValue(kvp.Key, out var value) && value == kvp.Value);
    }

    public override bool Equals(object? obj) => obj is OptionMapping other && Equals(other);

    public override int GetHashCode()
    {
        var hash = new HashCode();
        foreach (var kvp in _mapping.OrderBy(x => x.Key))
        {
            hash.Add(kvp.Key);
            hash.Add(kvp.Value);
        }
        return hash.ToHashCode();
    }

    public static bool operator ==(OptionMapping? left, OptionMapping? right) => 
        left?.Equals(right) ?? right is null;

    public static bool operator !=(OptionMapping? left, OptionMapping? right) => !(left == right);
}
