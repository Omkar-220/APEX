namespace Api.Models;

public record CreateQuestionRequest(
    string Content,
    string OptionA, string OptionB, string OptionC, string OptionD,
    char CorrectOption,
    decimal Weightage = 1);

public record CreateQuestionBatchRequest(
    string Name,
    string? Domain = null, string? Topic = null, string? Difficulty = null);

public record AddQuestionsToBatchRequest(List<Guid> QuestionIds);

public record CreateBatchRequest(
    string Name,
    string? Domain = null, string? Topic = null, string? Difficulty = null);

public record AddCandidatesToBatchRequest(List<Guid> CandidateIds);

public record CreateTestRequest(
    string Title,
    int DurationMinutes,
    decimal PassingScorePercent,
    string? Description = null);

public record CreateAssignmentRequest(
    Guid TestId,
    Guid QuestionBatchId,
    int QuestionCount,
    DateTime ScheduledStart,
    DateTime Deadline,
    int MaxAttempts = 1,
    Guid? BatchId = null,
    Guid? CandidateId = null);

public record UpdateRoleRequest(string Role);
