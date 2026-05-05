using Domain.Utilities;
using FluentAssertions;

namespace Domain.Tests.Utilities;

public class OptionShufflerTests
{
    private static readonly char[] ValidOptions = ['A', 'B', 'C', 'D'];

    [Fact]
    public void Shuffle_ReturnsExactlyFourEntries()
    {
        var result = OptionShuffler.Shuffle(42);
        result.Should().HaveCount(4);
    }

    [Fact]
    public void Shuffle_AllDisplayKeysPresent()
    {
        var result = OptionShuffler.Shuffle(42);
        result.Keys.Should().BeEquivalentTo(ValidOptions);
    }

    [Fact]
    public void Shuffle_AllOriginalValuesPresent()
    {
        var result = OptionShuffler.Shuffle(42);
        result.Values.Should().BeEquivalentTo(ValidOptions);
    }

    [Fact]
    public void Shuffle_IsBijection_NoValueDuplicates()
    {
        var result = OptionShuffler.Shuffle(42);
        result.Values.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void Shuffle_SameSeed_ProducesSameMapping()
    {
        var result1 = OptionShuffler.Shuffle(42);
        var result2 = OptionShuffler.Shuffle(42);

        foreach (var key in ValidOptions)
            result1[key].Should().Be(result2[key]);
    }

    [Fact]
    public void Shuffle_DifferentSeeds_ProduceDifferentMappings()
    {
        // Run many seeds to confirm at least some differ
        var results = Enumerable.Range(0, 100)
            .Select(i => OptionShuffler.Shuffle(i))
            .ToList();

        // Not all mappings should be identical
        var firstJson = string.Join(",", results[0].OrderBy(k => k.Key).Select(k => $"{k.Key}:{k.Value}"));
        results.Should().Contain(m =>
            string.Join(",", m.OrderBy(k => k.Key).Select(k => $"{k.Key}:{k.Value}")) != firstJson);
    }

    [Fact]
    public void Identity_ReturnsIdentityMapping()
    {
        var result = OptionShuffler.Identity();
        foreach (var key in ValidOptions)
            result[key].Should().Be(key);
    }

    [Fact]
    public void IsValidMapping_ValidMapping_ReturnsTrue()
    {
        var mapping = new Dictionary<char, char>
        {
            ['A'] = 'C', ['B'] = 'A', ['C'] = 'D', ['D'] = 'B'
        };
        OptionShuffler.IsValidMapping(mapping).Should().BeTrue();
    }

    [Fact]
    public void IsValidMapping_MissingKey_ReturnsFalse()
    {
        var mapping = new Dictionary<char, char>
        {
            ['A'] = 'C', ['B'] = 'A', ['C'] = 'D'
        };
        OptionShuffler.IsValidMapping(mapping).Should().BeFalse();
    }

    [Fact]
    public void IsValidMapping_DuplicateValue_ReturnsFalse()
    {
        var mapping = new Dictionary<char, char>
        {
            ['A'] = 'C', ['B'] = 'C', ['C'] = 'D', ['D'] = 'B'
        };
        OptionShuffler.IsValidMapping(mapping).Should().BeFalse();
    }

    [Fact]
    public void IsValidMapping_Null_ReturnsFalse()
    {
        OptionShuffler.IsValidMapping(null!).Should().BeFalse();
    }

    [Fact]
    public void Shuffle_ResultPassesIsValidMapping()
    {
        var result = OptionShuffler.Shuffle(42);
        OptionShuffler.IsValidMapping(result).Should().BeTrue();
    }
}
