using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Ports.Repositories;

namespace Application.Commands.Admin;

// ── Update Candidate Role ─────────────────────────────────────────────────────

public record UpdateCandidateRoleCommand(Guid CandidateId, string Role);

public class UpdateCandidateRoleHandler
{
    private readonly ICandidateRepository _repo;
    public UpdateCandidateRoleHandler(ICandidateRepository repo) => _repo = repo;

    public async Task HandleAsync(UpdateCandidateRoleCommand cmd, CancellationToken ct = default)
    {
        var candidate = await _repo.GetByIdAsync(cmd.CandidateId, ct)
            ?? throw new KeyNotFoundException($"Candidate {cmd.CandidateId} not found.");

        if (!Enum.TryParse<Role>(cmd.Role, out var role))
            throw new ArgumentException($"Invalid role: {cmd.Role}");

        candidate.UpdateRole(role);
        await _repo.UpdateAsync(candidate, ct);
    }
}

// ── Create Question ───────────────────────────────────────────────────────────

public record CreateQuestionCommand(
    string Content,
    string OptionA, string OptionB, string OptionC, string OptionD,
    char CorrectOption,
    Guid CreatedBy,
    decimal Weightage = 1);

public class CreateQuestionHandler
{
    private readonly IQuestionRepository _repo;
    public CreateQuestionHandler(IQuestionRepository repo) => _repo = repo;

    public async Task<Guid> HandleAsync(CreateQuestionCommand cmd, CancellationToken ct = default)
    {
        var question = Question.Create(
            cmd.Content, cmd.OptionA, cmd.OptionB, cmd.OptionC, cmd.OptionD,
            cmd.CorrectOption, cmd.CreatedBy, cmd.Weightage);

        await _repo.AddAsync(question, ct);
        return question.QuestionId;
    }
}

// ── Create Question Batch ─────────────────────────────────────────────────────

public record CreateQuestionBatchCommand(
    string Name, Guid CreatedBy,
    string? Domain = null, string? Topic = null, string? Difficulty = null);

public class CreateQuestionBatchHandler
{
    private readonly IQuestionBatchRepository _repo;
    public CreateQuestionBatchHandler(IQuestionBatchRepository repo) => _repo = repo;

    public async Task<Guid> HandleAsync(CreateQuestionBatchCommand cmd, CancellationToken ct = default)
    {
        Difficulty? difficulty = cmd.Difficulty != null
            ? Enum.Parse<Difficulty>(cmd.Difficulty) : null;

        var batch = QuestionBatch.Create(cmd.Name, cmd.CreatedBy, cmd.Domain, cmd.Topic, difficulty);
        await _repo.AddAsync(batch, ct);
        return batch.QuestionBatchId;
    }
}

// ── Add Questions to Batch ────────────────────────────────────────────────────

public record AddQuestionsToBatchCommand(Guid QuestionBatchId, List<Guid> QuestionIds);

public class AddQuestionsToBatchHandler
{
    private readonly IQuestionBatchRepository _repo;
    public AddQuestionsToBatchHandler(IQuestionBatchRepository repo) => _repo = repo;

    public async Task<int> HandleAsync(AddQuestionsToBatchCommand cmd, CancellationToken ct = default)
    {
        var batch = await _repo.GetByIdAsync(cmd.QuestionBatchId, ct)
            ?? throw new KeyNotFoundException($"QuestionBatch {cmd.QuestionBatchId} not found.");

        var existingIds = await _repo.GetQuestionIdsAsync(cmd.QuestionBatchId, ct);
        var toAdd = cmd.QuestionIds.Distinct().Where(id => !existingIds.Contains(id)).ToList();

        if (toAdd.Count > 0)
            await _repo.AddMembersAsync(cmd.QuestionBatchId, toAdd, ct);

        return toAdd.Count;
    }
}

// ── Create Candidate Batch ────────────────────────────────────────────────────

public record CreateBatchCommand(
    string Name, Guid CreatedBy,
    string? Domain = null, string? Topic = null, string? Difficulty = null);

public class CreateBatchHandler
{
    private readonly IBatchRepository _repo;
    public CreateBatchHandler(IBatchRepository repo) => _repo = repo;

