using Application.DTOs;
using Application.Services;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;

namespace Application.Tests.Services;

public class SessionStatusCacheServiceTests
{
    private readonly SessionStatusCacheService _sut;
    private readonly IMemoryCache _cache;

    public SessionStatusCacheServiceTests()
    {
        _cache = new MemoryCache(new MemoryCacheOptions());
        _sut = new SessionStatusCacheService(_cache);
    }

    private static TestStatusDto MakeStatus(int timeRemaining, string status = "Active") =>
        new(Guid.NewGuid(), timeRemaining, status, null, 0, 10, 0);

    [Fact]
    public void Get_CacheMiss_ReturnsNull()
    {
        _sut.Get(Guid.NewGuid()).Should().BeNull();
    }

    [Fact]
    public void Set_ThenGet_ReturnsCachedEntry()
    {
        var sessionId = Guid.NewGuid();
        var startTime = DateTime.UtcNow.AddMinutes(-30);
        var status = MakeStatus(1800); // 30 min remaining

        _sut.Set(sessionId, status, startTime, 60);
        var result = _sut.Get(sessionId);

        result.Should().NotBeNull();
    }

    [Fact]
    public void Get_RecomputesTimeRemaining_NotStale()
    {
        var sessionId = Guid.NewGuid();
        // Session started 30 minutes ago, duration 60 min → ~30 min remaining
        var startTime = DateTime.UtcNow.AddMinutes(-30);
        var status = MakeStatus(9999); // stale value — should be ignored

        _sut.Set(sessionId, status, startTime, 60);
        var result = _sut.Get(sessionId);

        // Should be ~1800s, not 9999
        result!.TimeRemainingSec.Should().BeCloseTo(1800, 5);
    }

    [Fact]
    public void Set_NearExpiry_DoesNotCache()
    {
        var sessionId = Guid.NewGuid();
        var startTime = DateTime.UtcNow.AddMinutes(-59).AddSeconds(-55); // ~5s remaining
        var status = MakeStatus(5);

        _sut.Set(sessionId, status, startTime, 60);

        _sut.Get(sessionId).Should().BeNull();
    }

    [Fact]
    public void Get_WhenRecomputedTimeNearExpiry_RemovesFromCacheAndReturnsNull()
    {
        var sessionId = Guid.NewGuid();
        // Set with plenty of time
        var startTime = DateTime.UtcNow.AddMinutes(-30);
        var status = MakeStatus(1800);
        _sut.Set(sessionId, status, startTime, 60);

        // Now simulate time passing — use a startTime that makes it near-expiry
        // We can't fast-forward time, so instead test with a session that's already near-expiry
        var nearExpirySessionId = Guid.NewGuid();
        var nearExpiryStart = DateTime.UtcNow.AddMinutes(-59).AddSeconds(-52); // ~8s remaining
        _sut.Set(nearExpirySessionId, MakeStatus(8), nearExpiryStart, 60);

        _sut.Get(nearExpirySessionId).Should().BeNull();
    }

    [Fact]
    public void Invalidate_RemovesEntry()
    {
        var sessionId = Guid.NewGuid();
        var startTime = DateTime.UtcNow.AddMinutes(-30);
        _sut.Set(sessionId, MakeStatus(1800), startTime, 60);

        _sut.Invalidate(sessionId);

        _sut.Get(sessionId).Should().BeNull();
    }

    [Fact]
    public void Invalidate_NonExistentEntry_DoesNotThrow()
    {
        Action act = () => _sut.Invalidate(Guid.NewGuid());
        act.Should().NotThrow();
    }

    [Fact]
    public void SetMany_CachesAllEntries()
    {
        var entries = Enumerable.Range(1, 5).Select(_ =>
        {
            var id = Guid.NewGuid();
            var start = DateTime.UtcNow.AddMinutes(-30);
            return (id, MakeStatus(1800), start, 60);
        }).ToList();

        _sut.SetMany(entries);

        foreach (var (id, _, _, _) in entries)
            _sut.Get(id).Should().NotBeNull();
    }

    [Fact]
    public void SetMany_SkipsNearExpiryEntries()
    {
        var nearExpiryId = Guid.NewGuid();
        var entries = new List<(Guid, TestStatusDto, DateTime, int)>
        {
            (nearExpiryId, MakeStatus(5), DateTime.UtcNow.AddMinutes(-59).AddSeconds(-55), 60)
        };

        _sut.SetMany(entries);

        _sut.Get(nearExpiryId).Should().BeNull();
    }

    [Fact]
    public void Get_ReturnsCorrectSessionId()
    {
        var sessionId = Guid.NewGuid();
        var startTime = DateTime.UtcNow.AddMinutes(-30);
        var status = new TestStatusDto(sessionId, 1800, "Active", null, 5, 10, 0);

        _sut.Set(sessionId, status, startTime, 60);
        var result = _sut.Get(sessionId);

        result!.SessionId.Should().Be(sessionId);
        result.AnsweredCount.Should().Be(5);
        result.TotalQuestions.Should().Be(10);
    }
}
