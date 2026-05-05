using Domain.Exceptions;

namespace Domain.Entities;

public class Question
{
    public Guid QuestionId { get; private set; }
    public string Content { get; private set; }
    public string OptionA { get; private set; }
    public string OptionB { get; private set; }
    public string OptionC { get; private set; }
    public string OptionD { get; private set; }
    public char CorrectOption { get; private set; }
    public Guid CreatedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public decimal Weightage { get; private set; }

    // Navigation properties
    public Candidate? CreatedByCandidate { get; private set; }
    public ICollection<QuestionBatchMember> QuestionBatchMemberships { get; private set; } = new List<QuestionBatchMember>();
    public ICollection<SessionQuestionMapping> SessionMappings { get; private set; } = new List<SessionQuestionMapping>();
    public ICollection<Answer> Answers { get; private set; } = new List<Answer>();

    private Question()
    {
        Content = null!;
        OptionA = null!;
        OptionB = null!;
        OptionC = null!;
        OptionD = null!;
    }

    // Internal — only QuestionBatch can create questions
    public static Question Create(
        string content,
        string optionA,
        string optionB,
        string optionC,
        string optionD,
        char correctOption,
        Guid createdBy,
        decimal weightage = 1)
    {
        ValidateOption(correctOption);

        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Question content cannot be empty.", nameof(content));

        if (string.IsNullOrWhiteSpace(optionA) || string.IsNullOrWhiteSpace(optionB) ||
            string.IsNullOrWhiteSpace(optionC) || string.IsNullOrWhiteSpace(optionD))
            throw new ArgumentException("All options must have a value.");

        if (createdBy == Guid.Empty)
            throw new ArgumentException("CreatedBy cannot be empty.", nameof(createdBy));

        if (weightage <= 0)
            throw new ArgumentException("Weightage must be greater than 0.", nameof(weightage));

        return new Question
        {
            QuestionId = Guid.NewGuid(),
            Content = content.Trim(),
            OptionA = optionA.Trim(),
            OptionB = optionB.Trim(),
            OptionC = optionC.Trim(),
            OptionD = optionD.Trim(),
            CorrectOption = char.ToUpperInvariant(correctOption),
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            Weightage = weightage
        };
    }

    public string GetOptionText(char option)
    {
        return char.ToUpperInvariant(option) switch
        {
            'A' => OptionA,
            'B' => OptionB,
            'C' => OptionC,
            'D' => OptionD,
            _ => throw new InvalidOptionException(option)
        };
    }

    public bool IsCorrectOption(char option) =>
        char.ToUpperInvariant(option) == CorrectOption;

    private static void ValidateOption(char option)
    {
        if (!"ABCD".Contains(char.ToUpperInvariant(option)))
            throw new InvalidOptionException(option);
    }
}
