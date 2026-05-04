namespace Domain.Entities;

public class QuestionBatchMember
{
    public Guid QuestionBatchId { get; private set; }
    public Guid QuestionId { get; private set; }

    // Navigation properties
    public QuestionBatch QuestionBatch { get; private set; } = null!;
    public Question Question { get; private set; } = null!;

    private QuestionBatchMember() { }

    public static QuestionBatchMember Create(Guid questionBatchId, Guid questionId)
    {
        if (questionBatchId == Guid.Empty) throw new ArgumentException("QuestionBatchId cannot be empty.", nameof(questionBatchId));
        if (questionId == Guid.Empty) throw new ArgumentException("QuestionId cannot be empty.", nameof(questionId));

        return new QuestionBatchMember
        {
            QuestionBatchId = questionBatchId,
            QuestionId = questionId
        };
    }
}
