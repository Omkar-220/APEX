using Domain.Exceptions;

namespace Domain.Entities;

public class Answer
{
    public Guid AnswerId { get; private set; }
    public Guid SessionId { get; private set; }
    public Guid QuestionId { get; private set; }
    public char SelectedOption { get; private set; }
    public Guid IdempotencyKey { get; private set; }
    public DateTime SubmittedAt { get; private set; }

    // Navigation properties
    public TestSession Session { get; private set; } = null!;
    public Question Question { get; private set; } = null!;

    private Answer() { }

    public static Answer Create(Guid sessionId, Guid questionId, char selectedOption, Guid idempotencyKey)
    {
        if (sessionId == Guid.Empty) throw new ArgumentException("SessionId cannot be empty.", nameof(sessionId));
        if (questionId == Guid.Empty) throw new ArgumentException("QuestionId cannot be empty.", nameof(questionId));
        if (idempotencyKey == Guid.Empty) throw new ArgumentException("IdempotencyKey cannot be empty.", nameof(idempotencyKey));

        if (!"ABCD".Contains(char.ToUpperInvariant(selectedOption)))
            throw new InvalidOptionException(selectedOption);

        return new Answer
        {
            AnswerId = Guid.NewGuid(),
            SessionId = sessionId,
            QuestionId = questionId,
            SelectedOption = char.ToUpperInvariant(selectedOption),
            IdempotencyKey = idempotencyKey,
            SubmittedAt = DateTime.UtcNow
        };
    }
}
