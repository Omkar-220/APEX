using Application.Commands;
using Application.DTOs;
using Application.Queries;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Ports.Repositories;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace Application.Tests.Queries;

public class GetMyAssignmentsHandlerTests
{
    private readonly Mock<ITestAssignmentRepository> _assignmentRepo = new();
    private readonly Mock<IBatchRepository> _batchRepo = new();
    private readonly Mock<ISessionRepository> _sessionRepo = new();
    private readonly GetMyAssignmentsHandler _sut;

    private static readonly Guid CandidateId = Guid.NewGuid();

    public GetMyAssignmentsHandlerTests()
    {
        _sessionRepo
            .Setup(r => r.GetLatestCompletedByAssignmentsAsync(It.IsAny<IEnumerable<Guid>>(), default))
            .ReturnsAsync(new Dictionary<Guid, Domain.Entities.TestSession>());

        _sut = new GetMyAssignmentsHandler(_assignmentRepo.Object, _batchRepo.Object, _sessionRepo.Object);
    }

    private TestAssignment MakeAssignment(
        AssignmentStatus status = AssignmentStatus.Pending,
        DateTime? start = null,
        bool forCandidate = true)
    {
        var testStart = start ?? DateTime.UtcNow.AddMinutes(-5);
        var testDeadline = testStart.AddHours(4); // always after start

        var assignment = forCandidate
            ? TestBuilders.MakeCandidateAssignment(candidateId: CandidateId,
                start: testStart, deadline: testDeadline)
            : TestBuilders.MakeBatchAssignment(
                start: testStart, deadline: testDeadline);

        // Populate Test nav property so handler can access a.Test.Title etc.
        assignment.Test = TestBuilders.MakeTest();

        if (status == AssignmentStatus.Completed) assignment.MarkCompleted();
        if (status == AssignmentStatus.Expired) assignment.MarkExpired();
        if (status == AssignmentStatus.Active) assignment.MarkActive();

        return assignment;
    }

