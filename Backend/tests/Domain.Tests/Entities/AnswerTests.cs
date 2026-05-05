using Domain.Entities;
using Domain.Exceptions;
using FluentAssertions;

namespace Domain.Tests.Entities;

public class AnswerTests
{
    private static readonly Guid SessionId = Guid.NewGuid();
    private static readonly Guid QuestionId = Guid.NewGuid();
    private static readonly Guid IdempotencyKey = Guid.NewGuid();

    [Theory]
    [InlineData('A')]
    [InlineData('B')]
    [InlineData('C')]
    [InlineData('D')]
    public void Create_ValidOption_Succeeds(char option)
    {
        var answer = Answer.Create(SessionId, QuestionId, option, IdempotencyKey);
        answer.SelectedOption.Should().Be(char.ToUpperInvariant(option));
    }

    [Theory]
    [InlineData('a')]
    [InlineData('b')]
    [InlineData('c')]
    [InlineData('d')]
    public void Create_LowercaseOption_NormalizesToUppercase(char option)
    {
        var answer = Answer.Create(SessionId, QuestionId, option, IdempotencyKey);
        answer.SelectedOption.Should().Be(char.ToUpperInvariant(option));
    }

    [Theory]
    [InlineData('E')]
    [InlineData('Z')]
    [InlineData('1')]
    [InlineData(' ')]
    public void Create_InvalidOption_ThrowsInvalidOptionException(char option)
    {
        Action act = () => Answer.Create(SessionId, QuestionId, option, IdempotencyKey);
        act.Should().Throw<InvalidOptionException>()
            .Which.ProvidedOption.Should().Be(option);
    }

    [Fact]
    public void Create_EmptySessionId_ThrowsArgumentException()
    {
        Action act = () => Answer.Create(Guid.Empty, QuestionId, 'A', IdempotencyKey);
        act.Should().Throw<ArgumentException>().WithMessage("*SessionId*");
    }

    [Fact]
    public void Create_EmptyQuestionId_ThrowsArgumentException()
    {
        Action act = () => Answer.Create(SessionId, Guid.Empty, 'A', IdempotencyKey);
        act.Should().Throw<ArgumentException>().WithMessage("*QuestionId*");
    }

    [Fact]
    public void Create_EmptyIdempotencyKey_ThrowsArgumentException()
    {
        Action act = () => Answer.Create(SessionId, QuestionId, 'A', Guid.Empty);
        act.Should().Throw<ArgumentException>().WithMessage("*IdempotencyKey*");
    }

    [Fact]
    public void Create_SetsCorrectProperties()
    {
        var answer = Answer.Create(SessionId, QuestionId, 'B', IdempotencyKey);

        answer.AnswerId.Should().NotBeEmpty();
        answer.SessionId.Should().Be(SessionId);
        answer.QuestionId.Should().Be(QuestionId);
        answer.SelectedOption.Should().Be('B');
        answer.IdempotencyKey.Should().Be(IdempotencyKey);
        answer.SubmittedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }
}
