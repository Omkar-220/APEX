using Domain.Entities;
using Domain.Ports.Repositories;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class CandidateRepository : ICandidateRepository
{
    private readonly AppDbContext _context;
    public CandidateRepository(AppDbContext context) => _context = context;

    public Task<Candidate?> GetByOidAsync(string azureAdOid, CancellationToken ct = default) =>
        _context.Candidates.FirstOrDefaultAsync(c => c.AzureAdOid == azureAdOid, ct);

    public Task<Candidate?> GetByIdAsync(Guid candidateId, CancellationToken ct = default) =>
        _context.Candidates.FindAsync([candidateId], ct).AsTask();

    public Task<List<Candidate>> GetAllAsync(CancellationToken ct = default) =>
        _context.Candidates.OrderBy(c => c.DisplayName).ToListAsync(ct);

    public async Task AddAsync(Candidate candidate, CancellationToken ct = default)
    {
        await _context.Candidates.AddAsync(candidate, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task<Candidate> AddOrGetExistingAsync(Candidate candidate, CancellationToken ct = default)
    {
        try
        {
            await _context.Candidates.AddAsync(candidate, ct);
            await _context.SaveChangesAsync(ct);
            return candidate;
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx
            && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
        {
            _context.ChangeTracker.Clear();
            return (await GetByOidAsync(candidate.AzureAdOid.Value, ct))!;
        }
    }

    public async Task UpdateAsync(Candidate candidate, CancellationToken ct = default)
    {
        _context.Candidates.Update(candidate);
        await _context.SaveChangesAsync(ct);
    }
}
