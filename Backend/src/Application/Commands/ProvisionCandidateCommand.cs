using Application.DTOs;
using Domain.Entities;
using Domain.Ports.Repositories;

namespace Application.Commands;

public record ProvisionCandidateCommand(string Oid, string Email, string DisplayName);

public class ProvisionCandidateHandler
{
    private readonly ICandidateRepository _repo;

    public ProvisionCandidateHandler(ICandidateRepository repo) => _repo = repo;

    public async Task<CandidateDto> HandleAsync(ProvisionCandidateCommand cmd, CancellationToken ct = default)
    {
        var existing = await _repo.GetByOidAsync(cmd.Oid, ct);
        if (existing != null)
        {
            if (existing.DisplayName.Value != cmd.DisplayName)
            {
                existing.UpdateDisplayName(cmd.DisplayName);
                await _repo.UpdateAsync(existing, ct);
            }
            return ToDto(existing);
        }

        var candidate = Candidate.Create(cmd.Email, cmd.Oid, cmd.DisplayName);

        // Race condition handled inside repository (catches SqlException 2601/2627)
        var result = await _repo.AddOrGetExistingAsync(candidate, ct);
        return ToDto(result);
    }

    private static CandidateDto ToDto(Candidate c) => new(
        c.CandidateId,
        c.Email.Value,
        c.DisplayName.Value,
        c.Role.ToString());
}
