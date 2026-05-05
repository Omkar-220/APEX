using Application.Commands;
using Domain.Entities;
using Domain.Exceptions;
using Domain.Ports.Repositories;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;

namespace Application.Tests.Commands;

public class InitializeExamHandlerTests
{
    private readonly Mock<ITestAssignmentRepository> _assignmentRepo = new();
    private readonly Mock<ITestRepository> _testRepo = new();
    private readonly Mock<ISessionRepository> _sessionRepo = new();
    private readonly Mock<IQuestionBatchRepository> _questionBatchRepo = new();
    private readonly Mock<IQuestionRepository> _questionRepo = new();
    private readonly InitializeExamHandler _sut;

    private static readonly Guid CandidateId = Guid.NewGuid();
    private static readonly Guid TestId = Guid.NewGuid();
    private static readonly Guid AssignmentId = Guid.NewGuid();
    private static readonly Guid QuestionBatchId = Guid.NewGuid();

    public InitializeExamHandlerTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["App:Salt"] = "test-salt" })
            .Build();

        _sut = new InitializeExamHandler(
            _assignmentRepo.Object, _testRepo.Object, _sessionRepo.Object,
            _questionBatchRepo.Object, _questionRepo.Object, config);
    }

    private void SetupHappyPath(int questionPoolSize = 50, int questionCount = 10)
    {
        var assignment = TestBuilders.MakeBatchAssignment(
            testId: TestId, questionBatchId: QuestionBatchId, questionCount: questionCount);

        var test = TestBuilders.MakeTest();
        var questionIds = TestBuilders.MakeQuestionIds(questionPoolSize);

        // Build questions with IDs matching the pool IDs
        var questionsByPoolId = new Dictionary<Guid, Question>();
        foreach (var id in questionIds)
        {
            var q = Question.Create("Q?", "A", "B", "C", "D", 'B', Guid.NewGuid());
            q.QuestionId = id; // set to match pool ID so handler lookup works
            questionsByPoolId[id] = q;
        }

        _assignmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                       .ReturnsAsync(assignment);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                 .ReturnsAsync(test);
        _sessionRepo.Setup(r => r.CountAttemptsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), default))
                    .ReturnsAsync(0);
        _questionBatchRepo.Setup(r => r.GetQuestionIdsAsync(It.IsAny<Guid>(), default))
                          .ReturnsAsync(questionIds);

        // Return questions matching the requested IDs from our lookup
        _questionRepo.Setup(r => r.GetByIdsAsync(It.IsAny<IEnumerable<Guid>>(), default))
                     .ReturnsAsync((IEnumerable<Guid> ids, CancellationToken _) =>
                         ids.Where(questionsByPoolId.ContainsKey)
                            .Select(id => questionsByPoolId[id])
                            .ToList());

        _sessionRepo.Setup(r => r.AddWithMappingsAsync(It.IsAny<Domain.Entities.TestSession>(),
                           It.IsAny<IEnumerable<Domain.Entities.SessionQuestionMapping>>(), default))
                    .Returns(Task.CompletedTask);
    }

    [Fact]
    public async Task Handle_ValidInputs_ReturnsInitializeExamDto()
    {
        SetupHappyPath();
        var cmd = new InitializeExamCommand(CandidateId, TestId, AssignmentId, "test-oid");

        var result = await _sut.HandleAsync(cmd);

        result.Should().NotBeNull();
        result.SessionId.Should().NotBeEmpty();
        result.TotalQuestions.Should().Be(10);
        result.TimeRemainingSec.Should().BeGreaterThan(0);
        result.FirstQuestionId.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_AssignmentNotFound_ThrowsKeyNotFoundException()
    {
        _assignmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                       .ReturnsAsync((Domain.Entities.TestAssignment?)null);

        var cmd = new InitializeExamCommand(CandidateId, TestId, AssignmentId, "oid");
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task Handle_AssignmentTestIdMismatch_ThrowsUnauthorizedAccessException()
    {
        var assignment = TestBuilders.MakeBatchAssignment(testId: Guid.NewGuid()); // different testId
        _assignmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                       .ReturnsAsync(assignment);

        var cmd = new InitializeExamCommand(CandidateId, TestId, AssignmentId, "oid");
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Handle_OutsideTimeWindow_ThrowsInvalidTimeWindowException()
    {
        var assignment = TestBuilders.MakeBatchAssignment(
            testId: TestId,
            start: DateTime.UtcNow.AddHours(2),   // future
            deadline: DateTime.UtcNow.AddHours(4));

        _assignmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                       .ReturnsAsync(assignment);
        _sessionRepo.Setup(r => r.CountAttemptsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), default))
                    .ReturnsAsync(0);

        var cmd = new InitializeExamCommand(CandidateId, TestId, AssignmentId, "oid");
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<InvalidTimeWindowException>();
    }

    [Fact]
    public async Task Handle_MaxAttemptsExceeded_ThrowsMaxAttemptsExceededException()
    {
        var assignment = TestBuilders.MakeBatchAssignment(testId: TestId, maxAttempts: 1);
        _assignmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                       .ReturnsAsync(assignment);
        _sessionRepo.Setup(r => r.CountAttemptsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), default))
                    .ReturnsAsync(1); // already used 1 attempt

        var cmd = new InitializeExamCommand(CandidateId, TestId, AssignmentId, "oid");
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<MaxAttemptsExceededException>();
    }

    [Fact]
    public async Task Handle_InsufficientQuestions_ThrowsInvalidOperationException()
    {
        var assignment = TestBuilders.MakeBatchAssignment(testId: TestId, questionCount: 40);
        _assignmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                       .ReturnsAsync(assignment);
        _sessionRepo.Setup(r => r.CountAttemptsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), default))
                    .ReturnsAsync(0);
        _testRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), default))
                 .ReturnsAsync(TestBuilders.MakeTest());
        _questionBatchRepo.Setup(r => r.GetQuestionIdsAsync(It.IsAny<Guid>(), default))
                          .ReturnsAsync(TestBuilders.MakeQuestionIds(10)); // only 10, need 40

        var cmd = new InitializeExamCommand(CandidateId, TestId, AssignmentId, "oid");
        await _sut.Invoking(s => s.HandleAsync(cmd))
                  .Should().ThrowAsync<InvalidOperationException>()
                  .WithMessage("*insufficient*");
    }

    [Fact]
    public async Task Handle_SameSeedInputs_ProducesSameFirstQuestion()
    {
        SetupHappyPath();
        var cmd = new InitializeExamCommand(CandidateId, TestId, AssignmentId, "oid");

        var result1 = await _sut.HandleAsync(cmd);
        var result2 = await _sut.HandleAsync(cmd);

        // Same seed inputs → same first question
        result1.FirstQuestionId.Should().Be(result2.FirstQuestionId);
        result1.TotalQuestions.Should().Be(result2.TotalQuestions);
    }

    [Fact]
    public async Task Handle_CallsAddWithMappingsAsync_NotSeparateMethods()
    {
        SetupHappyPath();
        var cmd = new InitializeExamCommand(CandidateId, TestId, AssignmentId, "oid");

        await _sut.HandleAsync(cmd);

        // Must use atomic method, not separate AddAsync + BulkInsertAsync
        _sessionRepo.Verify(r => r.AddWithMappingsAsync(
            It.IsAny<Domain.Entities.TestSession>(),
            It.IsAny<IEnumerable<Domain.Entities.SessionQuestionMapping>>(),
            default), Times.Once);
        _sessionRepo.Verify(r => r.AddAsync(It.IsAny<Domain.Entities.TestSession>(), default), Times.Never);
    }
}
