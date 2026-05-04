using Domain.Entities;

namespace Domain.Ports.Repositories;

public interface IBatchRepository
{
    Task<Batch?> GetByIdAsync(Guid batchId, CancellationToken ct = default);
    Task<List<Batch>> GetAllAsync(CancellationToken ct = default);
    Task<List<Guid>> GetBatchIdsForCandidateAsync(Guid candidateId, CancellationToken ct = default);
    Task AddAsync(Batch batch, CancellationToken ct = default);
    Task AddMembersAsync(Guid batchId, IEnumerable<Guid> candidateIds, CancellationToken ct = default);
}
