using Application.DTOs;
using Application.Services;
using Domain.Ports.Repositories;
using Domain.Ports.Services;
using System.Text.Json;

namespace Application.Commands;

public record FinalizeTestCommand(Guid SessionId, Guid CandidateId, string TriggeredBy, bool IsSystemTriggered = false);

/// <summary>
/// Abstraction over FinalizeTestHandler for testability.
/// </summary>
public interface IFinalizeTestHandler
{
    Task<FinalizeResultDto> HandleAsync(FinalizeTestCommand cmd, CancellationToken ct = default);
}

public class FinalizeTestHandler : IFinalizeTestHandler
{
    private readonly ISessionRepository _sessionRepo;
    private readonly IAnswerRepository _answerRepo;
    private readonly ISessionQuestionMappingRepository _mappingRepo;
    private readonly IQuestionRepository _questionRepo;
    private readonly ITestRepository _testRepo;
    private readonly ICandidateRepository _candidateRepo;
    private readonly INotificationPort _notification;
    private readonly IResultCachePort _resultCache;
    private readonly SessionStatusCacheService _statusCache;

    public FinalizeTestHandler(
        ISessionRepository sessionRepo,
        IAnswerRepository answerRepo,
        ISessionQuestionMappingRepository mappingRepo,
        IQuestionRepository questionRepo,
        ITestRepository testRepo,
        ICandidateRepository candidateRepo,
        INotificationPort notification,
        IResultCachePort resultCache,
        SessionStatusCacheService statusCache)
    {
        _sessionRepo = sessionRepo;
        _answerRepo = answerRepo;
        _mappingRepo = mappingRepo;
        _questionRepo = questionRepo;
        _testRepo = testRepo;
        _candidateRepo = candidateRepo;
        _notification = notification;
        _resultCache = resultCache;
        _statusCache = statusCache;
    }

    public async Task<FinalizeResultDto> HandleAsync(FinalizeTestCommand cmd, CancellationToken ct = default)
    {
        var session = await _sessionRepo.GetByIdAsync(cmd.SessionId, ct)
            ?? throw new KeyNotFoundException($"Session {cmd.SessionId} not found.");

        if (session.CandidateId != cmd.CandidateId && !cmd.IsSystemTriggered)
            throw new UnauthorizedAccessException("Session does not belong to this candidate.");

        var test = await _testRepo.GetByIdAsync(session.TestId, ct)
            ?? throw new KeyNotFoundException($"Test {session.TestId} not found.");

        // Idempotent — if already finalized return cached result
        if (session.Status != Domain.Enums.TestSessionStatus.Active)
        {
            var cached = _resultCache.Get<FinalizeResultDto>(cmd.SessionId);
            if (cached != null) return cached;
            return await RecomputeResultAsync(session, test, ct);
        }

        // Score answers
        var answers = await _answerRepo.GetBySessionAsync(cmd.SessionId, ct);
        var mappings = await _mappingRepo.GetBySessionAsync(cmd.SessionId, ct);
        var questionIds = mappings.Select(m => m.QuestionId).ToList();
        var questions = await _questionRepo.GetByIdsAsync(questionIds, ct);

        var score = ScoreAnswers(answers, mappings, questions);
        var utcNow = DateTime.UtcNow;

        // Optimistic concurrency update
        var updated = await _sessionRepo.TryFinalizeAsync(
            cmd.SessionId, score, utcNow, session.RowVersion, ct);

        if (!updated)
        {
            // Concurrency conflict — another request finalized first
            var fresh = await _sessionRepo.GetByIdAsync(cmd.SessionId, ct);
            return await RecomputeResultAsync(fresh!, test, ct);
        }

        var percentage = mappings.Count > 0
            ? Math.Round((decimal)score / mappings.Count * 100, 2) : 0;
        var passed = percentage >= test.PassingScorePercent;

        var result = new FinalizeResultDto(true, score, mappings.Count, passed, percentage);

        // Cache result for 1 hour
        _resultCache.Set(cmd.SessionId, result, TimeSpan.FromHours(1));

        // Invalidate status cache immediately — candidate sees Completed on next poll
        _statusCache.Invalidate(cmd.SessionId);

        // Enqueue webhook notification
        var candidate = await _candidateRepo.GetByIdAsync(session.CandidateId, ct);
        await _notification.EnqueueAsync("exam_completed", new
        {
            candidateEmail = candidate?.Email.Value,
            testTitle = test.Title,
            score,
            percentage,
            passed,
            completedAt = utcNow,
            triggeredBy = cmd.TriggeredBy
        }, ct);

        return result;
    }

    private static int ScoreAnswers(
        List<Domain.Entities.Answer> answers,
        List<Domain.Entities.SessionQuestionMapping> mappings,
        List<Domain.Entities.Question> questions)
    {
        var score = 0;
        foreach (var answer in answers)
        {
            var mapping = mappings.FirstOrDefault(m => m.QuestionId == answer.QuestionId);
            var question = questions.FirstOrDefault(q => q.QuestionId == answer.QuestionId);
            if (mapping == null || question == null) continue;

            var optionMap = JsonSerializer.Deserialize<Dictionary<char, char>>(mapping.OptionMapping);
            if (optionMap == null) continue;

            // SelectedOption is the display key — map back to original
            if (optionMap.TryGetValue(answer.SelectedOption, out var original)
                && original == question.CorrectOption)
                score++;
        }
        return score;
    }

    private async Task<FinalizeResultDto> RecomputeResultAsync(
        Domain.Entities.TestSession session,
        Domain.Entities.Test test,
        CancellationToken ct)
    {
        var answers = await _answerRepo.GetBySessionAsync(session.SessionId, ct);
        var mappings = await _mappingRepo.GetBySessionAsync(session.SessionId, ct);
        var questions = await _questionRepo.GetByIdsAsync(
            mappings.Select(m => m.QuestionId).ToList(), ct);

        var score = session.Score ?? ScoreAnswers(answers, mappings, questions);
        var percentage = mappings.Count > 0
            ? Math.Round((decimal)score / mappings.Count * 100, 2) : 0;
        var passed = percentage >= test.PassingScorePercent;

        return new FinalizeResultDto(true, score, mappings.Count, passed, percentage);
    }
}
