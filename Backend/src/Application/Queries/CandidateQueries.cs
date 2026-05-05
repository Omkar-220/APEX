using Application.Commands;
using Application.DTOs;
using Application.Services;
using Domain.Enums;
using Domain.Ports.Repositories;
using Domain.Ports.Services;
using System.Text.Json;

namespace Application.Queries;

// ── Get Me ────────────────────────────────────────────────────────────────────

public record GetMeQuery(string Oid, string Email, string DisplayName);

public class GetMeHandler
{
    private readonly ProvisionCandidateHandler _provision;
    public GetMeHandler(ProvisionCandidateHandler provision) => _provision = provision;

    public Task<CandidateDto> HandleAsync(GetMeQuery query, CancellationToken ct = default) =>
        _provision.HandleAsync(new ProvisionCandidateCommand(query.Oid, query.Email, query.DisplayName), ct);
}

// ── Get My Assignments ────────────────────────────────────────────────────────

public record GetMyAssignmentsQuery(Guid CandidateId);

public class GetMyAssignmentsHandler
{
    private readonly ITestAssignmentRepository _assignmentRepo;
    private readonly IBatchRepository _batchRepo;

    public GetMyAssignmentsHandler(
        ITestAssignmentRepository assignmentRepo,
        IBatchRepository batchRepo)
    {
        _assignmentRepo = assignmentRepo;
        _batchRepo = batchRepo;
    }

    public async Task<List<AssignmentDto>> HandleAsync(GetMyAssignmentsQuery query, CancellationToken ct = default)
    {
        var utcNow = DateTime.UtcNow;

        // Direct assignments
        var direct = await _assignmentRepo.GetForCandidateAsync(query.CandidateId, ct);

        // Batch assignments
        var batchIds = await _batchRepo.GetBatchIdsForCandidateAsync(query.CandidateId, ct);
        var batched = batchIds.Count > 0
            ? await _assignmentRepo.GetForBatchesAsync(batchIds, ct)
            : new List<Domain.Entities.TestAssignment>();

        // Merge and deduplicate
        var all = direct
            .Concat(batched)
            .DistinctBy(a => a.AssignmentId)
            .Where(a =>
                // Upcoming: within next 24h or already started
                (a.Status == AssignmentStatus.Pending && a.ScheduledStart <= utcNow.AddHours(24)) ||
                // Active window
                a.Status == AssignmentStatus.Active ||
                // History
                a.Status == AssignmentStatus.Completed)
            .OrderBy(a => a.ScheduledStart)
            .ToList();

        return all.Select(a => new AssignmentDto(
            a.AssignmentId,
            a.TestId,
            a.Test.Title,
            a.ScheduledStart,
            a.Deadline,
            a.Status.ToString(),
            a.Test.DurationMinutes,
            a.QuestionCount,
            a.MaxAttempts)).ToList();
    }
}

// ── Get Question ──────────────────────────────────────────────────────────────

public record GetQuestionQuery(Guid SessionId, Guid CandidateId, Guid QuestionId);

public class GetQuestionHandler
{
    private readonly ISessionRepository _sessionRepo;
    private readonly ISessionQuestionMappingRepository _mappingRepo;
    private readonly IQuestionRepository _questionRepo;

    public GetQuestionHandler(
        ISessionRepository sessionRepo,
        ISessionQuestionMappingRepository mappingRepo,
        IQuestionRepository questionRepo)
    {
        _sessionRepo = sessionRepo;
        _mappingRepo = mappingRepo;
        _questionRepo = questionRepo;
    }

    public async Task<QuestionDisplayDto> HandleAsync(GetQuestionQuery query, CancellationToken ct = default)
    {
        var session = await _sessionRepo.GetByIdAsync(query.SessionId, ct)
            ?? throw new KeyNotFoundException($"Session {query.SessionId} not found.");

        if (session.CandidateId != query.CandidateId)
            throw new UnauthorizedAccessException("Session does not belong to this candidate.");

        var mapping = await _mappingRepo.GetAsync(query.SessionId, query.QuestionId, ct)
            ?? throw new KeyNotFoundException($"Question {query.QuestionId} not found in session.");

        var question = await _questionRepo.GetByIdAsync(query.QuestionId, ct)
            ?? throw new KeyNotFoundException($"Question {query.QuestionId} not found.");

        // Deserialize option mapping: { displayKey -> originalKey }
        var optionMap = JsonSerializer.Deserialize<Dictionary<char, char>>(mapping.OptionMapping)!;

        // Build display options — candidate sees shuffled order, never original keys
        var displayOptions = new Dictionary<string, string>
        {
            ["A"] = question.GetOptionText(optionMap['A']),
            ["B"] = question.GetOptionText(optionMap['B']),
            ["C"] = question.GetOptionText(optionMap['C']),
            ["D"] = question.GetOptionText(optionMap['D'])
        };

        var totalQuestions = await _mappingRepo.GetBySessionAsync(query.SessionId, ct);

        return new QuestionDisplayDto(
            question.QuestionId,
            question.Content,
            displayOptions,
            mapping.QuestionPosition,
            totalQuestions.Count);
    }
}

