using Application.DTOs;
using Domain.Entities;
using Domain.Ports.Repositories;
using Domain.Utilities;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace Application.Commands;

public record InitializeExamCommand(Guid CandidateId, Guid TestId, Guid AssignmentId, string CandidateOid);

public class InitializeExamHandler
{
    private readonly ITestAssignmentRepository _assignmentRepo;
    private readonly ITestRepository _testRepo;
    private readonly ISessionRepository _sessionRepo;
    private readonly IQuestionBatchRepository _questionBatchRepo;
    private readonly IQuestionRepository _questionRepo;
    private readonly string _appSalt;

    public InitializeExamHandler(
        ITestAssignmentRepository assignmentRepo,
        ITestRepository testRepo,
        ISessionRepository sessionRepo,
        IQuestionBatchRepository questionBatchRepo,
        IQuestionRepository questionRepo,
        IConfiguration config)
    {
        _assignmentRepo = assignmentRepo;
        _testRepo = testRepo;
        _sessionRepo = sessionRepo;
        _questionBatchRepo = questionBatchRepo;
        _questionRepo = questionRepo;
        _appSalt = config["App:Salt"]
            ?? throw new InvalidOperationException("App:Salt is not configured.");
    }

    public async Task<InitializeExamDto> HandleAsync(InitializeExamCommand cmd, CancellationToken ct = default)
    {
        var utcNow = DateTime.UtcNow;

        var assignment = await _assignmentRepo.GetByIdAsync(cmd.AssignmentId, ct)
            ?? throw new KeyNotFoundException($"Assignment {cmd.AssignmentId} not found.");

        if (assignment.TestId != cmd.TestId)
            throw new UnauthorizedAccessException("Assignment does not match the requested test.");

        var existingAttempts = await _sessionRepo.CountAttemptsAsync(cmd.AssignmentId, cmd.CandidateId, ct);
        assignment.ValidateCanStart(utcNow, existingAttempts);

        var nextAttemptNumber = await _sessionRepo.GetMaxAttemptNumberAsync(cmd.AssignmentId, cmd.CandidateId, ct) + 1;

        var test = await _testRepo.GetByIdAsync(assignment.TestId, ct)
            ?? throw new KeyNotFoundException($"Test {assignment.TestId} not found.");

        var questionIds = await _questionBatchRepo.GetQuestionIdsAsync(assignment.QuestionBatchId, ct);
        if (questionIds.Count < assignment.QuestionCount)
            throw new InvalidOperationException($"Question batch has insufficient questions: has {questionIds.Count}, needs {assignment.QuestionCount}.");

        var orderSeed = SeedGenerator.ForQuestionOrder(cmd.CandidateId, cmd.TestId, nextAttemptNumber, _appSalt);
        var selectedIds = SeededPrng.SelectRandom(questionIds, assignment.QuestionCount, orderSeed);
        var questions = await _questionRepo.GetByIdsAsync(selectedIds, ct);

        var orderedQuestions = selectedIds
            .Select(id => questions.First(q => q.QuestionId == id))
            .ToList();

        var session = TestSession.Create(
            cmd.AssignmentId, cmd.CandidateId, cmd.TestId,
            cmd.CandidateOid, nextAttemptNumber);

        var mappings = orderedQuestions.Select((q, idx) =>
        {
            var optionSeed = SeedGenerator.ForOptionShuffle(cmd.CandidateId, cmd.TestId, q.QuestionId, _appSalt);
            var optionMap = OptionShuffler.Shuffle(optionSeed);
            return SessionQuestionMapping.Create(session.SessionId, idx + 1, q.QuestionId, JsonSerializer.Serialize(optionMap));
        }).ToList();

        await _sessionRepo.AddWithMappingsAsync(session, mappings, ct);

        if (assignment.Status == Domain.Enums.AssignmentStatus.Pending)
        {
            assignment.MarkActive();
            await _assignmentRepo.UpdateAsync(assignment, ct);
        }

        return new InitializeExamDto(
            session.SessionId,
            orderedQuestions[0].QuestionId,
            session.ComputeTimeRemainingSec(test.DurationMinutes, DateTime.UtcNow),
            orderedQuestions.Count);
    }
}
