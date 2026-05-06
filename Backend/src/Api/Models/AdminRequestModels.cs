namespace Api.Models;

public record CreateQuestionRequest(
    string Content,
    string OptionA, string OptionB, string OptionC, string OptionD,
    char CorrectOption,
    decimal Weightage = 1);

/// <summary>
/// Creates multiple questions and assigns them to a batch atomically.
/// Mirrors the frontend QuestionEditor save flow.
/// </summary>
public record CreateQuestionsInBatchRequest(List<CreateQuestionRequest> Questions);

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
    string ScheduledStart,
    string Deadline,
    int MaxAttempts = 1,
    string? BatchId = null,
    string? CandidateId = null);

public record UpdateRoleRequest(string Role);
