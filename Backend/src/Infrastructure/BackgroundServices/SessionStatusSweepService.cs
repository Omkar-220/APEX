using Application.DTOs;
using Application.Services;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundServices;

public class SessionStatusSweepService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly SessionStatusCacheService _cache;
    private readonly ILogger<SessionStatusSweepService> _logger;

    // Jitter prevents thundering herd if sweep is slightly delayed
    private static readonly Random Jitter = new();

    public SessionStatusSweepService(
        IServiceScopeFactory scopeFactory,
        SessionStatusCacheService cache,
        ILogger<SessionStatusSweepService> logger)
    {
        _scopeFactory = scopeFactory;
        _cache = cache;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // 4.5s–5.5s jitter
            var delay = 4500 + Jitter.Next(0, 1000);
            await Task.Delay(delay, stoppingToken);

            try
            {
                await SweepAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SessionStatusSweepService tick failed");
            }
        }
    }

    private async Task SweepAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<Persistence.AppDbContext>();

        var utcNow = DateTime.UtcNow;

        // Single query — all active sessions with answer counts
        var sessions = await context.TestSessions
            .Where(s => s.Status == TestSessionStatus.Active)
            .Select(s => new
            {
                s.SessionId,
                s.Status,
                s.StartTime,
                DurationMinutes = s.Test.DurationMinutes,
                AnsweredCount = context.Answers.Count(a => a.SessionId == s.SessionId),
                TotalQuestions = context.SessionQuestionMappings.Count(m => m.SessionId == s.SessionId),
                ViolationCount = context.AuditEvents.Count(e => e.SessionId == s.SessionId &&
                    (e.EventType == "focus_lost" || e.EventType == "multi_tab_opened" || e.EventType == "fullscreen_exit")),
                FirstUnansweredPosition = context.SessionQuestionMappings
                    .Where(m => m.SessionId == s.SessionId &&
                                !context.Answers.Any(a => a.SessionId == s.SessionId && a.QuestionId == m.QuestionId))
                    .OrderBy(m => m.QuestionPosition)
                    .Select(m => (Guid?)m.QuestionId)
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        var entries = new List<(Guid, TestStatusDto, DateTime, int)>();

        foreach (var s in sessions)
        {
            var elapsed = (utcNow - s.StartTime).TotalSeconds;
            var timeRemaining = (int)Math.Max(0, s.DurationMinutes * 60 - elapsed);

            // Skip near-expiry — let direct DB query handle these
            if (timeRemaining <= 10) continue;

            var status = new TestStatusDto(
                s.SessionId,
                timeRemaining,
                s.Status.ToString(),
                s.FirstUnansweredPosition,
                s.AnsweredCount,
                s.TotalQuestions,
                s.ViolationCount);

            entries.Add((s.SessionId, status, s.StartTime, s.DurationMinutes));
        }

        _cache.SetMany(entries);

        _logger.LogDebug("SessionStatusSweep: cached {Count} sessions", entries.Count);
    }
}
