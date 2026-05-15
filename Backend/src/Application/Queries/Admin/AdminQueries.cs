using Application.DTOs;
using Domain.Enums;
using Domain.Ports.Repositories;
using System.Text.Json;

namespace Application.Queries.Admin;

// ── Get Admin Users ───────────────────────────────────────────────────────────

public class GetAdminUsersHandler
{
    private readonly ICandidateRepository _repo;
    public GetAdminUsersHandler(ICandidateRepository repo) => _repo = repo;

    public async Task<List<CandidateDto>> HandleAsync(CancellationToken ct = default)
    {
        var candidates = await _repo.GetAllAsync(ct);
        return candidates.Select(c => new CandidateDto(
            c.CandidateId,
            c.EmailValue,
            c.DisplayNameValue,
            c.Role.ToString())).ToList();
    }
}

// ── Get Admin Sessions ────────────────────────────────────────────────────────

public record GetAdminSessionsQuery(Guid TestId, string? Status);

public class GetAdminSessionsHandler
{
    private readonly ISessionRepository _sessionRepo;

    public GetAdminSessionsHandler(ISessionRepository sessionRepo)
    {
        _sessionRepo = sessionRepo;
    }

    public async Task<List<AdminSessionDto>> HandleAsync(GetAdminSessionsQuery query, CancellationToken ct = default)
    {
        TestSessionStatus? status = query.Status != null
            ? Enum.Parse<TestSessionStatus>(query.Status) : null;

        var sessions = await _sessionRepo.GetByTestAsync(query.TestId, status, ct);

        return sessions.Select(s => new AdminSessionDto(
            s.SessionId,
            s.Candidate.EmailValue,
            s.Status.ToString(),
            s.Score,
            s.StartTime)).ToList();
    }
}

// ── Get Question Batches ──────────────────────────────────────────────────────

public class GetQuestionBatchesHandler
{
    private readonly IQuestionBatchRepository _repo;
    public GetQuestionBatchesHandler(IQuestionBatchRepository repo) => _repo = repo;

    public async Task<List<QuestionBatchDto>> HandleAsync(CancellationToken ct = default)
    {
        var batches = await _repo.GetAllAsync(ct);
        return batches.Select(b => new QuestionBatchDto(
            b.QuestionBatchId,
            b.Name,
            b.Domain,
            b.Topic,
            b.Difficulty?.ToString(),
            b.QuestionBatchMembers.Count,
            b.IsActive,
            b.CreatedAt)).ToList();
    }
}

// ── Get Tests ─────────────────────────────────────────────────────────────────

public class GetTestsHandler
{
    private readonly ITestRepository _repo;
    public GetTestsHandler(ITestRepository repo) => _repo = repo;

    public async Task<List<TestDto>> HandleAsync(CancellationToken ct = default)
    {
        var tests = await _repo.GetAllAsync(ct);
        return tests.Select(t => new TestDto(
            t.TestId,
            t.Title,
            t.Description,
            t.DurationMinutes,
            t.PassingScorePercent,
            t.IsActive,
            t.CreatedAt)).ToList();
    }
}

// ── Get Assignments ───────────────────────────────────────────────────────────

public class GetAssignmentsHandler
{
    private readonly ITestAssignmentRepository _repo;
    public GetAssignmentsHandler(ITestAssignmentRepository repo) => _repo = repo;

    public async Task<List<AdminAssignmentDto>> HandleAsync(CancellationToken ct = default)
    {
        var assignments = await _repo.GetAllAsync(ct);
        return assignments.Select(a => new AdminAssignmentDto(
            a.AssignmentId,
            a.TestId,
            a.Test?.Title ?? string.Empty,
            a.QuestionBatchId,
            a.QuestionBatch?.Name ?? string.Empty,
            a.BatchId,
            a.Batch?.Name,
            a.CandidateId,
            a.Candidate?.EmailValue,
            a.QuestionCount,
            a.ScheduledStart,
            a.Deadline,
            a.Status.ToString(),
            a.MaxAttempts,
            a.CreatedAt)).ToList();
    }
}

