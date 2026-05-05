namespace Api.Models;

public record InitializeExamRequest(Guid AssignmentId);

public record SubmitAnswerRequest(Guid QuestionId, char SelectedOption);

public record AuditEventRequest(string Type, string? Payload);
