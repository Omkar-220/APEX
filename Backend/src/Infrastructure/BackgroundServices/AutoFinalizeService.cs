using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundServices;

public class AutoFinalizeService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AutoFinalizeService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    public AutoFinalizeService(IServiceScopeFactory scopeFactory, ILogger<AutoFinalizeService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(Interval, stoppingToken);
            try
            {
                await ProcessExpiredSessionsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AutoFinalizeService tick failed");
            }
        }
    }

    private async Task ProcessExpiredSessionsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<Persistence.AppDbContext>();

        var utcNow = DateTime.UtcNow;

        // Find active sessions where StartTime + DurationMinutes has passed
        var expired = await context.TestSessions
            .Include(s => s.Test)
            .Where(s => s.Status == TestSessionStatus.Active)
            .Where(s => EF.Functions.DateDiffSecond(s.StartTime, utcNow) >= s.Test.DurationMinutes * 60)
            .ToListAsync(ct);

        foreach (var session in expired)
        {
            try
            {
                // Score existing answers
                var answers = await context.Answers
                    .Where(a => a.SessionId == session.SessionId)
                    .ToListAsync(ct);

                var mappings = await context.SessionQuestionMappings
                    .Include(m => m.Question)
                    .Where(m => m.SessionId == session.SessionId)
                    .ToListAsync(ct);

                var score = ScoreAnswers(answers, mappings);

                var updated = await context.TestSessions
                    .Where(s => s.SessionId == session.SessionId && s.RowVersion == session.RowVersion)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(x => x.Score, score)
                        .SetProperty(x => x.EndTime, utcNow)
                        .SetProperty(x => x.Status, TestSessionStatus.Completed), ct);

                if (updated > 0)
                {
                    await context.AuditEvents.AddAsync(
                        Domain.Entities.AuditEvent.Create(session.SessionId, "exam_finalized",
                            "{\"triggeredBy\":\"auto_expired\"}"), ct);
                    await context.SaveChangesAsync(ct);
                    _logger.LogInformation("Auto-finalized session {SessionId} with score {Score}",
                        session.SessionId, score);
                }
                else
                {
                    _logger.LogDebug("Session {SessionId} already finalized by another process", session.SessionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to auto-finalize session {SessionId}", session.SessionId);
            }
        }
    }

    private static int ScoreAnswers(
        List<Domain.Entities.Answer> answers,
        List<Domain.Entities.SessionQuestionMapping> mappings)
    {
        var score = 0;
        foreach (var answer in answers)
        {
            var mapping = mappings.FirstOrDefault(m => m.QuestionId == answer.QuestionId);
            if (mapping == null) continue;

            var optionMap = System.Text.Json.JsonSerializer
                .Deserialize<Dictionary<char, char>>(mapping.OptionMapping);
            if (optionMap == null) continue;

            if (optionMap.TryGetValue(answer.SelectedOption, out var original) &&
                original == mapping.Question.CorrectOption)
                score++;
        }
        return score;
    }
}
