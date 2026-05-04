namespace Domain.Utilities;

/// <summary>
/// Seeded Pseudo-Random Number Generator using Fisher-Yates shuffle.
/// Pure static class - no state, fully deterministic based on seed.
/// </summary>
public static class SeededPrng
{
    /// <summary>
    /// Shuffles a list in-place using Fisher-Yates algorithm with deterministic seed.
    /// Returns the same shuffled order for the same seed.
    /// </summary>
    public static void Shuffle<T>(IList<T> list, int seed)
    {
        if (list == null)
            throw new ArgumentNullException(nameof(list));

        if (list.Count <= 1)
            return;

        var random = new Random(seed);
        
        // Fisher-Yates shuffle
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = random.Next(i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }
    }

    /// <summary>
    /// Selects a random subset of items from a list using deterministic seed.
    /// Returns the same subset in the same order for the same seed.
    /// </summary>
    public static List<T> SelectRandom<T>(IList<T> source, int count, int seed)
    {
        if (source == null)
            throw new ArgumentNullException(nameof(source));

        if (count < 0)
            throw new ArgumentException("Count cannot be negative.", nameof(count));

        if (count > source.Count)
            throw new ArgumentException($"Cannot select {count} items from a list of {source.Count} items.", nameof(count));

        if (count == 0)
            return new List<T>();

        if (count == source.Count)
            return new List<T>(source);

        // Create a copy to avoid modifying the original
        var copy = new List<T>(source);
        
        // Shuffle the copy
        Shuffle(copy, seed);
        
        // Take the first 'count' items
        return copy.Take(count).ToList();
    }

    /// <summary>
    /// Generates a random integer between min (inclusive) and max (exclusive) using deterministic seed.
    /// </summary>
    public static int Next(int min, int max, int seed)
    {
        if (min >= max)
            throw new ArgumentException("Min must be less than max.", nameof(min));

        var random = new Random(seed);
        return random.Next(min, max);
    }
}
