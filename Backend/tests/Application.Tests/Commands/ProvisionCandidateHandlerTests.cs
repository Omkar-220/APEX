using Application.Commands;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using Domain.Ports.Repositories;
using FluentAssertions;
using Moq;

namespace Application.Tests.Commands;

public class ProvisionCandidateHandlerTests
{
    private readonly Mock<ICandidateRepository> _repo = new();
    private readonly ProvisionCandidateHandler _sut;

    public ProvisionCandidateHandlerTests() =>
        _sut = new ProvisionCandidateHandler(_repo.Object);

    [Fact]
    public async Task Handle_ExistingCandidate_ReturnsExistingWithoutInsert()
    {
        var existing = TestBuilders.MakeCandidate();
        _repo.Setup(r => r.GetByOidAsync("test-oid", default)).ReturnsAsync(existing);

        var result = await _sut.HandleAsync(
            new ProvisionCandidateCommand("test-oid", "user@test.com", "Test User"));

        result.Email.Should().Be("user@test.com");
        _repo.Verify(r => r.AddOrGetExistingAsync(It.IsAny<Candidate>(), default), Times.Never);
    }

    [Fact]
    public async Task Handle_ExistingCandidate_DisplayNameChanged_UpdatesName()
    {
        var existing = TestBuilders.MakeCandidate(name: "Old Name");
        _repo.Setup(r => r.GetByOidAsync("test-oid", default)).ReturnsAsync(existing);

        await _sut.HandleAsync(
            new ProvisionCandidateCommand("test-oid", "user@test.com", "New Name"));

        _repo.Verify(r => r.UpdateAsync(existing, default), Times.Once);
    }

    [Fact]
    public async Task Handle_ExistingCandidate_SameDisplayName_DoesNotUpdate()
    {
        var existing = TestBuilders.MakeCandidate(name: "Same Name");
        _repo.Setup(r => r.GetByOidAsync("test-oid", default)).ReturnsAsync(existing);

        await _sut.HandleAsync(
            new ProvisionCandidateCommand("test-oid", "user@test.com", "Same Name"));

        _repo.Verify(r => r.UpdateAsync(It.IsAny<Candidate>(), default), Times.Never);
    }

    [Fact]
    public async Task Handle_NewCandidate_CallsAddOrGetExisting()
    {
        _repo.Setup(r => r.GetByOidAsync("new-oid", default)).ReturnsAsync((Candidate?)null);
        _repo.Setup(r => r.AddOrGetExistingAsync(It.IsAny<Candidate>(), default))
             .ReturnsAsync((Candidate c, CancellationToken _) => c);

        var result = await _sut.HandleAsync(
            new ProvisionCandidateCommand("new-oid", "new@test.com", "New User"));

        result.Email.Should().Be("new@test.com");
        result.Role.Should().Be("Candidate");
        _repo.Verify(r => r.AddOrGetExistingAsync(It.IsAny<Candidate>(), default), Times.Once);
    }

    [Fact]
    public async Task Handle_NewCandidate_DefaultRoleIsCandidate()
    {
        _repo.Setup(r => r.GetByOidAsync(It.IsAny<string>(), default)).ReturnsAsync((Candidate?)null);
        _repo.Setup(r => r.AddOrGetExistingAsync(It.IsAny<Candidate>(), default))
             .ReturnsAsync((Candidate c, CancellationToken _) => c);

        var result = await _sut.HandleAsync(
            new ProvisionCandidateCommand("oid", "user@test.com", "Name"));

        result.Role.Should().Be("Candidate");
    }

    [Fact]
    public async Task Handle_RaceCondition_ReturnsExistingCandidate()
    {
        var raceWinner = TestBuilders.MakeCandidate(oid: "oid", email: "user@test.com");
        _repo.Setup(r => r.GetByOidAsync("oid", default)).ReturnsAsync((Candidate?)null);
        _repo.Setup(r => r.AddOrGetExistingAsync(It.IsAny<Candidate>(), default))
             .ReturnsAsync(raceWinner); // repo returns existing on race

        var result = await _sut.HandleAsync(
            new ProvisionCandidateCommand("oid", "user@test.com", "Name"));

        result.CandidateId.Should().Be(raceWinner.CandidateId);
    }
}