    public async Task<Guid> HandleAsync(CreateBatchCommand cmd, CancellationToken ct = default)
    {
        Difficulty? difficulty = cmd.Difficulty != null
            ? Enum.Parse<Difficulty>(cmd.Difficulty) : null;

        var batch = Batch.Create(cmd.Name, cmd.CreatedBy, cmd.Domain, cmd.Topic, difficulty);
        await _repo.AddAsync(batch, ct);
        return batch.BatchId;
    }
}

// ── Add Candidates to Batch ───────────────────────────────────────────────────

public record AddCandidatesToBatchCommand(Guid BatchId, List<Guid> CandidateIds);

public class AddCandidatesToBatchHandler
{
    private readonly IBatchRepository _repo;
    public AddCandidatesToBatchHandler(IBatchRepository repo) => _repo = repo;

    public async Task<int> HandleAsync(AddCandidatesToBatchCommand cmd, CancellationToken ct = default)
    {
        // Verify batch exists
        _ = await _repo.GetByIdAsync(cmd.BatchId, ct)
            ?? throw new KeyNotFoundException($"Batch {cmd.BatchId} not found.");

        // Deduplication is handled inside AddMembersAsync
        await _repo.AddMembersAsync(cmd.BatchId, cmd.CandidateIds, ct);

        // Return count of unique IDs requested (repo handles actual dedup)
        return cmd.CandidateIds.Distinct().Count();
    }
}

// ── Create Test ───────────────────────────────────────────────────────────────

public record CreateTestCommand(
    string Title, int DurationMinutes, decimal PassingScorePercent, string? Description = null);

public class CreateTestHandler
{
    private readonly ITestRepository _repo;
    public CreateTestHandler(ITestRepository repo) => _repo = repo;

    public async Task<Guid> HandleAsync(CreateTestCommand cmd, CancellationToken ct = default)
    {
        var test = Test.Create(cmd.Title, cmd.DurationMinutes, cmd.PassingScorePercent, cmd.Description);
        await _repo.AddAsync(test, ct);
        return test.TestId;
    }
}

// ── Create Assignment ─────────────────────────────────────────────────────────

public record CreateAssignmentCommand(
    Guid TestId, Guid QuestionBatchId,
    int QuestionCount, DateTime ScheduledStart, DateTime Deadline,
    int MaxAttempts = 1,
    Guid? BatchId = null, Guid? CandidateId = null);

public class CreateAssignmentHandler
{
    private readonly ITestAssignmentRepository _repo;
    private readonly IQuestionBatchRepository _questionBatchRepo;

    public CreateAssignmentHandler(
        ITestAssignmentRepository repo,
        IQuestionBatchRepository questionBatchRepo)
    {
        _repo = repo;
        _questionBatchRepo = questionBatchRepo;
    }

    public async Task<Guid> HandleAsync(CreateAssignmentCommand cmd, CancellationToken ct = default)
    {
        if (cmd.BatchId == null && cmd.CandidateId == null)
            throw new ArgumentException("Either BatchId or CandidateId must be provided.");
        if (cmd.BatchId != null && cmd.CandidateId != null)
            throw new ArgumentException("Only one of BatchId or CandidateId can be provided.");

        // Validate question batch has enough questions
        var questionIds = await _questionBatchRepo.GetQuestionIdsAsync(cmd.QuestionBatchId, ct);
        if (questionIds.Count < cmd.QuestionCount)
            throw new InvalidOperationException(
                $"Question batch only has {questionIds.Count} questions, but {cmd.QuestionCount} were requested.");

        var assignment = cmd.BatchId.HasValue
            ? TestAssignment.CreateForBatch(
                cmd.TestId, cmd.QuestionBatchId, cmd.BatchId.Value,
                cmd.QuestionCount, cmd.ScheduledStart, cmd.Deadline, cmd.MaxAttempts)
            : TestAssignment.CreateForCandidate(
                cmd.TestId, cmd.QuestionBatchId, cmd.CandidateId!.Value,
                cmd.QuestionCount, cmd.ScheduledStart, cmd.Deadline, cmd.MaxAttempts);

        await _repo.AddAsync(assignment, ct);
        return assignment.AssignmentId;
    }
}
