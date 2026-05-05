using Application.DTOs;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Ports.Repositories;
using Domain.ValueObjects;
using FluentAssertions;
using Moq;

namespace Application.Tests.Services;

public class CandidateContextServiceTests
{
    private readonly Mock<ICandidateRepository> _repo = new();
    private readonly CandidateContextService _sut;

    public CandidateContextServiceTests()
    {
        _sut = new CandidateContextService(_repo.Object);
    }

    private static Candidate MakeCandidate(string oid = "test-oid", string email = "user@test.com",
        string name = "Test User", Role role = Role.Candidate) =>
        Candidate.Create(email, oid, name, role);

    [Fact]
    public async Task GetAsync_CandidateExists_ReturnsCandidateDto()
    {
        var candidate = MakeCandidate();
        _repo.Setup(r => r.GetByOidAsync("test-oid", default))
             .ReturnsAsync(candidate);

        var result = await _sut.GetAsync("test-oid");

        result.Should().NotBeNull();
        result!.Email.Should().Be("user@test.com");
        result.Role.Should().Be("Candidate");
    }

    [Fact]
    public async Task GetAsync_CandidateNotFound_ReturnsNull()
    {
        _repo.Setup(r => r.GetByOidAsync("unknown-oid", default))
             .ReturnsAsync((Candidate?)null);

        var result = await _sut.GetAsync("unknown-oid");

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetAsync_CalledTwice_OnlyHitsDbOnce()
    {
        var candidate = MakeCandidate();
        _repo.Setup(r => r.GetByOidAsync("test-oid", default))
             .ReturnsAsync(candidate);

        await _sut.GetAsync("test-oid");
        await _sut.GetAsync("test-oid");

        _repo.Verify(r => r.GetByOidAsync("test-oid", default), Times.Once);
    }

    [Fact]
    public async Task GetAsync_AdminRole_ReturnsCorrectRole()
    {
        var candidate = MakeCandidate(role: Role.Admin);
        _repo.Setup(r => r.GetByOidAsync("test-oid", default))
             .ReturnsAsync(candidate);

        var result = await _sut.GetAsync("test-oid");

        result!.Role.Should().Be("Admin");
    }

    [Fact]
    public void GetCached_BeforeGetAsync_ReturnsNull()
    {
        _sut.GetCached().Should().BeNull();
    }

    [Fact]
    public async Task GetCached_AfterGetAsync_ReturnsCachedValue()
    {
        var candidate = MakeCandidate();
        _repo.Setup(r => r.GetByOidAsync("test-oid", default))
             .ReturnsAsync(candidate);

        await _sut.GetAsync("test-oid");

        _sut.GetCached().Should().NotBeNull();
        _sut.GetCached()!.Email.Should().Be("user@test.com");
    }

    [Fact]
    public async Task Invalidate_ClearsCachedValue()
    {
        var candidate = MakeCandidate();
        _repo.Setup(r => r.GetByOidAsync("test-oid", default))
             .ReturnsAsync(candidate);

        await _sut.GetAsync("test-oid");
        _sut.Invalidate();

        _sut.GetCached().Should().BeNull();
    }

    [Fact]
    public async Task GetAsync_AfterInvalidate_HitsDbAgain()
    {
        var candidate = MakeCandidate();
        _repo.Setup(r => r.GetByOidAsync("test-oid", default))
             .ReturnsAsync(candidate);

        await _sut.GetAsync("test-oid");
        _sut.Invalidate();
        await _sut.GetAsync("test-oid");

        _repo.Verify(r => r.GetByOidAsync("test-oid", default), Times.Exactly(2));
    }
}
