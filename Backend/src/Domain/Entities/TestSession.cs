using Domain.Enums;
using Domain.Exceptions;

namespace Domain.Entities;

public class TestSession
{
    public Guid SessionId { get; private set; }
    public Guid AssignmentId { get; private set; }
    public Guid CandidateId { get; private set; }
    public Guid TestId { get; private set; }
    public string CandidateAzureAdOid { get; private set; }
    public int AttemptNumber { get; private set; }
    public DateTime StartTime { get; private set; }
    public DateTime? EndTime { get; private set; }
    public TestSessionStatus Status { get; private set; }
    public int? Score { get; private set; }

    // EF Core concurrency token — mapped as ROWVERSION
    public byte[] RowVersion { get; private set; }

    // Navigation properties
    public TestAssignment Assignment { get; private set; } = null!;
    public Candidate Candidate { get; private set; } = null!;
    public Test Test { get; private set; } = null!;
    public ICollection<SessionQuestionMapping> QuestionMappings { get; private set; } = new List<SessionQuestionMapping>();
    public ICollection<Answer> Answers { get; private set; } = new List<Answer>();
    public ICollection<AuditEvent> AuditEvents { get; private set; } = new List<AuditEvent>();

    private TestSession()
    {
        CandidateAzureAdOid = null!;
        RowVersion = null!;
    }

    public static TestSession Create(
        Guid assignmentId, Guid candidateId, Guid testId,
        string candidateAzureAdOid, int attemptNumber)
    {
        if (assignmentId == Guid.Empty) throw new ArgumentException("AssignmentId cannot be empty.", nameof(assignmentId));
        if (candidateId == Guid.Empty) throw new ArgumentException("CandidateId cannot be empty.", nameof(candidateId));
        if (testId == Guid.Empty) throw new ArgumentException("TestId cannot be empty.", nameof(testId));
        if (string.IsNullOrWhiteSpace(candidateAzureAdOid)) throw new ArgumentException("CandidateAzureAdOid cannot be empty.", nameof(candidateAzureAdOid));
        if (attemptNumber <= 0) throw new ArgumentException("AttemptNumber must be positive.", nameof(attemptNumber));

        return new TestSession
        {
            SessionId = Guid.NewGuid(),
            AssignmentId = assignmentId,
            CandidateId = candidateId,
            TestId = testId,
            CandidateAzureAdOid = candidateAzureAdOid,
            AttemptNumber = attemptNumber,
            StartTime = DateTime.UtcNow,
            Status = TestSessionStatus.Active,
            RowVersion = Array.Empty<byte>()
        };
    }

    /// <summary>
    /// Computes remaining seconds. Server is sole authority — never stored.
    /// </summary>
    public int ComputeTimeRemainingSec(int durationMinutes, DateTime utcNow)
    {
        var elapsed = (utcNow - StartTime).TotalSeconds;
        return (int)Math.Max(0, durationMinutes * 60 - elapsed);
    }

    /// <summary>
    /// Validates that an answer can be recorded. Throws on violation.
    /// </summary>
    public void ValidateCanRecordAnswer(int durationMinutes, DateTime utcNow)
    {
        if (Status != TestSessionStatus.Active)
            throw new SessionExpiredException(SessionId);

        if (ComputeTimeRemainingSec(durationMinutes, utcNow) <= 0)
            throw new SessionExpiredException(SessionId, $"Session {SessionId} time has expired.");
    }

    /// <summary>
    /// Finalizes the session. Idempotent — safe to call multiple times.
    /// Returns false if already finalized (concurrency guard for callers).
    /// </summary>
    public bool Finalize(int score, DateTime utcNow)
    {
        if (Status != TestSessionStatus.Active)
            return false; // already finalized — idempotent

        Score = score;
        EndTime = utcNow;
        Status = TestSessionStatus.Completed;
        return true;
    }

    public void MarkExpired(DateTime utcNow)
    {
        if (Status != TestSessionStatus.Active) return;
        EndTime = utcNow;
        Status = TestSessionStatus.Expired;
    }
}
