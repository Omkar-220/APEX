using Domain.Entities;
using Domain.Enums;
using Domain.Exceptions;
using FluentAssertions;

namespace Domain.Tests.Entities;

public class TestAssignmentTests
{
    private static readonly Guid TestId = Guid.NewGuid();
    private static readonly Guid QuestionBatchId = Guid.NewGuid();
    private static readonly Guid BatchId = Guid.NewGuid();
    private static readonly Guid CandidateId = Guid.NewGuid();

    private static TestAssignment CreateBatchAssignment(
        DateTime? start = null, DateTime? deadline = null, int maxAttempts = 1) =>
        TestAssignment.CreateForBatch(
            TestId, QuestionBatchId, BatchId, 40,
            start ?? DateTime.UtcNow.AddMinutes(-5),
            deadline ?? DateTime.UtcNow.AddHours(2),
            maxAttempts);

    // ── IsWithinWindow ────────────────────────────────────────────────────────

    [Fact]
    public void IsWithinWindow_DuringWindow_ReturnsTrue()
    {
        var assignment = CreateBatchAssignment();
        assignment.IsWithinWindow(DateTime.UtcNow).Should().BeTrue();
    }

    [Fact]
    public void IsWithinWindow_BeforeStart_ReturnsFalse()
    {
        var assignment = CreateBatchAssignment(
            start: DateTime.UtcNow.AddHours(1),
            deadline: DateTime.UtcNow.AddHours(3));

        assignment.IsWithinWindow(DateTime.UtcNow).Should().BeFalse();
    }

    [Fact]
    public void IsWithinWindow_AfterDeadline_ReturnsFalse()
    {
        var assignment = CreateBatchAssignment(
            start: DateTime.UtcNow.AddHours(-3),
            deadline: DateTime.UtcNow.AddHours(-1));

        assignment.IsWithinWindow(DateTime.UtcNow).Should().BeFalse();
    }

    // ── ValidateCanStart ──────────────────────────────────────────────────────

    [Fact]
    public void ValidateCanStart_WithinWindowNoAttempts_DoesNotThrow()
    {
        var assignment = CreateBatchAssignment();
        Action act = () => assignment.ValidateCanStart(DateTime.UtcNow, 0);
        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateCanStart_BeforeWindow_ThrowsInvalidTimeWindowException()
    {
        var assignment = CreateBatchAssignment(
            start: DateTime.UtcNow.AddHours(1),
            deadline: DateTime.UtcNow.AddHours(3));

        Action act = () => assignment.ValidateCanStart(DateTime.UtcNow, 0);
        act.Should().Throw<InvalidTimeWindowException>()
            .Which.AssignmentId.Should().Be(assignment.AssignmentId);
    }

    [Fact]
    public void ValidateCanStart_AfterDeadline_ThrowsInvalidTimeWindowException()
    {
        var assignment = CreateBatchAssignment(
            start: DateTime.UtcNow.AddHours(-3),
            deadline: DateTime.UtcNow.AddHours(-1));

        Action act = () => assignment.ValidateCanStart(DateTime.UtcNow, 0);
        act.Should().Throw<InvalidTimeWindowException>();
    }

    [Fact]
    public void ValidateCanStart_AttemptsEqualMax_ThrowsMaxAttemptsExceededException()
    {
        var assignment = CreateBatchAssignment(maxAttempts: 1);
        Action act = () => assignment.ValidateCanStart(DateTime.UtcNow, 1);
        act.Should().Throw<MaxAttemptsExceededException>()
            .Which.MaxAttempts.Should().Be(1);
    }

    [Fact]
    public void ValidateCanStart_AttemptsExceedMax_ThrowsMaxAttemptsExceededException()
    {
        var assignment = CreateBatchAssignment(maxAttempts: 2);
        Action act = () => assignment.ValidateCanStart(DateTime.UtcNow, 3);
        act.Should().Throw<MaxAttemptsExceededException>();
    }

    [Fact]
    public void ValidateCanStart_AttemptsLessThanMax_DoesNotThrow()
    {
        var assignment = CreateBatchAssignment(maxAttempts: 3);
        Action act = () => assignment.ValidateCanStart(DateTime.UtcNow, 2);
        act.Should().NotThrow();
    }

    // ── CreateForBatch / CreateForCandidate ───────────────────────────────────

    [Fact]
    public void CreateForBatch_SetsBatchIdAndNullCandidateId()
    {
        var assignment = CreateBatchAssignment();
        assignment.BatchId.Should().Be(BatchId);
        assignment.CandidateId.Should().BeNull();
    }

    [Fact]
    public void CreateForCandidate_SetsCandidateIdAndNullBatchId()
    {
        var assignment = TestAssignment.CreateForCandidate(
            TestId, QuestionBatchId, CandidateId, 40,
            DateTime.UtcNow.AddMinutes(-5), DateTime.UtcNow.AddHours(2));

        assignment.CandidateId.Should().Be(CandidateId);
        assignment.BatchId.Should().BeNull();
    }

    [Fact]
    public void CreateForBatch_DefaultStatus_IsPending()
    {
        var assignment = CreateBatchAssignment();
        assignment.Status.Should().Be(AssignmentStatus.Pending);
    }

    [Fact]
    public void CreateForBatch_DeadlineBeforeStart_ThrowsArgumentException()
    {
        Action act = () => TestAssignment.CreateForBatch(
            TestId, QuestionBatchId, BatchId, 40,
            DateTime.UtcNow.AddHours(2),
            DateTime.UtcNow.AddHours(1)); // deadline before start

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void CreateForBatch_ZeroQuestionCount_ThrowsArgumentException()
    {
        Action act = () => TestAssignment.CreateForBatch(
            TestId, QuestionBatchId, BatchId, 0,
            DateTime.UtcNow, DateTime.UtcNow.AddHours(2));

        act.Should().Throw<ArgumentException>().WithMessage("*QuestionCount*");
    }

    // ── Status transitions ────────────────────────────────────────────────────

    [Fact]
    public void MarkExpired_SetsExpiredStatus()
    {
        var assignment = CreateBatchAssignment();
        assignment.MarkExpired();
        assignment.Status.Should().Be(AssignmentStatus.Expired);
    }

    [Fact]
    public void MarkCompleted_SetsCompletedStatus()
    {
        var assignment = CreateBatchAssignment();
        assignment.MarkCompleted();
        assignment.Status.Should().Be(AssignmentStatus.Completed);
    }

    [Fact]
    public void MarkActive_SetsActiveStatus()
    {
        var assignment = CreateBatchAssignment();
        assignment.MarkActive();
        assignment.Status.Should().Be(AssignmentStatus.Active);
    }
}
