namespace Application.DTOs;

public record TestDto(
    Guid TestId,
    string Title,
    string? Description,
    int DurationMinutes,
    decimal PassingScorePercent,
    bool IsActive,
    DateTime CreatedAt
);

public record AssignmentDto(
    Guid AssignmentId,
    Guid TestId,
    string TestTitle,
    DateTime ScheduledStart,
    DateTime Deadline,
    string Status,
    int DurationMinutes,
    int QuestionCount,
    int MaxAttempts
);

public record AdminAssignmentDto(
    Guid AssignmentId,
    Guid TestId,
    string TestTitle,
    Guid QuestionBatchId,
    string QuestionBatchName,
    Guid? BatchId,
    string? BatchName,
    Guid? CandidateId,
    string? CandidateEmail,
    int QuestionCount,
    DateTime ScheduledStart,
    DateTime Deadline,
    string Status,
    int MaxAttempts,
    DateTime CreatedAt
);