// ── Get Test Status ───────────────────────────────────────────────────────────

public record GetTestStatusQuery(Guid SessionId, Guid CandidateId);

public class GetTestStatusHandler
{
    private readonly ISessionRepository _sessionRepo;
    private readonly IAnswerRepository _answerRepo;
    private readonly ISessionQuestionMappingRepository _mappingRepo;
    private readonly IAuditRepository _auditRepo;
    private readonly SessionStatusCacheService _cache;
    private readonly FinalizeTestHandler _finalizeHandler;

    public GetTestStatusHandler(
        ISessionRepository sessionRepo,
        IAnswerRepository answerRepo,
        ISessionQuestionMappingRepository mappingRepo,
        IAuditRepository auditRepo,
        SessionStatusCacheService cache,
        FinalizeTestHandler finalizeHandler)
    {
        _sessionRepo = sessionRepo;
        _answerRepo = answerRepo;
        _mappingRepo = mappingRepo;
        _auditRepo = auditRepo;
        _cache = cache;
        _finalizeHandler = finalizeHandler;
    }

    public async Task<TestStatusDto> HandleAsync(GetTestStatusQuery query, CancellationToken ct = default)
    {
        // Try cache first (only for non-near-expiry sessions)
        var cached = _cache.Get(query.SessionId);
        if (cached != null) return cached;

        // Cache miss or near-expiry — query DB directly
        var session = await _sessionRepo.GetByIdAsync(query.SessionId, ct)
            ?? throw new KeyNotFoundException($"Session {query.SessionId} not found.");

        if (session.CandidateId != query.CandidateId)
            throw new UnauthorizedAccessException("Session does not belong to this candidate.");

        var utcNow = DateTime.UtcNow;
        var timeRemaining = session.ComputeTimeRemainingSec(session.Test.DurationMinutes, utcNow);

        // Time expired and still Active — fire-and-forget finalize, return Completed immediately
        if (timeRemaining == 0 && session.Status == Domain.Enums.TestSessionStatus.Active)
        {
            _ = Task.Run(() => _finalizeHandler.HandleAsync(
                new FinalizeTestCommand(query.SessionId, query.CandidateId, "auto_expired"),
                CancellationToken.None));

            return new TestStatusDto(query.SessionId, 0, "Completed", null,
                await _answerRepo.CountBySessionAsync(query.SessionId, ct),
                (await _mappingRepo.GetBySessionAsync(query.SessionId, ct)).Count,
                await _auditRepo.CountViolationsAsync(query.SessionId, ct));
        }

        var answers = await _answerRepo.GetBySessionAsync(query.SessionId, ct);
        var mappings = await _mappingRepo.GetBySessionAsync(query.SessionId, ct);
        var violationCount = await _auditRepo.CountViolationsAsync(query.SessionId, ct);

        var answeredIds = answers.Select(a => a.QuestionId).ToHashSet();
        var currentQuestion = mappings
            .OrderBy(m => m.QuestionPosition)
            .FirstOrDefault(m => !answeredIds.Contains(m.QuestionId))?.QuestionId;

        var status = new TestStatusDto(
            query.SessionId,
            timeRemaining,
            session.Status.ToString(),
            currentQuestion,
            answers.Count,
            mappings.Count,
            violationCount);

        // Seed cache for this session (sweep may not have picked it up yet)
        _cache.Set(query.SessionId, status, session.StartTime, session.Test.DurationMinutes);

        return status;
    }
}

// ── Get Test Result ───────────────────────────────────────────────────────────

public record GetTestResultQuery(Guid SessionId, Guid CandidateId);

public class GetTestResultHandler
{
    private readonly ISessionRepository _sessionRepo;
    private readonly IResultCachePort _resultCache;
    private readonly FinalizeTestHandler _finalizeHandler;

    public GetTestResultHandler(
        ISessionRepository sessionRepo,
        IResultCachePort resultCache,
        FinalizeTestHandler finalizeHandler)
    {
        _sessionRepo = sessionRepo;
        _resultCache = resultCache;
        _finalizeHandler = finalizeHandler;
    }

    public async Task<TestResultDto> HandleAsync(GetTestResultQuery query, CancellationToken ct = default)
    {
        var session = await _sessionRepo.GetByIdAsync(query.SessionId, ct)
            ?? throw new KeyNotFoundException($"Session {query.SessionId} not found.");

        if (session.CandidateId != query.CandidateId)
            throw new UnauthorizedAccessException("Session does not belong to this candidate.");

        if (session.Status == Domain.Enums.TestSessionStatus.Active)
            throw new InvalidOperationException("Session is still active.");

        var cached = _resultCache.Get<FinalizeResultDto>(query.SessionId);
        if (cached != null)
            return new TestResultDto(cached.Score, cached.TotalQuestions, cached.Passed, cached.Percentage, session.EndTime!.Value);

        // Not in cache — recompute via finalize (idempotent)
        var result = await _finalizeHandler.HandleAsync(
            new FinalizeTestCommand(query.SessionId, query.CandidateId, "result_fetch"), ct);

        return new TestResultDto(result.Score, result.TotalQuestions, result.Passed, result.Percentage, session.EndTime!.Value);
    }
}
