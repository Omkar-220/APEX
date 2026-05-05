using Domain.Utilities;
using FluentAssertions;

namespace Domain.Tests.Utilities;

public class SeedGeneratorTests
{
    private static readonly Guid CandidateId = Guid.NewGuid();
    private static readonly Guid TestId = Guid.NewGuid();
    private static readonly Guid QuestionId = Guid.NewGuid();
    private const string Salt = "test-salt-value";

    [Fact]
    public void ForQuestionOrder_SameInputs_ReturnsSameSeed()
    {
        var seed1 = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, Salt);
        var seed2 = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, Salt);
        seed1.Should().Be(seed2);
    }

    [Fact]
    public void ForOptionShuffle_SameInputs_ReturnsSameSeed()
    {
        var seed1 = SeedGenerator.ForOptionShuffle(CandidateId, TestId, QuestionId, Salt);
        var seed2 = SeedGenerator.ForOptionShuffle(CandidateId, TestId, QuestionId, Salt);
        seed1.Should().Be(seed2);
    }

    [Fact]
    public void ForQuestionOrder_DifferentAttemptNumbers_ReturnDifferentSeeds()
    {
        var seed1 = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, Salt);
        var seed2 = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 2, Salt);
        seed1.Should().NotBe(seed2);
    }

    [Fact]
    public void ForQuestionOrder_DifferentCandidates_ReturnDifferentSeeds()
    {
        var seed1 = SeedGenerator.ForQuestionOrder(Guid.NewGuid(), TestId, 1, Salt);
        var seed2 = SeedGenerator.ForQuestionOrder(Guid.NewGuid(), TestId, 1, Salt);
        seed1.Should().NotBe(seed2);
    }

    [Fact]
    public void ForOptionShuffle_DifferentQuestions_ReturnDifferentSeeds()
    {
        var seed1 = SeedGenerator.ForOptionShuffle(CandidateId, TestId, Guid.NewGuid(), Salt);
        var seed2 = SeedGenerator.ForOptionShuffle(CandidateId, TestId, Guid.NewGuid(), Salt);
        seed1.Should().NotBe(seed2);
    }

    [Fact]
    public void ForQuestionOrder_AndForOptionShuffle_ProduceDifferentSeeds()
    {
        // Same inputs (using QuestionId as stand-in for attemptNumber context)
        var orderSeed = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, Salt);
        var optionSeed = SeedGenerator.ForOptionShuffle(CandidateId, TestId, QuestionId, Salt);
        orderSeed.Should().NotBe(optionSeed);
    }

    [Fact]
    public void ForQuestionOrder_EmptySalt_ThrowsArgumentException()
    {
        Action act = () => SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, "");
        act.Should().Throw<ArgumentException>().WithMessage("*salt*");
    }

    [Fact]
    public void ForQuestionOrder_WhitespaceSalt_ThrowsArgumentException()
    {
        Action act = () => SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, "   ");
        act.Should().Throw<ArgumentException>().WithMessage("*salt*");
    }

    [Fact]
    public void ForQuestionOrder_ZeroAttemptNumber_ThrowsArgumentException()
    {
        Action act = () => SeedGenerator.ForQuestionOrder(CandidateId, TestId, 0, Salt);
        act.Should().Throw<ArgumentException>().WithMessage("*attempt*");
    }

    [Fact]
    public void ForQuestionOrder_NegativeAttemptNumber_ThrowsArgumentException()
    {
        Action act = () => SeedGenerator.ForQuestionOrder(CandidateId, TestId, -1, Salt);
        act.Should().Throw<ArgumentException>().WithMessage("*attempt*");
    }

    [Fact]
    public void ForOptionShuffle_EmptySalt_ThrowsArgumentException()
    {
        Action act = () => SeedGenerator.ForOptionShuffle(CandidateId, TestId, QuestionId, "");
        act.Should().Throw<ArgumentException>().WithMessage("*salt*");
    }

    [Fact]
    public void ForQuestionOrder_DifferentSalts_ReturnDifferentSeeds()
    {
        var seed1 = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, "salt-one");
        var seed2 = SeedGenerator.ForQuestionOrder(CandidateId, TestId, 1, "salt-two");
        seed1.Should().NotBe(seed2);
    }
}
