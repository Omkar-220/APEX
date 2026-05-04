using Domain.Entities;

namespace Domain.Ports.Repositories;

public interface ICandidateRepository
{
    Task<Candidate?> GetByOidAsync(string azureAdOid, CancellationToken ct = default);
    Task<Candidate?> GetByIdAsync(Guid candidateId, CancellationToken ct = default);
    Task<List<Candidate>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(Candidate candidate, CancellationToken ct = default);
    Task UpdateAsync(Candidate candidate, CancellationToken ct = default);
}