// ── Get Candidate Batches ─────────────────────────────────────────────────────

public class GetBatchesHandler
{
    private readonly IBatchRepository _repo;
    public GetBatchesHandler(IBatchRepository repo) => _repo = repo;

    public async Task<List<CandidateBatchDto>> HandleAsync(CancellationToken ct = default)
    {
        var batches = await _repo.GetAllAsync(ct);
        return batches.Select(b => new CandidateBatchDto(
            b.BatchId,
            b.Name,
            b.Domain,
            b.Topic,
            b.Difficulty?.ToString(),
            b.Members.Count,
            b.IsActive,
            b.CreatedAt)).ToList();
    }
}

// ── Get Completed Sessions (all batches) ──────────────────────────────────────

public class GetCompletedSessionsHandler
{
    private readonly ISessionRepository _sessionRepo;
    private readonly ITestAssignmentRepository _assignmentRepo;
    private readonly IAuditRepository _auditRepo;

    public GetCompletedSessionsHandler(
        ISessionRepository sessionRepo,
        ITestAssignmentRepository assignmentRepo,
        IAuditRepository auditRepo)
    {
        _sessionRepo = sessionRepo;
        _assignmentRepo = assignmentRepo;
        _auditRepo = auditRepo;
    }

    public async Task<List<CompletedSessionDto>> HandleAsync(CancellationToken ct = default)
    {
        var assignments = await _assignmentRepo.GetAllAsync(ct);
        var assignmentIds = assignments.Select(a => a.AssignmentId).ToList();

        var sessionMap = await _sessionRepo.GetLatestCompletedByAssignmentsAsync(assignmentIds, ct);

        // Single batch query — no concurrent DbContext operations
        var sessionIds = sessionMap.Keys.ToList();
        var violationCounts = await _auditRepo.CountViolationsBatchAsync(sessionIds, ct);

        var assignmentLookup = assignments.ToDictionary(a => a.AssignmentId);

        return sessionMap.Values
            .OrderByDescending(s => s.EndTime)
            .Select(s =>
            {
                var assignment = assignmentLookup[s.AssignmentId];
                var totalQ = assignment.QuestionCount;
                var pct = totalQ > 0 ? Math.Round((decimal)(s.Score ?? 0) / totalQ * 100, 1) : 0;
                var passed = pct >= (assignment.Test?.PassingScorePercent ?? 60);
                var durationSec = s.EndTime.HasValue
                    ? (int)(s.EndTime.Value - s.StartTime).TotalSeconds : 0;

                return new CompletedSessionDto(
                    s.SessionId,
                    s.TestId,
                    assignment.Test?.Title ?? string.Empty,
                    s.AssignmentId,
                    assignment.Batch?.Name,
                    s.Candidate.EmailValue,
                    s.Candidate.DisplayNameValue,
                    s.Score ?? 0,
                    totalQ,
                    pct,
                    passed,
                    violationCounts.GetValueOrDefault(s.SessionId, 0),
                    s.StartTime,
                    s.EndTime ?? s.StartTime,
                    durationSec);
            }).ToList();
    }
}

// ── Get Session Scorecard ─────────────────────────────────────────────────────

public record GetScorecardQuery(Guid SessionId);

public class GetScorecardHandler
{
    private readonly ISessionRepository _sessionRepo;
    private readonly IAnswerRepository _answerRepo;
    private readonly ISessionQuestionMappingRepository _mappingRepo;
    private readonly IQuestionRepository _questionRepo;
    private readonly IAuditRepository _auditRepo;
    private readonly ITestAssignmentRepository _assignmentRepo;

