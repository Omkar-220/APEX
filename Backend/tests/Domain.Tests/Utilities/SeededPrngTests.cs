using Domain.Utilities;
using FluentAssertions;

namespace Domain.Tests.Utilities;

public class SeededPrngTests
{
    [Fact]
    public void Shuffle_SameSeed_ProducesSameOrder()
    {
        var list1 = new List<int> { 1, 2, 3, 4, 5 };
        var list2 = new List<int> { 1, 2, 3, 4, 5 };

        SeededPrng.Shuffle(list1, 42);
        SeededPrng.Shuffle(list2, 42);

        list1.Should().Equal(list2);
    }

    [Fact]
    public void Shuffle_DifferentSeeds_ProduceDifferentOrders()
    {
        var list1 = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
        var list2 = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        SeededPrng.Shuffle(list1, 42);
        SeededPrng.Shuffle(list2, 99);

        list1.Should().NotEqual(list2);
    }

    [Fact]
    public void Shuffle_ContainsSameElements_JustReordered()
    {
        var original = new List<int> { 1, 2, 3, 4, 5 };
        var list = new List<int> { 1, 2, 3, 4, 5 };

        SeededPrng.Shuffle(list, 42);

        list.Should().BeEquivalentTo(original);
    }

    [Fact]
    public void Shuffle_SingleElement_NoChange()
    {
        var list = new List<int> { 99 };
        SeededPrng.Shuffle(list, 42);
        list.Should().Equal(new List<int> { 99 });
    }

    [Fact]
    public void Shuffle_NullList_ThrowsArgumentNullException()
    {
        Action act = () => SeededPrng.Shuffle<int>(null!, 42);
        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void SelectRandom_ReturnsCorrectCount()
    {
        var source = Enumerable.Range(1, 20).ToList();
        var result = SeededPrng.SelectRandom(source, 10, 42);
        result.Should().HaveCount(10);
    }

    [Fact]
    public void SelectRandom_SameSeed_ReturnsSameSubset()
    {
        var source = Enumerable.Range(1, 20).ToList();
        var result1 = SeededPrng.SelectRandom(source, 10, 42);
        var result2 = SeededPrng.SelectRandom(source, 10, 42);
        result1.Should().Equal(result2);
    }

    [Fact]
    public void SelectRandom_DifferentSeeds_ReturnDifferentSubsets()
    {
        var source = Enumerable.Range(1, 100).ToList();
        var result1 = SeededPrng.SelectRandom(source, 50, 42);
        var result2 = SeededPrng.SelectRandom(source, 50, 99);
        result1.Should().NotEqual(result2);
    }

    [Fact]
    public void SelectRandom_CountEqualsSource_ReturnsAll()
    {
        var source = new List<int> { 1, 2, 3 };
        var result = SeededPrng.SelectRandom(source, 3, 42);
        result.Should().BeEquivalentTo(source);
    }

    [Fact]
    public void SelectRandom_CountZero_ReturnsEmpty()
    {
        var source = new List<int> { 1, 2, 3 };
        var result = SeededPrng.SelectRandom(source, 0, 42);
        result.Should().BeEmpty();
    }

    [Fact]
    public void SelectRandom_CountExceedsSource_ThrowsArgumentException()
    {
        var source = new List<int> { 1, 2, 3 };
        Action act = () => SeededPrng.SelectRandom(source, 5, 42);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void SelectRandom_ResultIsSubsetOfSource()
    {
        var source = Enumerable.Range(1, 20).ToList();
        var result = SeededPrng.SelectRandom(source, 10, 42);
        result.Should().OnlyContain(x => source.Contains(x));
    }

    [Fact]
    public void SelectRandom_NoDuplicatesInResult()
    {
        var source = Enumerable.Range(1, 20).ToList();
        var result = SeededPrng.SelectRandom(source, 10, 42);
        result.Should().OnlyHaveUniqueItems();
    }
}
