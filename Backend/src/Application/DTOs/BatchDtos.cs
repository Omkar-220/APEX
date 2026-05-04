namespace Application.DTOs;

public record QuestionDto(
    Guid QuestionId,
    string Content,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD,
    char CorrectOption,
    decimal Weightage,
    Guid CreatedBy,
    DateTime CreatedAt
);

public record QuestionBatchDto(
    Guid QuestionBatchId,
    string Name,
    string? Domain,
    string? Topic,
    string? Difficulty,
    int QuestionCount,
    bool IsActive,
    DateTime CreatedAt
);

public record CandidateBatchDto(
    Guid BatchId,
    string Name,
    string? Domain,
    string? Topic,
    string? Difficulty,
    int CandidateCount,
    bool IsActive,
    DateTime CreatedAt
);