    public GetScorecardHandler(
        ISessionRepository sessionRepo,
        IAnswerRepository answerRepo,
        ISessionQuestionMappingRepository mappingRepo,
        IQuestionRepository questionRepo,
        IAuditRepository auditRepo,
        ITestAssignmentRepository assignmentRepo)
    {
        _sessionRepo = sessionRepo;
        _answerRepo = answerRepo;
        _mappingRepo = mappingRepo;
        _questionRepo = questionRepo;
        _auditRepo = auditRepo;
        _assignmentRepo = assignmentRepo;
    }

    public async Task<SessionScorecardDto> HandleAsync(GetScorecardQuery query, CancellationToken ct = default)
    {
        var session = await _sessionRepo.GetByIdAsync(query.SessionId, ct)
            ?? throw new KeyNotFoundException($"Session {query.SessionId} not found.");

        var assignment = await _assignmentRepo.GetByIdAsync(session.AssignmentId, ct)
            ?? throw new KeyNotFoundException($"Assignment {session.AssignmentId} not found.");

        var answers   = await _answerRepo.GetBySessionAsync(query.SessionId, ct);
        var mappings  = await _mappingRepo.GetBySessionAsync(query.SessionId, ct);
        var auditEvts = await _auditRepo.GetBySessionAsync(query.SessionId, ct);
        var violations = auditEvts.Count(e =>
            e.EventType is "focus_lost" or "multi_tab_opened" or "fullscreen_exit");

        var questionIds = mappings.Select(m => m.QuestionId).ToList();
        var questions   = await _questionRepo.GetByIdsAsync(questionIds, ct);
        var qLookup     = questions.ToDictionary(q => q.QuestionId);
        var answerLookup = answers.ToDictionary(a => a.QuestionId);

        var scorecardAnswers = mappings.OrderBy(m => m.QuestionPosition).Select(m =>
        {
            var q = qLookup[m.QuestionId];
            var optionMap = JsonSerializer.Deserialize<Dictionary<char, char>>(m.OptionMapping)!;
            // Reverse map: display key -> original key
            // optionMap is displayKey -> originalKey
            answerLookup.TryGetValue(m.QuestionId, out var answer);
            var selectedDisplay = answer?.SelectedOption;
            // Map selected display option back to original to check correctness
            char? originalSelected = selectedDisplay.HasValue && optionMap.TryGetValue(selectedDisplay.Value, out var orig)
                ? orig : null;
            var isCorrect = originalSelected.HasValue && originalSelected.Value == q.CorrectOption;

            // Build display options (A/B/C/D -> text)
            return new ScorecardAnswerDto(
                q.QuestionId,
                q.Content,
                q.GetOptionText(optionMap['A']),
                q.GetOptionText(optionMap['B']),
                q.GetOptionText(optionMap['C']),
                q.GetOptionText(optionMap['D']),
                // Correct display option = the display key that maps to the original correct
                optionMap.First(kv => kv.Value == q.CorrectOption).Key.ToString(),
                selectedDisplay?.ToString(),
                isCorrect,
                q.Weightage);
        }).ToList();

        var totalQ = assignment.QuestionCount;
        var score  = session.Score ?? 0;
        var pct    = totalQ > 0 ? Math.Round((decimal)score / totalQ * 100, 1) : 0;
        var passed = pct >= assignment.Test.PassingScorePercent;
        var durationSec = session.EndTime.HasValue
            ? (int)(session.EndTime.Value - session.StartTime).TotalSeconds : 0;

        return new SessionScorecardDto(
            session.SessionId,
            session.Candidate.EmailValue,
            session.Candidate.DisplayNameValue,
            assignment.Test.Title,
            assignment.Batch?.Name,
            score,
            totalQ,
            pct,
            passed,
            assignment.Test.PassingScorePercent,
            violations,
            session.StartTime,
            session.EndTime ?? session.StartTime,
            durationSec,
            scorecardAnswers,
            auditEvts.Select(e => new AuditEventDto(e.EventType, e.Payload, e.OccurredAt)).ToList());
    }
}
