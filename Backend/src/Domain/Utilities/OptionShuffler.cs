namespace Domain.Utilities;

/// <summary>
/// Shuffles MCQ options (A, B, C, D) deterministically.
/// Returns a mapping where Key = display option, Value = original option.
/// </summary>
public static class OptionShuffler
{
    private static readonly char[] Options = { 'A', 'B', 'C', 'D' };

    /// <summary>
    /// Generates a shuffled option mapping using deterministic seed.
    /// Returns Dictionary where:
    ///   Key = display option (what candidate sees on screen)
    ///   Value = original option (stored in Questions table)
    /// 
    /// Example: { "A": "C", "B": "A", "C": "D", "D": "B" }
    /// Means: Display option A maps to original option C
    /// </summary>
    public static Dictionary<char, char> Shuffle(int seed)
    {
        // Create a copy of options to shuffle
        var shuffled = Options.ToList();
        
        // Shuffle using seeded PRNG
        SeededPrng.Shuffle(shuffled, seed);
        
        // Create mapping: display option -> original option
        var mapping = new Dictionary<char, char>();
        for (int i = 0; i < Options.Length; i++)
        {
            // Display option (A, B, C, D in order)
            var displayOption = Options[i];
            
            // Original option (shuffled position)
            var originalOption = shuffled[i];
            
            mapping[displayOption] = originalOption;
        }
        
        return mapping;
    }

    /// <summary>
    /// Creates an identity mapping (no shuffle) - used for testing or special cases.
    /// Returns: { "A": "A", "B": "B", "C": "C", "D": "D" }
    /// </summary>
    public static Dictionary<char, char> Identity()
    {
        return new Dictionary<char, char>
        {
            { 'A', 'A' },
            { 'B', 'B' },
            { 'C', 'C' },
            { 'D', 'D' }
        };
    }

    /// <summary>
    /// Validates that a mapping is complete and correct
    /// </summary>
    public static bool IsValidMapping(Dictionary<char, char> mapping)
    {
        if (mapping == null || mapping.Count != 4)
            return false;

        // Check all display options are present
        if (!Options.All(mapping.ContainsKey))
            return false;

        // Check all original options are present in values
        if (!Options.All(o => mapping.Values.Contains(o)))
            return false;

        return true;
    }
}
