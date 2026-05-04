namespace Domain.Entities;

/// <summary>
/// Maps a question to its position in a session, with shuffled option mapping.
/// OptionMapping JSON: { "A": "C", ... } — Key = display option, Value = original option.
/// </summary>
public class SessionQuestionMapping
{
    public Guid MappingId { get; private set; }
    public Guid SessionId { get; private set; }
    public int QuestionPosition { get; private set; }
    public Guid QuestionId { get; private set; }
    public string OptionMapping { get; private set; } // JSON

    // Navigation properties
    public TestSession Session { get; private set; } = null!;
    public Question Question { get; private set; } = null!;

    private SessionQuestionMapping() { OptionMapping = null!; }

    public static SessionQuestionMapping Create(
        Guid sessionId, int questionPosition, Guid questionId, string optionMappingJson)
    {
        if (sessionId == Guid.Empty) throw new ArgumentException("SessionId cannot be empty.", nameof(sessionId));
        if (questionId == Guid.Empty) throw new ArgumentException("QuestionId cannot be empty.", nameof(questionId));
        if (questionPosition < 1) throw new ArgumentException("QuestionPosition must be >= 1.", nameof(questionPosition));
        if (string.IsNullOrWhiteSpace(optionMappingJson)) throw new ArgumentException("OptionMapping cannot be empty.", nameof(optionMappingJson));

        return new SessionQuestionMapping
        {
            MappingId = Guid.NewGuid(),
            SessionId = sessionId,
            QuestionPosition = questionPosition,
            QuestionId = questionId,
            OptionMapping = optionMappingJson
        };
    }
}
