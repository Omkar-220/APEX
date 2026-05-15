using Domain.Entities;
using Domain.Ports.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class BatchRepository : IBatchRepository
{
    private readonly AppDbContext _context;
    public BatchRepository(AppDbContext context) => _context = context;

    public Task<Batch?> GetByIdAsync(Guid batchId, CancellationToken ct = default) =>
        _context.Batches.Include(b => b.Members).FirstOrDefaultAsync(b => b.BatchId == batchId, ct);

    public Task<List<Batch>> GetAllAsync(CancellationToken ct = default) =>
        _context.Batches.Include(b => b.Members).OrderBy(b => b.Name).ToListAsync(ct);

    public async Task<List<Guid>> GetBatchIdsForCandidateAsync(Guid candidateId, CancellationToken ct = default) =>
        await _context.BatchMembers
            .Where(bm => bm.CandidateId == candidateId)
            .Select(bm => bm.BatchId)
            .ToListAsync(ct);

    public async Task AddAsync(Batch batch, CancellationToken ct = default)
    {
        await _context.Batches.AddAsync(batch, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Batch batch, CancellationToken ct = default)
    {
        _context.Batches.Update(batch);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AddMembersAsync(Guid batchId, IEnumerable<Guid> candidateIds, CancellationToken ct = default)
    {
        var existing = await _context.BatchMembers
            .Where(bm => bm.BatchId == batchId)
            .Select(bm => bm.CandidateId)
            .ToListAsync(ct);

        var toAdd = candidateIds
            .Distinct()
            .Where(id => !existing.Contains(id))
            .Select(id => BatchMember.Create(batchId, id));

        await _context.BatchMembers.AddRangeAsync(toAdd, ct);
        await _context.SaveChangesAsync(ct);
    }
}
