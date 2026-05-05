using Domain.Entities;
using Domain.Enums;
using Domain.Exceptions;
using FluentAssertions;

namespace Domain.Tests.Entities;

public class TestSessionTests
{
    private static TestSession CreateSession() =>
        TestSession.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "test-oid", 1);

    // ── ComputeTimeRemainingSec ───────────────────────────────────────────────

    [Fact]
    public void ComputeTimeRemainingSec_BeforeExpiry_ReturnsPositive()
    {
        var session = CreateSession();
        var result = session.ComputeTimeRemainingSec(60, DateTime.UtcNow.AddSeconds(1));
        result.Should().BeGreaterThan(0);
    }

    [Fact]
    public void ComputeTimeRemainingSec_AfterExpiry_ReturnsZero()
    {
        var session = CreateSession();
        var result = session.ComputeTimeRemainingSec(60, DateTime.UtcNow.AddMinutes(61));
        result.Should().Be(0);
    }

    [Fact]
    public void ComputeTimeRemainingSec_NeverReturnsNegative()
    {
        var session = CreateSession();
        var result = session.ComputeTimeRemainingSec(60, DateTime.UtcNow.AddHours(5));
        result.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public void ComputeTimeRemainingSec_ExactlyAtExpiry_ReturnsZero()
    {
        var session = CreateSession();
        var result = session.ComputeTimeRemainingSec(60, session.StartTime.AddMinutes(60));
        result.Should().Be(0);
    }

    // ── ValidateCanRecordAnswer ───────────────────────────────────────────────

    [Fact]
    public void ValidateCanRecordAnswer_ActiveWithTimeRemaining_DoesNotThrow()
    {
        var session = CreateSession();
        Action act = () => session.ValidateCanRecordAnswer(60, DateTime.UtcNow.AddSeconds(1));
        act.Should().NotThrow();
    }

    [Fact]
    public void ValidateCanRecordAnswer_TimeExpired_ThrowsSessionExpiredException()
    {
        var session = CreateSession();
        Action act = () => session.ValidateCanRecordAnswer(60, DateTime.UtcNow.AddMinutes(61));
        act.Should().Throw<SessionExpiredException>()
            .Which.SessionId.Should().Be(session.SessionId);
    }

    [Fact]
    public void ValidateCanRecordAnswer_AlreadyCompleted_ThrowsSessionExpiredException()
    {
        var session = CreateSession();
        session.Finalize(10, DateTime.UtcNow);

        Action act = () => session.ValidateCanRecordAnswer(60, DateTime.UtcNow.AddSeconds(1));
        act.Should().Throw<SessionExpiredException>();
    }

    [Fact]
    public void ValidateCanRecordAnswer_Expired_ThrowsSessionExpiredException()
    {
        var session = CreateSession();
        session.MarkExpired(DateTime.UtcNow);

        Action act = () => session.ValidateCanRecordAnswer(60, DateTime.UtcNow.AddSeconds(1));
        act.Should().Throw<SessionExpiredException>();
    }

    // ── Finalize ──────────────────────────────────────────────────────────────

    [Fact]
    public void Finalize_ActiveSession_ReturnsTrueAndSetsScore()
    {
        var session = CreateSession();
        var result = session.Finalize(42, DateTime.UtcNow);

        result.Should().BeTrue();
        session.Score.Should().Be(42);
        session.Status.Should().Be(TestSessionStatus.Completed);
        session.EndTime.Should().NotBeNull();
    }

    [Fact]
    public void Finalize_AlreadyCompleted_ReturnsFalse()
    {
        var session = CreateSession();
        session.Finalize(42, DateTime.UtcNow);

        var result = session.Finalize(99, DateTime.UtcNow);

        result.Should().BeFalse();
        session.Score.Should().Be(42); // original score preserved
    }

    [Fact]
    public void Finalize_IsIdempotent_ScoreUnchangedOnSecondCall()
    {
        var session = CreateSession();
        session.Finalize(10, DateTime.UtcNow);
        session.Finalize(99, DateTime.UtcNow);

        session.Score.Should().Be(10);
    }

    // ── MarkExpired ───────────────────────────────────────────────────────────

    [Fact]
    public void MarkExpired_ActiveSession_SetsExpiredStatus()
    {
        var session = CreateSession();
        session.MarkExpired(DateTime.UtcNow);

        session.Status.Should().Be(TestSessionStatus.Expired);
        session.EndTime.Should().NotBeNull();
    }

    [Fact]
    public void MarkExpired_AlreadyCompleted_DoesNotChangeStatus()
    {
        var session = CreateSession();
        session.Finalize(10, DateTime.UtcNow);
        session.MarkExpired(DateTime.UtcNow);

        session.Status.Should().Be(TestSessionStatus.Completed);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    [Fact]
    public void Create_ValidInputs_SetsCorrectDefaults()
    {
        var assignmentId = Guid.NewGuid();
        var candidateId = Guid.NewGuid();
        var testId = Guid.NewGuid();

        var session = TestSession.Create(assignmentId, candidateId, testId, "oid-123", 1);

        session.SessionId.Should().NotBeEmpty();
        session.Status.Should().Be(TestSessionStatus.Active);
        session.Score.Should().BeNull();
        session.EndTime.Should().BeNull();
        session.AttemptNumber.Should().Be(1);
    }

    [Fact]
    public void Create_EmptyAssignmentId_ThrowsArgumentException()
    {
        Action act = () => TestSession.Create(Guid.Empty, Guid.NewGuid(), Guid.NewGuid(), "oid", 1);
        act.Should().Throw<ArgumentException>().WithMessage("*AssignmentId*");
    }

    [Fact]
    public void Create_EmptyCandidateId_ThrowsArgumentException()
    {
        Action act = () => TestSession.Create(Guid.NewGuid(), Guid.Empty, Guid.NewGuid(), "oid", 1);
        act.Should().Throw<ArgumentException>().WithMessage("*CandidateId*");
    }

    [Fact]
    public void Create_EmptyOid_ThrowsArgumentException()
    {
        Action act = () => TestSession.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "", 1);
        act.Should().Throw<ArgumentException>().WithMessage("*OID*");
    }

    [Fact]
    public void Create_ZeroAttemptNumber_ThrowsArgumentException()
    {
        Action act = () => TestSession.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "oid", 0);
        act.Should().Throw<ArgumentException>().WithMessage("*AttemptNumber*");
    }
}
