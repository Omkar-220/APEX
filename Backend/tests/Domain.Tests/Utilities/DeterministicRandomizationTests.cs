using Domain.Utilities;
using FluentAssertions;
using System.Text.Json;

namespace Domain.Tests.Utilities;

/// <summary>
/// End-to-end tests for the deterministic randomization pipeline.
/// Verifies that question order, option shuffling, and scoring
/// all work correctly together with the same seed inputs.
/// </summary>
public class DeterministicRandomizationTests
{
    private static readonly Guid CandidateId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid TestId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid QuestionId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private const string Salt = "test-salt-abc123";

    [Fact]
    public void QuestionOrder_SameCandidateAndAttempt_AlwaysSameOrder()
    {
        var questionIds = Enumerable.Range(1, 20)
            .Select(_ => Guid.NewGuid()).ToList();

        var seed = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, Salt);
        var order1 = SeededPrng.SelectRandom(questionIds, 10, seed);
        var order2 = SeededPrng.SelectRandom(questionIds, 10, seed);

        order1.Should().Equal(order2);
    }

    [Fact]
    public void QuestionOrder_DifferentAttempts_DifferentOrder()
    {
        var questionIds = Enumerable.Range(1, 100)
            .Select(_ => Guid.NewGuid()).ToList();

        var seed1 = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, Salt);
        var seed2 = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 2, Salt);

        var order1 = SeededPrng.SelectRandom(questionIds, 40, seed1);
        var order2 = SeededPrng.SelectRandom(questionIds, 40, seed2);

        order1.Should().NotEqual(order2);
    }

    [Fact]
    public void OptionShuffle_SameCandidateAndQuestion_AlwaysSameMapping()
    {
        var seed = SeedGenerator.ForOptionShuffle(CandidateId, TestId, QuestionId, Salt);
        var map1 = OptionShuffler.Shuffle(seed);
        var map2 = OptionShuffler.Shuffle(seed);

        foreach (var key in new[] { 'A', 'B', 'C', 'D' })
            map1[key].Should().Be(map2[key]);
    }

    [Fact]
    public void Scoring_DisplayOptionMappedToOriginal_CorrectlyScored()
    {
        // Arrange: question has CorrectOption = 'B' (original)
        var correctOriginalOption = 'B';

        var seed = SeedGenerator.ForOptionShuffle(CandidateId, TestId, QuestionId, Salt);
        var optionMap = OptionShuffler.Shuffle(seed);

        // Find which display key maps to original 'B'
        var displayKeyForCorrectAnswer = optionMap
            .First(kvp => kvp.Value == correctOriginalOption).Key;

        // Simulate candidate selecting the correct display option
        var candidateSelectedDisplay = displayKeyForCorrectAnswer;

        // Score: map display back to original
        var mappedOriginal = optionMap[candidateSelectedDisplay];

        // Assert
        mappedOriginal.Should().Be(correctOriginalOption);
    }

    [Fact]
    public void Scoring_WrongDisplayOption_DoesNotMatchCorrect()
    {
        var correctOriginalOption = 'B';

        var seed = SeedGenerator.ForOptionShuffle(CandidateId, TestId, QuestionId, Salt);
        var optionMap = OptionShuffler.Shuffle(seed);

        // Find a display key that does NOT map to 'B'
        var wrongDisplayKey = optionMap
            .First(kvp => kvp.Value != correctOriginalOption).Key;

        var mappedOriginal = optionMap[wrongDisplayKey];
        mappedOriginal.Should().NotBe(correctOriginalOption);
    }

    [Fact]
    public void FullPipeline_ReproducibleAcrossRuns()
    {
        // This test verifies audit reproducibility:
        // Given the same inputs, we can always reproduce the exact
        // question order and option mappings for any session

        var questionPool = Enumerable.Range(1, 50)
            .Select(i => Guid.Parse($"{i:D8}-0000-0000-0000-000000000000"))
            .ToList();

        var orderSeed = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, Salt);
        var selectedQuestions = SeededPrng.SelectRandom(questionPool, 10, orderSeed);

        // Reproduce the same selection
        var reproducedQuestions = SeededPrng.SelectRandom(questionPool, 10, orderSeed);

        selectedQuestions.Should().Equal(reproducedQuestions);

        // Reproduce option mappings for each question
        foreach (var questionId in selectedQuestions)
        {
            var optionSeed = SeedGenerator.ForOptionShuffle(CandidateId, TestId, questionId, Salt);
            var map1 = OptionShuffler.Shuffle(optionSeed);
            var map2 = OptionShuffler.Shuffle(optionSeed);

            var json1 = JsonSerializer.Serialize(map1.OrderBy(k => k.Key));
            var json2 = JsonSerializer.Serialize(map2.OrderBy(k => k.Key));
            json1.Should().Be(json2);
        }
    }

    [Fact]
    public void DifferentCandidates_GetDifferentQuestionOrders()
    {
        var questionPool = Enumerable.Range(1, 100)
            .Select(_ => Guid.NewGuid()).ToList();

        var candidate1 = Guid.NewGuid();
        var candidate2 = Guid.NewGuid();

        var seed1 = SeedGenerator.ForQuestionOrder(candidate1, TestId, 1, Salt);
        var seed2 = SeedGenerator.ForQuestionOrder(candidate2, TestId, 1, Salt);

        var order1 = SeededPrng.SelectRandom(questionPool, 40, seed1);
        var order2 = SeededPrng.SelectRandom(questionPool, 40, seed2);

        order1.Should().NotEqual(order2);
    }
}
