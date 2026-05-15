using Application.Commands;
using Application.DTOs;
using Application.Services;
using Domain.Entities;
using Domain.Exceptions;
using Domain.Ports.Repositories;
using Domain.Ports.Services;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using System.Text.Json;

namespace Application.Tests.Commands;

public class SubmitAnswerHandlerTests
{
    private readonly Mock<ISessionRepository> _sessionRepo = new();
    private readonly Mock<IAnswerRepository> _answerRepo = new();
    private readonly Mock<ISessionQuestionMappingRepository> _mappingRepo = new();
    private readonly Mock<ITestRepository> _testRepo = new();
    private readonly Mock<IFinalizeTestHandler> _finalizeHandler = new();
    private readonly SubmitAnswerHandler _sut;

    private static readonly Guid CandidateId = Guid.NewGuid();
    private static readonly Guid SessionId = Guid.NewGuid();
    private static readonly Guid QuestionId = Guid.NewGuid();

    public SubmitAnswerHandlerTests()
    {
        _sut = new SubmitAnswerHandler(
            _sessionRepo.Object, _answerRepo.Object,
            _mappingRepo.Object, _testRepo.Object,
            _finalizeHandler.Object);
    }

    private void SetupActiveSession()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId, testId: Guid.NewGuid());
        var test = TestBuilders.MakeTest(durationMinutes: 60);
        var mapping = SessionQuestionMapping.Create(session.SessionId, 1, QuestionId,
            JsonSerializer.Serialize(new Dictionary<char, char>
                { ['A'] = 'A', ['B'] = 'B', ['C'] = 'C', ['D'] = 'D' }));

        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(test);
        _answerRepo.Setup(r => r.GetByIdempotencyKeyAsync(It.IsAny<Guid>(), default))
                   .ReturnsAsync((Answer?)null);
        _mappingRepo.Setup(r => r.GetAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), default))
                    .ReturnsAsync(mapping);
        _answerRepo.Setup(r => r.UpsertAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
                          It.IsAny<char>(), It.IsAny<Guid>(), default))
                   .Returns(Task.CompletedTask);
    }

    [Fact]
    public async Task Handle_ValidAnswer_CallsUpsert()
    {
        SetupActiveSession();
        var cmd = new SubmitAnswerCommand(SessionId, CandidateId, QuestionId, 'A', Guid.NewGuid());

        await _sut.HandleAsync(cmd);

        _answerRepo.Verify(r => r.UpsertAsync(
            It.IsAny<Guid>(), It.IsAny<Guid>(), 'A', It.IsAny<Guid>(), default), Times.Once);
    }

    [Fact]
    public async Task Handle_SessionNotFound_ThrowsKeyNotFoundException()
    {
        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync((TestSession?)null);

        var cmd = new SubmitAnswerCommand(SessionId, CandidateId, QuestionId, 'A', Guid.NewGuid());
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task Handle_WrongCandidate_ThrowsUnauthorizedAccessException()
    {
        var session = TestBuilders.MakeSession(candidateId: Guid.NewGuid()); // different candidate
        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(TestBuilders.MakeTest());

        var cmd = new SubmitAnswerCommand(SessionId, CandidateId, QuestionId, 'A', Guid.NewGuid());
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Handle_IdempotencyKeyExists_ReturnsWithoutUpsert()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest(durationMinutes: 60);
        var existingAnswer = Answer.Create(session.SessionId, QuestionId, 'A', Guid.NewGuid());

        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(test);
        _answerRepo.Setup(r => r.GetByIdempotencyKeyAsync(It.IsAny<Guid>(), default))
                   .ReturnsAsync(existingAnswer);

        var cmd = new SubmitAnswerCommand(SessionId, CandidateId, QuestionId, 'A', Guid.NewGuid());
        await _sut.HandleAsync(cmd);

        _answerRepo.Verify(r => r.UpsertAsync(It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<char>(), It.IsAny<Guid>(), default), Times.Never);
    }

    [Fact]
    public async Task Handle_QuestionNotInSession_ThrowsKeyNotFoundException()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest(durationMinutes: 60);

        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(test);
        _answerRepo.Setup(r => r.GetByIdempotencyKeyAsync(It.IsAny<Guid>(), default))
                   .ReturnsAsync((Answer?)null);
        _mappingRepo.Setup(r => r.GetAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), default))
                    .ReturnsAsync((SessionQuestionMapping?)null);

        var cmd = new SubmitAnswerCommand(SessionId, CandidateId, QuestionId, 'A', Guid.NewGuid());
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task Handle_SessionAlreadyCompleted_ThrowsSessionExpiredException()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest(durationMinutes: 60);
        session.Finalize(0, DateTime.UtcNow); // mark as completed

        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(test);
        _answerRepo.Setup(r => r.GetByIdempotencyKeyAsync(It.IsAny<Guid>(), default))
                   .ReturnsAsync((Answer?)null);
        _mappingRepo.Setup(r => r.GetAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), default))
                    .ReturnsAsync((SessionQuestionMapping?)null);

        var cmd = new SubmitAnswerCommand(SessionId, CandidateId, QuestionId, 'A', Guid.NewGuid());
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<SessionExpiredException>();
    }
}