    [Fact]
    public async Task Handle_DirectAssignments_ReturnsAll()
    {
        var assignments = new List<TestAssignment>
        {
            MakeAssignment(AssignmentStatus.Pending),
            MakeAssignment(AssignmentStatus.Completed)
        };

        _assignmentRepo.Setup(r => r.GetForCandidateAsync(CandidateId, default))
                       .ReturnsAsync(assignments);
        _batchRepo.Setup(r => r.GetBatchIdsForCandidateAsync(CandidateId, default))
                  .ReturnsAsync(new List<Guid>());

        var result = await _sut.HandleAsync(new GetMyAssignmentsQuery(CandidateId));

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_BatchAssignments_MergedWithDirect()
    {
        var batchId = Guid.NewGuid();
        var directAssignment = MakeAssignment(AssignmentStatus.Pending);
        var batchAssignment = MakeAssignment(AssignmentStatus.Pending, forCandidate: false);

        _assignmentRepo.Setup(r => r.GetForCandidateAsync(CandidateId, default))
                       .ReturnsAsync(new List<TestAssignment> { directAssignment });
        _batchRepo.Setup(r => r.GetBatchIdsForCandidateAsync(CandidateId, default))
                  .ReturnsAsync(new List<Guid> { batchId });
        _assignmentRepo.Setup(r => r.GetForBatchesAsync(It.IsAny<IEnumerable<Guid>>(), default))
                       .ReturnsAsync(new List<TestAssignment> { batchAssignment });

        var result = await _sut.HandleAsync(new GetMyAssignmentsQuery(CandidateId));

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task Handle_DuplicateAssignment_Deduplicated()
    {
        var assignment = MakeAssignment(AssignmentStatus.Pending);

        _assignmentRepo.Setup(r => r.GetForCandidateAsync(CandidateId, default))
                       .ReturnsAsync(new List<TestAssignment> { assignment });
        _batchRepo.Setup(r => r.GetBatchIdsForCandidateAsync(CandidateId, default))
                  .ReturnsAsync(new List<Guid> { Guid.NewGuid() });
        _assignmentRepo.Setup(r => r.GetForBatchesAsync(It.IsAny<IEnumerable<Guid>>(), default))
                       .ReturnsAsync(new List<TestAssignment> { assignment }); // same assignment

        var result = await _sut.HandleAsync(new GetMyAssignmentsQuery(CandidateId));

        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task Handle_PendingFarInFuture_Excluded()
    {
        // Pending assignment starting in 48 hours — should be excluded
        var farFuture = MakeAssignment(AssignmentStatus.Pending,
            start: DateTime.UtcNow.AddHours(48));

        _assignmentRepo.Setup(r => r.GetForCandidateAsync(CandidateId, default))
                       .ReturnsAsync(new List<TestAssignment> { farFuture });
        _batchRepo.Setup(r => r.GetBatchIdsForCandidateAsync(CandidateId, default))
                  .ReturnsAsync(new List<Guid>());

        var result = await _sut.HandleAsync(new GetMyAssignmentsQuery(CandidateId));

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_CompletedAssignment_IncludedInHistory()
    {
        var completed = MakeAssignment(AssignmentStatus.Completed);

        _assignmentRepo.Setup(r => r.GetForCandidateAsync(CandidateId, default))
                       .ReturnsAsync(new List<TestAssignment> { completed });
        _batchRepo.Setup(r => r.GetBatchIdsForCandidateAsync(CandidateId, default))
                  .ReturnsAsync(new List<Guid>());

        var result = await _sut.HandleAsync(new GetMyAssignmentsQuery(CandidateId));

        result.Should().HaveCount(1);
        result[0].Status.Should().Be("Completed");
    }

    [Fact]
    public async Task Handle_NoBatchIds_DoesNotQueryBatchAssignments()
    {
        _assignmentRepo.Setup(r => r.GetForCandidateAsync(CandidateId, default))
                       .ReturnsAsync(new List<TestAssignment>());
        _batchRepo.Setup(r => r.GetBatchIdsForCandidateAsync(CandidateId, default))
                  .ReturnsAsync(new List<Guid>());

        await _sut.HandleAsync(new GetMyAssignmentsQuery(CandidateId));

        _assignmentRepo.Verify(r => r.GetForBatchesAsync(
            It.IsAny<IEnumerable<Guid>>(), default), Times.Never);
    }

    [Fact]
    public async Task Handle_ResultsSortedByScheduledStart()
    {
        var later = MakeAssignment(AssignmentStatus.Pending,
            start: DateTime.UtcNow.AddMinutes(-1));
        var earlier = MakeAssignment(AssignmentStatus.Pending,
            start: DateTime.UtcNow.AddMinutes(-10));

        _assignmentRepo.Setup(r => r.GetForCandidateAsync(CandidateId, default))
                       .ReturnsAsync(new List<TestAssignment> { later, earlier });
        _batchRepo.Setup(r => r.GetBatchIdsForCandidateAsync(CandidateId, default))
                  .ReturnsAsync(new List<Guid>());

        var result = await _sut.HandleAsync(new GetMyAssignmentsQuery(CandidateId));

        result[0].ScheduledStart.Should().BeBefore(result[1].ScheduledStart);
    }
}

public class GetTestStatusHandlerTests
{
    private readonly Mock<ISessionRepository> _sessionRepo = new();
    private readonly Mock<IAnswerRepository> _answerRepo = new();
    private readonly Mock<ISessionQuestionMappingRepository> _mappingRepo = new();
    private readonly Mock<IAuditRepository> _auditRepo = new();
    private readonly Mock<IFinalizeTestHandler> _finalizeHandler = new();
    private readonly SessionStatusCacheService _cache;
    private readonly GetTestStatusHandler _sut;

    private static readonly Guid CandidateId = Guid.NewGuid();

    public GetTestStatusHandlerTests()
    {
        var memCache = new MemoryCache(new MemoryCacheOptions());
        _cache = new SessionStatusCacheService(memCache);

        _sut = new GetTestStatusHandler(
            _sessionRepo.Object, _answerRepo.Object, _mappingRepo.Object,
            _auditRepo.Object, _cache, _finalizeHandler.Object);
    }

    private void SetupSession(TestSession session, int answeredCount = 3, int totalQuestions = 10)
    {
        // Populate Test nav property so handler can access session.Test.DurationMinutes
        session.Test = TestBuilders.MakeTest(durationMinutes: 60);

        var answers = Enumerable.Range(0, answeredCount)
            .Select(_ => Answer.Create(session.SessionId, Guid.NewGuid(), 'A', Guid.NewGuid()))
            .ToList();

        var mappings = Enumerable.Range(1, totalQuestions)
            .Select(i => SessionQuestionMapping.Create(session.SessionId, i, Guid.NewGuid(),
                System.Text.Json.JsonSerializer.Serialize(
                    new Dictionary<char, char> { ['A'] = 'A', ['B'] = 'B', ['C'] = 'C', ['D'] = 'D' })))
            .ToList();

        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _answerRepo.Setup(r => r.GetBySessionAsync(It.IsAny<Guid>(), default)).ReturnsAsync(answers);
        _answerRepo.Setup(r => r.CountBySessionAsync(It.IsAny<Guid>(), default)).ReturnsAsync(answeredCount);
        _mappingRepo.Setup(r => r.GetBySessionAsync(It.IsAny<Guid>(), default)).ReturnsAsync(mappings);
        _auditRepo.Setup(r => r.CountViolationsAsync(It.IsAny<Guid>(), default)).ReturnsAsync(0);
    }

    [Fact]
    public async Task Handle_CacheHit_ReturnsCachedStatus()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var cachedStatus = new TestStatusDto(session.SessionId, 1800, "Active", null, 3, 10, 0);
        _cache.Set(session.SessionId, cachedStatus, session.StartTime, 60);

        var result = await _sut.HandleAsync(new GetTestStatusQuery(session.SessionId, CandidateId));

        result.Should().NotBeNull();
        _sessionRepo.Verify(r => r.GetByIdAsync(It.IsAny<Guid>(), default), Times.Never);
    }

    [Fact]
    public async Task Handle_CacheMiss_QueriesDb()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        SetupSession(session);

        var result = await _sut.HandleAsync(new GetTestStatusQuery(session.SessionId, CandidateId));

        result.Should().NotBeNull();
        _sessionRepo.Verify(r => r.GetByIdAsync(It.IsAny<Guid>(), default), Times.Once);
    }

    [Fact]
    public async Task Handle_SessionNotFound_ThrowsKeyNotFoundException()
    {
        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((TestSession?)null);

        await _sut.Invoking(s => s.HandleAsync(new GetTestStatusQuery(Guid.NewGuid(), CandidateId)))
                  .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task Handle_WrongCandidate_ThrowsUnauthorizedAccessException()
    {
        var session = TestBuilders.MakeSession(candidateId: Guid.NewGuid());
        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);

        await _sut.Invoking(s => s.HandleAsync(new GetTestStatusQuery(session.SessionId, CandidateId)))
                  .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Handle_AlreadyCompleted_ReturnsCompletedStatus()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        session.Finalize(8, DateTime.UtcNow);
        SetupSession(session);

        var result = await _sut.HandleAsync(new GetTestStatusQuery(session.SessionId, CandidateId));

        result.Status.Should().Be("Completed");
        result.TimeRemainingSec.Should().Be(0);
    }

    [Fact]
    public async Task Handle_ActiveSession_ReturnsCorrectAnsweredCount()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        SetupSession(session, answeredCount: 5, totalQuestions: 10);

        var result = await _sut.HandleAsync(new GetTestStatusQuery(session.SessionId, CandidateId));

        result.AnsweredCount.Should().Be(5);
        result.TotalQuestions.Should().Be(10);
    }

    [Fact]
    public async Task Handle_ActiveSession_SeedsCache()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        SetupSession(session);

        await _sut.HandleAsync(new GetTestStatusQuery(session.SessionId, CandidateId));

        // Cache should now have an entry for this session
        _cache.Get(session.SessionId).Should().NotBeNull();
    }
}
