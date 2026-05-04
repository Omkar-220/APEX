using Domain.Enums;
using Domain.Exceptions;

namespace Domain.Entities;

public class TestAssignment
{
    public Guid AssignmentId { get; private set; }
    public Guid TestId { get; private set; }
    public Guid QuestionBatchId { get; private set; }
    public Guid? BatchId { get; private set; }
    public Guid? CandidateId { get; private set; }
    public int QuestionCount { get; private set; }
    public DateTime ScheduledStart { get; private set; }
    public DateTime Deadline { get; private set; }
    public AssignmentStatus Status { get; private set; }
    public int MaxAttempts { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation properties
    public Test Test { get; private set; } = null!;
    public QuestionBatch QuestionBatch { get; private set; } = null!;
    public Batch? Batch { get; private set; }
    public Candidate? Candidate { get; private set; }
    public ICollection<TestSession> TestSessions { get; private set; } = new List<TestSession>();

    private TestAssignment() { }

    public static TestAssignment CreateForBatch(
        Guid testId, Guid questionBatchId, Guid batchId,
        int questionCount, DateTime scheduledStart, DateTime deadline, int maxAttempts = 1)
    {
        Validate(testId, questionBatchId, questionCount, scheduledStart, deadline, maxAttempts);
        return new TestAssignment
        {
            AssignmentId = Guid.NewGuid(),
            TestId = testId,
            QuestionBatchId = questionBatchId,
            BatchId = batchId,
            CandidateId = null,
            QuestionCount = questionCount,
            ScheduledStart = scheduledStart,
            Deadline = deadline,
            Status = AssignmentStatus.Pending,
            MaxAttempts = maxAttempts,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static TestAssignment CreateForCandidate(
        Guid testId, Guid questionBatchId, Guid candidateId,
        int questionCount, DateTime scheduledStart, DateTime deadline, int maxAttempts = 1)
    {
        Validate(testId, questionBatchId, questionCount, scheduledStart, deadline, maxAttempts);
        return new TestAssignment
        {
            AssignmentId = Guid.NewGuid(),
            TestId = testId,
            QuestionBatchId = questionBatchId,
            BatchId = null,
            CandidateId = candidateId,
            QuestionCount = questionCount,
            ScheduledStart = scheduledStart,
            Deadline = deadline,
            Status = AssignmentStatus.Pending,
            MaxAttempts = maxAttempts,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Checks whether the assignment is within its active time window.
    /// </summary>
    public bool IsWithinWindow(DateTime utcNow) =>
        utcNow >= ScheduledStart && utcNow <= Deadline;

    /// <summary>
    /// Validates that a new session can be started against this assignment.
    /// Throws domain exceptions on violation.
    /// </summary>
    public void ValidateCanStart(DateTime utcNow, int existingAttempts)
    {
        if (!IsWithinWindow(utcNow))
            throw new InvalidTimeWindowException(AssignmentId, ScheduledStart, Deadline, utcNow);

        if (existingAttempts >= MaxAttempts)
            throw new MaxAttemptsExceededException(AssignmentId, MaxAttempts, existingAttempts);
    }

    public void MarkExpired() => Status = AssignmentStatus.Expired;
    public void MarkCompleted() => Status = AssignmentStatus.Completed;
    public void MarkActive() => Status = AssignmentStatus.Active;

    private static void Validate(Guid testId, Guid questionBatchId, int questionCount,
        DateTime scheduledStart, DateTime deadline, int maxAttempts)
    {
        if (testId == Guid.Empty) throw new ArgumentException("TestId cannot be empty.", nameof(testId));
        if (questionBatchId == Guid.Empty) throw new ArgumentException("QuestionBatchId cannot be empty.", nameof(questionBatchId));
        if (questionCount <= 0) throw new ArgumentException("QuestionCount must be positive.", nameof(questionCount));
        if (deadline <= scheduledStart) throw new ArgumentException("Deadline must be after ScheduledStart.");
        if (maxAttempts <= 0) throw new ArgumentException("MaxAttempts must be positive.", nameof(maxAttempts));
    }
}
