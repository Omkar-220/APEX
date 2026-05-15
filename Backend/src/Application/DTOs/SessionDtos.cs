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

public record CompletedSessionDto(
    Guid SessionId,
    Guid TestId,
    string TestTitle,
    Guid AssignmentId,
    string? BatchName,
    string CandidateEmail,
    string CandidateDisplayName,
    int Score,
    int TotalQuestions,
    decimal Percentage,
    bool Passed,
    int ViolationCount,
    DateTime StartTime,
    DateTime EndTime,
    int DurationSeconds
);

public record ScorecardAnswerDto(
    Guid QuestionId,
    string Content,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD,
    string CorrectOption,
    string? SelectedOption,
    bool IsCorrect,
    decimal Weightage
);

public record SessionScorecardDto(
    Guid SessionId,
    string CandidateEmail,
    string CandidateDisplayName,
    string TestTitle,
    string? BatchName,
    int Score,
    int TotalQuestions,
    decimal Percentage,
    bool Passed,
    decimal PassingScorePercent,
    int ViolationCount,
    DateTime StartTime,
    DateTime EndTime,
    int DurationSeconds,
    List<ScorecardAnswerDto> Answers,
    List<AuditEventDto> AuditEvents
);

public record AuditEventDto(
    string EventType,
    string? Payload,
    DateTime OccurredAt
);
