namespace Api.Models;

public record InitializeExamRequest(Guid AssignmentId);

public record SubmitAnswerRequest(Guid QuestionId, string SelectedOption);

public record AuditEventRequest(string Type, string? Payload);
