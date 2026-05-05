using Application.Services;
using Domain.Exceptions;
using Domain.Ports.Repositories;

namespace Application.Commands;

public record SubmitAnswerCommand(
    Guid SessionId, Guid CandidateId, Guid QuestionId,
    char SelectedOption, Guid IdempotencyKey);

public class SubmitAnswerHandler
{
    private readonly ISessionRepository _sessionRepo;
    private readonly IAnswerRepository _answerRepo;
    private readonly ISessionQuestionMappingRepository _mappingRepo;
    private readonly ITestRepository _testRepo;
    private readonly IFinalizeTestHandler _finalizeHandler;

    public SubmitAnswerHandler(
        ISessionRepository sessionRepo,
        IAnswerRepository answerRepo,
        ISessionQuestionMappingRepository mappingRepo,
        ITestRepository testRepo,
        IFinalizeTestHandler finalizeHandler)
    {
        _sessionRepo = sessionRepo;
        _answerRepo = answerRepo;
        _mappingRepo = mappingRepo;
        _testRepo = testRepo;
        _finalizeHandler = finalizeHandler;
    }

    public async Task HandleAsync(SubmitAnswerCommand cmd, CancellationToken ct = default)
    {
        // 1. Load session and validate ownership
        var session = await _sessionRepo.GetByIdAsync(cmd.SessionId, ct)
            ?? throw new KeyNotFoundException($"Session {cmd.SessionId} not found.");

        if (session.CandidateId != cmd.CandidateId)
            throw new UnauthorizedAccessException("Session does not belong to this candidate.");

        var test = await _testRepo.GetByIdAsync(session.TestId, ct)
            ?? throw new KeyNotFoundException($"Test {session.TestId} not found.");

        var utcNow = DateTime.UtcNow;

        // 2. Check session status and time
        if (session.Status != Domain.Enums.TestSessionStatus.Active)
            throw new SessionExpiredException(cmd.SessionId);

        var timeRemaining = session.ComputeTimeRemainingSec(test.DurationMinutes, utcNow);
        if (timeRemaining <= 0)
        {
            _ = Task.Run(() => _finalizeHandler.HandleAsync(
                new FinalizeTestCommand(cmd.SessionId, cmd.CandidateId, "auto_expired", IsSystemTriggered: true),
                CancellationToken.None));
            throw new SessionExpiredException(cmd.SessionId);
        }

        // 3. Idempotency check — if key already exists return success immediately
        var existing = await _answerRepo.GetByIdempotencyKeyAsync(cmd.IdempotencyKey, ct);
        if (existing != null) return;

        // 4. Validate question belongs to this session
        var mapping = await _mappingRepo.GetAsync(cmd.SessionId, cmd.QuestionId, ct);
        if (mapping == null)
            throw new KeyNotFoundException($"Question {cmd.QuestionId} not found in session {cmd.SessionId}.");

        // 5. Upsert answer — MERGE WITH HOLDLOCK handles concurrent retries
        await _answerRepo.UpsertAsync(
            cmd.SessionId, cmd.QuestionId,
            cmd.SelectedOption, cmd.IdempotencyKey, ct);
    }
}
