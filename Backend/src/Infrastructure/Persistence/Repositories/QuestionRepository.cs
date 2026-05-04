using Domain.Entities;
using Domain.Ports.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class QuestionRepository : IQuestionRepository
{
    private readonly AppDbContext _context;
    public QuestionRepository(AppDbContext context) => _context = context;

    public Task<Question?> GetByIdAsync(Guid questionId, CancellationToken ct = default) =>
        _context.Questions.FindAsync([questionId], ct).AsTask();

    public Task<List<Question>> GetByIdsAsync(IEnumerable<Guid> questionIds, CancellationToken ct = default) =>
        _context.Questions.Where(q => questionIds.Contains(q.QuestionId)).ToListAsync(ct);

    public async Task AddAsync(Question question, CancellationToken ct = default)
    {
        await _context.Questions.AddAsync(question, ct);
        await _context.SaveChangesAsync(ct);
    }
}

public class QuestionBatchRepository : IQuestionBatchRepository
{
    private readonly AppDbContext _context;
    public QuestionBatchRepository(AppDbContext context) => _context = context;

    public Task<QuestionBatch?> GetByIdAsync(Guid questionBatchId, CancellationToken ct = default) =>
        _context.QuestionBatches
            .Include(qb => qb.QuestionBatchMembers)
            .FirstOrDefaultAsync(qb => qb.QuestionBatchId == questionBatchId, ct);

    public Task<List<QuestionBatch>> GetAllAsync(CancellationToken ct = default) =>
        _context.QuestionBatches.OrderBy(qb => qb.Name).ToListAsync(ct);

    public async Task<List<Guid>> GetQuestionIdsAsync(Guid questionBatchId, CancellationToken ct = default) =>
        await _context.QuestionBatchMembers
            .Where(qbm => qbm.QuestionBatchId == questionBatchId)
            .Select(qbm => qbm.QuestionId)
            .ToListAsync(ct);

    public async Task AddAsync(QuestionBatch batch, CancellationToken ct = default)
    {
        await _context.QuestionBatches.AddAsync(batch, ct);
        await _context.SaveChangesAsync(ct);
    }

    public async Task AddMembersAsync(Guid questionBatchId, IEnumerable<Guid> questionIds, CancellationToken ct = default)
    {
        var existing = await _context.QuestionBatchMembers
            .Where(qbm => qbm.QuestionBatchId == questionBatchId)
            .Select(qbm => qbm.QuestionId)
            .ToListAsync(ct);

        var toAdd = questionIds
            .Distinct()
            .Where(id => !existing.Contains(id))
            .Select(id => QuestionBatchMember.Create(questionBatchId, id));

        await _context.QuestionBatchMembers.AddRangeAsync(toAdd, ct);
        await _context.SaveChangesAsync(ct);
    }
}
