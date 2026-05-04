using Domain.Enums;

namespace Domain.Entities;

public class Batch
{
    public Guid BatchId { get; private set; }
    public string Name { get; private set; }
    public string? Domain { get; private set; }
    public string? Topic { get; private set; }
    public Difficulty? Difficulty { get; private set; }
    public Guid CreatedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsActive { get; private set; }

    // Navigation properties
    public Candidate? CreatedByCandidate { get; private set; }
    public ICollection<BatchMember> Members { get; private set; } = new List<BatchMember>();
    public ICollection<TestAssignment> TestAssignments { get; private set; } = new List<TestAssignment>();

    private Batch() { Name = null!; }

    public static Batch Create(
        string name,
        Guid createdBy,
        string? domain = null,
        string? topic = null,
        Difficulty? difficulty = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Batch name cannot be empty.", nameof(name));
        if (createdBy == Guid.Empty)
            throw new ArgumentException("CreatedBy cannot be empty.", nameof(createdBy));

        return new Batch
        {
            BatchId = Guid.NewGuid(),
            Name = name.Trim(),
            Domain = domain?.Trim(),
            Topic = topic?.Trim(),
            Difficulty = difficulty,
            CreatedBy = createdBy,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
