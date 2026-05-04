using Domain.Entities;
using Domain.Enums;

namespace Domain.Ports.Repositories;

public interface ITestRepository
{
    Task<Test?> GetByIdAsync(Guid testId, CancellationToken ct = default);
    Task<List<Test>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(Test test, CancellationToken ct = default);
}

public interface ITestAssignmentRepository
{
    Task<TestAssignment?> GetByIdAsync(Guid assignmentId, CancellationToken ct = default);

    /// <summary>Returns direct (non-batch) assignments for a candidate.</summary>
    Task<List<TestAssignment>> GetForCandidateAsync(Guid candidateId, CancellationToken ct = default);

    /// <summary>Returns batch assignments for the given batch IDs.</summary>
    Task<List<TestAssignment>> GetForBatchesAsync(IEnumerable<Guid> batchIds, CancellationToken ct = default);

    /// <summary>Returns all Active assignments past their deadline — used by AutoFinalizeService.</summary>
    Task<List<TestAssignment>> GetExpiredActiveAsync(DateTime utcNow, CancellationToken ct = default);

    Task AddAsync(TestAssignment assignment, CancellationToken ct = default);
    Task UpdateAsync(TestAssignment assignment, CancellationToken ct = default);
}