public class FinalizeTestHandlerTests
{
    private readonly Mock<ISessionRepository> _sessionRepo = new();
    private readonly Mock<IAnswerRepository> _answerRepo = new();
    private readonly Mock<ISessionQuestionMappingRepository> _mappingRepo = new();
    private readonly Mock<IQuestionRepository> _questionRepo = new();
    private readonly Mock<ITestRepository> _testRepo = new();
    private readonly Mock<ICandidateRepository> _candidateRepo = new();
    private readonly Mock<ITestAssignmentRepository> _assignmentRepo = new();
    private readonly Mock<INotificationPort> _notification = new();
    private readonly Mock<IResultCachePort> _resultCache = new();
    private readonly SessionStatusCacheService _statusCache;
    private readonly FinalizeTestHandler _sut;

    private static readonly Guid CandidateId = Guid.NewGuid();
    private static readonly Guid SessionId = Guid.NewGuid();

    public FinalizeTestHandlerTests()
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        _statusCache = new SessionStatusCacheService(cache);

        _sut = new FinalizeTestHandler(
            _sessionRepo.Object, _answerRepo.Object, _mappingRepo.Object,
            _questionRepo.Object, _testRepo.Object, _candidateRepo.Object,
            _assignmentRepo.Object, _notification.Object, _resultCache.Object, _statusCache);
    }

    private void SetupActiveSession(TestSession session, Test test,
        List<Answer> answers, List<SessionQuestionMapping> mappings, List<Question> questions)
    {
        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(test);
        _answerRepo.Setup(r => r.GetBySessionAsync(It.IsAny<Guid>(), default)).ReturnsAsync(answers);
        _mappingRepo.Setup(r => r.GetBySessionAsync(It.IsAny<Guid>(), default)).ReturnsAsync(mappings);
        _questionRepo.Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<Guid>>(), default)).ReturnsAsync(questions);
        _sessionRepo.Setup(r => r.TryFinalizeAsync(It.IsAny<Guid>(), It.IsAny<int>(),
            It.IsAny<DateTime>(), It.IsAny<byte[]>(), default)).ReturnsAsync(true);
        _resultCache.Setup(r => r.Get<FinalizeResultDto>(It.IsAny<Guid>())).Returns((FinalizeResultDto?)null);
        _candidateRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                      .ReturnsAsync(TestBuilders.MakeCandidate());
        _notification.Setup(r => r.EnqueueAsync(It.IsAny<string>(), It.IsAny<object>(), default))
                     .Returns(Task.CompletedTask);
        _assignmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                       .ReturnsAsync((Domain.Entities.TestAssignment?)null);
    }

    private static (List<Answer>, List<SessionQuestionMapping>, List<Question>)
        BuildScoringData(Guid sessionId, int totalQuestions, int correctAnswers)
    {
        var answers = new List<Answer>();
        var mappings = new List<SessionQuestionMapping>();
        var questions = new List<Question>();

        for (int i = 0; i < totalQuestions; i++)
        {
            // Create question first — its QuestionId is auto-generated
            var question = Question.Create(
                "Question text", "A", "B", "C", "D", 'B', Guid.NewGuid());

            var questionId = question.QuestionId; // use the actual generated ID

            // Identity mapping: display A→A, B→B, C→C, D→D
            var optionMap = new Dictionary<char, char>
                { ['A'] = 'A', ['B'] = 'B', ['C'] = 'C', ['D'] = 'D' };
            var mapping = SessionQuestionMapping.Create(
                sessionId, i + 1, questionId, JsonSerializer.Serialize(optionMap));

            // First 'correctAnswers' questions answered correctly (display 'B' = original 'B')
            var selectedOption = i < correctAnswers ? 'B' : 'A';
            var answer = Answer.Create(sessionId, questionId, selectedOption, Guid.NewGuid());

            answers.Add(answer);
            mappings.Add(mapping);
            questions.Add(question);
        }

        return (answers, mappings, questions);
    }

    [Fact]
    public async Task Handle_AllCorrect_ScoresFullMarks()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest(passingScore: 70m);
        var (answers, mappings, questions) = BuildScoringData(session.SessionId, 10, 10);

        SetupActiveSession(session, test, answers, mappings, questions);

        var result = await _sut.HandleAsync(
            new FinalizeTestCommand(session.SessionId, CandidateId, "candidate"));

        result.Score.Should().Be(10);
        result.TotalQuestions.Should().Be(10);
        result.Percentage.Should().Be(100m);
        result.Passed.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_NoAnswers_ScoresZero()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest(passingScore: 70m);
        var (_, mappings, questions) = BuildScoringData(session.SessionId, 10, 0);

        SetupActiveSession(session, test, new List<Answer>(), mappings, questions);

        var result = await _sut.HandleAsync(
            new FinalizeTestCommand(session.SessionId, CandidateId, "candidate"));

        result.Score.Should().Be(0);
        result.Passed.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_PartialCorrect_ScoresCorrectly()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest(passingScore: 70m);
        var (answers, mappings, questions) = BuildScoringData(session.SessionId, 10, 7);

        SetupActiveSession(session, test, answers, mappings, questions);

        var result = await _sut.HandleAsync(
            new FinalizeTestCommand(session.SessionId, CandidateId, "candidate"));

        result.Score.Should().Be(7);
        result.Percentage.Should().Be(70m);
        result.Passed.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_BelowPassingScore_FailsTest()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest(passingScore: 70m);
        var (answers, mappings, questions) = BuildScoringData(session.SessionId, 10, 6);

        SetupActiveSession(session, test, answers, mappings, questions);

        var result = await _sut.HandleAsync(
            new FinalizeTestCommand(session.SessionId, CandidateId, "candidate"));

        result.Passed.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_AlreadyFinalized_ReturnsCachedResult()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        session.Finalize(8, DateTime.UtcNow); // already completed

        var test = TestBuilders.MakeTest();
        var cachedResult = new FinalizeResultDto(true, 8, 10, true, 80m);

        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(test);
        _resultCache.Setup(r => r.Get<FinalizeResultDto>(It.IsAny<Guid>())).Returns(cachedResult);

        var result = await _sut.HandleAsync(
            new FinalizeTestCommand(session.SessionId, CandidateId, "candidate"));

        result.Score.Should().Be(8);
        _sessionRepo.Verify(r => r.TryFinalizeAsync(It.IsAny<Guid>(), It.IsAny<int>(),
            It.IsAny<DateTime>(), It.IsAny<byte[]>(), default), Times.Never);
    }

    [Fact]
    public async Task Handle_WrongCandidate_ThrowsUnauthorizedAccessException()
    {
        var session = TestBuilders.MakeSession(candidateId: Guid.NewGuid());
        _sessionRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(session);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default)).ReturnsAsync(TestBuilders.MakeTest());
        _resultCache.Setup(r => r.Get<FinalizeResultDto>(It.IsAny<Guid>())).Returns((FinalizeResultDto?)null);

        var cmd = new FinalizeTestCommand(SessionId, CandidateId, "candidate", IsSystemTriggered: false);
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Handle_IsSystemTriggered_BypassesOwnershipCheck()
    {
        var session = TestBuilders.MakeSession(candidateId: Guid.NewGuid()); // different candidate
        var test = TestBuilders.MakeTest();
        var (answers, mappings, questions) = BuildScoringData(session.SessionId, 5, 5);

        SetupActiveSession(session, test, answers, mappings, questions);

        // Should NOT throw even though CandidateId doesn't match
        var cmd = new FinalizeTestCommand(session.SessionId, CandidateId, "auto_expired", IsSystemTriggered: true);
        var result = await _sut.HandleAsync(cmd);

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_ConcurrencyConflict_FetchesFreshResult()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest();
        var (answers, mappings, questions) = BuildScoringData(session.SessionId, 10, 8);

        SetupActiveSession(session, test, answers, mappings, questions);

        // TryFinalizeAsync returns false — another request won
        _sessionRepo.Setup(r => r.TryFinalizeAsync(It.IsAny<Guid>(), It.IsAny<int>(),
            It.IsAny<DateTime>(), It.IsAny<byte[]>(), default)).ReturnsAsync(false);

        // Fresh session is already completed
        var freshSession = TestBuilders.MakeSession(candidateId: CandidateId);
        freshSession.Finalize(8, DateTime.UtcNow);
        _sessionRepo.SetupSequence(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                    .ReturnsAsync(session)
                    .ReturnsAsync(freshSession);

        var result = await _sut.HandleAsync(
            new FinalizeTestCommand(session.SessionId, CandidateId, "candidate"));

        result.Should().NotBeNull();
    }

    [Fact]
    public async Task Handle_Success_InvalidatesStatusCache()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest();
        var (answers, mappings, questions) = BuildScoringData(session.SessionId, 5, 5);

        SetupActiveSession(session, test, answers, mappings, questions);

        // Seed the status cache
        var statusDto = new Application.DTOs.TestStatusDto(
            session.SessionId, 1800, "Active", null, 0, 5, 0);
        _statusCache.Set(session.SessionId, statusDto, session.StartTime, 60);

        await _sut.HandleAsync(
            new FinalizeTestCommand(session.SessionId, CandidateId, "candidate"));

        // Cache should be invalidated
        _statusCache.Get(session.SessionId).Should().BeNull();
    }

    [Fact]
    public async Task Handle_Success_EnqueuesWebhookNotification()
    {
        var session = TestBuilders.MakeSession(candidateId: CandidateId);
        var test = TestBuilders.MakeTest();
        var (answers, mappings, questions) = BuildScoringData(session.SessionId, 5, 5);

        SetupActiveSession(session, test, answers, mappings, questions);

        await _sut.HandleAsync(
            new FinalizeTestCommand(session.SessionId, CandidateId, "candidate"));

        _notification.Verify(n => n.EnqueueAsync(
            "exam_completed", It.IsAny<object>(), default), Times.Once);
    }
}
