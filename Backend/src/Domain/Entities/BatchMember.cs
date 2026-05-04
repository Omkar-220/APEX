namespace Domain.Entities;

public class BatchMember
{
    public Guid BatchId { get; private set; }
    public Guid CandidateId { get; private set; }
    public DateTime AddedAt { get; private set; }

    // Navigation properties
    public Batch Batch { get; private set; } = null!;
    public Candidate Candidate { get; private set; } = null!;

    private BatchMember() { }

    public static BatchMember Create(Guid batchId, Guid candidateId)
    {
        if (batchId == Guid.Empty) throw new ArgumentException("BatchId cannot be empty.", nameof(batchId));
        if (candidateId == Guid.Empty) throw new ArgumentException("CandidateId cannot be empty.", nameof(candidateId));

        return new BatchMember
        {
            BatchId = batchId,
            CandidateId = candidateId,
            AddedAt = DateTime.UtcNow
        };
    }
}
