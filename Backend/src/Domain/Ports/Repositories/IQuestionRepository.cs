using Domain.Entities;

namespace Domain.Ports.Repositories;

public interface IQuestionRepository
{
    Task<Question?> GetByIdAsync(Guid questionId, CancellationToken ct = default);
    Task<List<Question>> GetByIdsAsync(IEnumerable<Guid> questionIds, CancellationToken ct = default);
    Task AddAsync(Question question, CancellationToken ct = default);
    Task UpdateAsync(Question question, CancellationToken ct = default);
}

public interface IQuestionBatchRepository
{
    Task<QuestionBatch?> GetByIdAsync(Guid questionBatchId, CancellationToken ct = default);
    Task<List<QuestionBatch>> GetAllAsync(CancellationToken ct = default);
    Task<List<Guid>> GetQuestionIdsAsync(Guid questionBatchId, CancellationToken ct = default);
    Task AddAsync(QuestionBatch batch, CancellationToken ct = default);
    Task AddMembersAsync(Guid questionBatchId, IEnumerable<Guid> questionIds, CancellationToken ct = default);
    Task UpdateAsync(QuestionBatch batch, CancellationToken ct = default);
}
