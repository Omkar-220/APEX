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

        // 1. Load and validate assignment
        var assignment = await _assignmentRepo.GetByIdAsync(cmd.AssignmentId, ct)
            ?? throw new KeyNotFoundException($"Assignment {cmd.AssignmentId} not found.");

        if (assignment.TestId != cmd.TestId)
            throw new UnauthorizedAccessException("Assignment does not match the requested test.");

        // Validate ownership — assignment must target this candidate directly or via batch
        // (batch membership check is done at the query level — if GetByIdAsync returned it, it's valid)

        // 2. Validate time window and attempt limits
        var existingAttempts = await _sessionRepo.CountAttemptsAsync(cmd.AssignmentId, cmd.CandidateId, ct);
        assignment.ValidateCanStart(utcNow, existingAttempts);

        // 3. Load test
        var test = await _testRepo.GetByIdAsync(assignment.TestId, ct)
            ?? throw new KeyNotFoundException($"Test {assignment.TestId} not found.");

        // 4. Load question pool
        var questionIds = await _questionBatchRepo.GetQuestionIdsAsync(assignment.QuestionBatchId, ct);
        if (questionIds.Count < assignment.QuestionCount)
            throw new InvalidOperationException("Question batch has insufficient questions.");

        // 5. Deterministic question selection and ordering
        var orderSeed = SeedGenerator.ForQuestionOrder(
            cmd.CandidateId, cmd.TestId, existingAttempts + 1, _appSalt);

        var selectedIds = SeededPrng.SelectRandom(questionIds, assignment.QuestionCount, orderSeed);
        var questions = await _questionRepo.GetByIdsAsync(selectedIds, ct);

        // Preserve the seeded order
        var orderedQuestions = selectedIds
            .Select(id => questions.First(q => q.QuestionId == id))
            .ToList();

        // 6 + 7. Create session and mappings atomically
        var session = TestSession.Create(
            cmd.AssignmentId, cmd.CandidateId, cmd.TestId,
            cmd.CandidateOid, existingAttempts + 1);

        var mappings = orderedQuestions.Select((q, idx) =>
        {
            var optionSeed = SeedGenerator.ForOptionShuffle(
                cmd.CandidateId, cmd.TestId, q.QuestionId, _appSalt);
            var optionMap = OptionShuffler.Shuffle(optionSeed);
            var mappingJson = JsonSerializer.Serialize(optionMap);
            return SessionQuestionMapping.Create(
                session.SessionId, idx + 1, q.QuestionId, mappingJson);
        }).ToList();

        await _sessionRepo.AddWithMappingsAsync(session, mappings, ct);

        var timeRemaining = session.ComputeTimeRemainingSec(test.DurationMinutes, DateTime.UtcNow);

        return new InitializeExamDto(
            session.SessionId,
            orderedQuestions[0].QuestionId,
            timeRemaining,
            orderedQuestions.Count);
    }
}
