using Application.DTOs;
using Microsoft.Extensions.Caching.Memory;

namespace Application.Services;

public class SessionStatusCacheService
{
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan Ttl = TimeSpan.FromSeconds(6);

    // Store the raw data needed to recompute time on read
    private record CachedSessionStatus(
        Guid SessionId,
        DateTime StartTime,
        int DurationMinutes,
        string Status,
        Guid? CurrentQuestionId,
        int AnsweredCount,
        int TotalQuestions,
        int ViolationCount);

    public SessionStatusCacheService(IMemoryCache cache) => _cache = cache;

    public void Set(Guid sessionId, TestStatusDto status, DateTime startTime, int durationMinutes)
    {
        if (status.TimeRemainingSec <= 10) return;
        _cache.Set(CacheKey(sessionId), new CachedSessionStatus(
            sessionId, startTime, durationMinutes,
            status.Status, status.CurrentQuestionId,
            status.AnsweredCount, status.TotalQuestions, status.ViolationCount), Ttl);
    }

    public TestStatusDto? Get(Guid sessionId)
    {
        if (!_cache.TryGetValue(CacheKey(sessionId), out CachedSessionStatus? cached))
            return null;

        // Recompute time remaining on every read — never serve stale time
        var elapsed = (DateTime.UtcNow - cached!.StartTime).TotalSeconds;
        var timeRemaining = (int)Math.Max(0, cached.DurationMinutes * 60 - elapsed);

        if (timeRemaining <= 10)
        {
            _cache.Remove(CacheKey(sessionId));
            return null;
        }

        return new TestStatusDto(
            cached.SessionId,
            timeRemaining,
            cached.Status,
            cached.CurrentQuestionId,
            cached.AnsweredCount,
            cached.TotalQuestions,
            cached.ViolationCount);
    }

    public void Invalidate(Guid sessionId) => _cache.Remove(CacheKey(sessionId));

    public void SetMany(IEnumerable<(Guid sessionId, TestStatusDto status, DateTime startTime, int durationMinutes)> entries)
    {
        foreach (var (sessionId, status, startTime, durationMinutes) in entries)
            Set(sessionId, status, startTime, durationMinutes);
    }

    private static string CacheKey(Guid sessionId) => $"session_status:{sessionId}";
}
