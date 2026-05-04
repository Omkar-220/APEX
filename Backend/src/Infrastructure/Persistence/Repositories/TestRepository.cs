using Domain.Entities;
using Domain.Enums;
using Domain.Ports.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class TestRepository : ITestRepository
{
    private readonly AppDbContext _context;
    public TestRepository(AppDbContext context) => _context = context;

    public Task<Test?> GetByIdAsync(Guid testId, CancellationToken ct = default) =>
        _context.Tests.FindAsync([testId], ct).AsTask();

    public Task<List<Test>> GetAllAsync(CancellationToken ct = default) =>
        _context.Tests.OrderBy(t => t.Title).ToListAsync(ct);

    public async Task AddAsync(Test test, CancellationToken ct = default)
    {
        await _context.Tests.AddAsync(test, ct);
        await _context.SaveChangesAsync(ct);
    }
}

public class TestAssignmentRepository : ITestAssignmentRepository
{
    private readonly AppDbContext _context;
    public TestAssignmentRepository(AppDbContext context) => _context = context;

    public Task<TestAssignment?> GetByIdAsync(Guid assignmentId, CancellationToken ct = default) =>
        _context.TestAssignments
            .Include(a => a.Test)
            .FirstOrDefaultAsync(a => a.AssignmentId == assignmentId, ct);

    public Task<List<TestAssignment>> GetForCandidateAsync(Guid candidateId, CancellationToken ct = default) =>
        _context.TestAssignments
            .Include(a => a.Test)
            .Where(a => a.CandidateId == candidateId &&
                        a.Status != AssignmentStatus.Expired)
            .ToListAsync(ct);

    public Task<List<TestAssignment>> GetForBatchesAsync(IEnumerable<Guid> batchIds, CancellationToken ct = default) =>
        _context.TestAssignments
            .Include(a => a.Test)
            .Where(a => a.BatchId != null &&
                        batchIds.Contains(a.BatchId.Value) &&
                        a.Status != AssignmentStatus.Expired)
            .ToListAsync(ct);

    public Task<List<TestAssignment>> GetExpiredActiveAsync(DateTime utcNow, CancellationToken ct = default) =>
        _context.TestAssignments
            .Where(a => a.Status == AssignmentStatus.Active && a.Deadline < utcNow)
            .ToListAsync(ct);

    public async Task AddAsync(TestAssignment assignment, CancellationToken ct = default)
    {
        await _context.TestAssignments.AddAsync(assignment, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(TestAssignment assignment, CancellationToken ct = default)
    {
        _context.TestAssignments.Update(assignment);
        await _context.SaveChangesAsync(ct);
    }
}
