namespace Application.DTOs;

public record InitializeExamDto(
    Guid SessionId,
    Guid FirstQuestionId,
    int TimeRemainingSec,
    int TotalQuestions
);

public record QuestionDisplayDto(
    Guid Id,
    string Content,
    Dictionary<string, string> Options, // display key -> option text
    int Position,
    int TotalQuestions
);

public record TestStatusDto(
    Guid SessionId,
    int TimeRemainingSec,
    string Status,
    Guid? CurrentQuestionId,
    int AnsweredCount,
    int TotalQuestions,
    int ViolationCount
);

public record FinalizeResultDto(
    bool Ok,
    int Score,
    int TotalQuestions,
    bool Passed,
    decimal Percentage
);

public record TestResultDto(
    int Score,
    int TotalQuestions,
    bool Passed,
    decimal Percentage,
    DateTime CompletedAt
);

public record AdminSessionDto(
    Guid SessionId,
    string CandidateEmail,
    string Status,
    int? Score,
    DateTime StartTime
);
