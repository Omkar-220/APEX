namespace Domain.Entities;

public class Test
{
    public Guid TestId { get; private set; }
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public int DurationMinutes { get; private set; }
    public decimal PassingScorePercent { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation properties
    public ICollection<TestAssignment> TestAssignments { get; private set; } = new List<TestAssignment>();
    public ICollection<TestSession> TestSessions { get; private set; } = new List<TestSession>();

    private Test() { Title = null!; }

    public static Test Create(string title, int durationMinutes, decimal passingScorePercent, string? description = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty.", nameof(title));
        if (durationMinutes <= 0)
            throw new ArgumentException("Duration must be positive.", nameof(durationMinutes));
        if (passingScorePercent < 0 || passingScorePercent > 100)
            throw new ArgumentException("Passing score must be between 0 and 100.", nameof(passingScorePercent));

        return new Test
        {
            TestId = Guid.NewGuid(),
            Title = title.Trim(),
            Description = description?.Trim(),
            DurationMinutes = durationMinutes,
            PassingScorePercent = passingScorePercent,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
