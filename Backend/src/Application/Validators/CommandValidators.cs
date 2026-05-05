using Application.Commands;
using Application.Commands.Admin;
using FluentValidation;

namespace Application.Validators;

public class ProvisionCandidateValidator : AbstractValidator<ProvisionCandidateCommand>
{
    public ProvisionCandidateValidator()
    {
        RuleFor(x => x.Oid).NotEmpty().MaximumLength(128);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(255);
    }
}

public class UpdateCandidateRoleValidator : AbstractValidator<UpdateCandidateRoleCommand>
{
    private static readonly string[] ValidRoles = ["Candidate", "Admin", "SuperAdmin"];

    public UpdateCandidateRoleValidator()
    {
        RuleFor(x => x.CandidateId).NotEmpty();
        RuleFor(x => x.Role).NotEmpty().Must(r => ValidRoles.Contains(r))
            .WithMessage("Role must be Candidate, Admin, or SuperAdmin.");
    }
}

public class CreateQuestionValidator : AbstractValidator<CreateQuestionCommand>
{
    public CreateQuestionValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.OptionA).NotEmpty().MaximumLength(500);
        RuleFor(x => x.OptionB).NotEmpty().MaximumLength(500);
        RuleFor(x => x.OptionC).NotEmpty().MaximumLength(500);
        RuleFor(x => x.OptionD).NotEmpty().MaximumLength(500);
        RuleFor(x => x.CorrectOption).Must(c => "ABCD".Contains(char.ToUpperInvariant(c)))
            .WithMessage("CorrectOption must be A, B, C, or D.");
        RuleFor(x => x.CreatedBy).NotEmpty();
        RuleFor(x => x.Weightage).GreaterThan(0);
    }
}

public class CreateQuestionBatchValidator : AbstractValidator<CreateQuestionBatchCommand>
{
    private static readonly string[] ValidDifficulties = ["Beginner", "Intermediate", "Advanced"];

    public CreateQuestionBatchValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.CreatedBy).NotEmpty();
        RuleFor(x => x.Domain).MaximumLength(100).When(x => x.Domain != null);
        RuleFor(x => x.Topic).MaximumLength(100).When(x => x.Topic != null);
        RuleFor(x => x.Difficulty).Must(d => d == null || ValidDifficulties.Contains(d))
            .WithMessage("Difficulty must be Beginner, Intermediate, or Advanced.");
    }
}

public class AddQuestionsToBatchValidator : AbstractValidator<AddQuestionsToBatchCommand>
{
    public AddQuestionsToBatchValidator()
    {
        RuleFor(x => x.QuestionBatchId).NotEmpty();
        RuleFor(x => x.QuestionIds).NotEmpty().Must(ids => ids.All(id => id != Guid.Empty))
            .WithMessage("All question IDs must be valid GUIDs.");
    }
}

public class CreateBatchValidator : AbstractValidator<CreateBatchCommand>
{
    private static readonly string[] ValidDifficulties = ["Beginner", "Intermediate", "Advanced"];

    public CreateBatchValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.CreatedBy).NotEmpty();
        RuleFor(x => x.Domain).MaximumLength(100).When(x => x.Domain != null);
        RuleFor(x => x.Topic).MaximumLength(100).When(x => x.Topic != null);
        RuleFor(x => x.Difficulty).Must(d => d == null || ValidDifficulties.Contains(d))
            .WithMessage("Difficulty must be Beginner, Intermediate, or Advanced.");
    }
}

public class AddCandidatesToBatchValidator : AbstractValidator<AddCandidatesToBatchCommand>
{
    public AddCandidatesToBatchValidator()
    {
        RuleFor(x => x.BatchId).NotEmpty();
        RuleFor(x => x.CandidateIds).NotEmpty().Must(ids => ids.All(id => id != Guid.Empty))
            .WithMessage("All candidate IDs must be valid GUIDs.");
    }
}

public class CreateTestValidator : AbstractValidator<CreateTestCommand>
{
    public CreateTestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(255);
        RuleFor(x => x.DurationMinutes).GreaterThan(0);
        RuleFor(x => x.PassingScorePercent).InclusiveBetween(0, 100);
        RuleFor(x => x.Description).MaximumLength(500).When(x => x.Description != null);
    }
}

public class CreateAssignmentValidator : AbstractValidator<CreateAssignmentCommand>
{
    public CreateAssignmentValidator()
    {
        RuleFor(x => x.TestId).NotEmpty();
        RuleFor(x => x.QuestionBatchId).NotEmpty();
        RuleFor(x => x.QuestionCount).GreaterThan(0);
        RuleFor(x => x.ScheduledStart).NotEmpty();
        RuleFor(x => x.Deadline).GreaterThan(x => x.ScheduledStart)
            .WithMessage("Deadline must be after ScheduledStart.");
        RuleFor(x => x.MaxAttempts).GreaterThan(0);
        RuleFor(x => x).Must(x => x.BatchId.HasValue ^ x.CandidateId.HasValue)
            .WithMessage("Exactly one of BatchId or CandidateId must be provided.");
    }
}

public class InitializeExamValidator : AbstractValidator<InitializeExamCommand>
{
    public InitializeExamValidator()
    {
        RuleFor(x => x.CandidateId).NotEmpty();
        RuleFor(x => x.TestId).NotEmpty();
        RuleFor(x => x.AssignmentId).NotEmpty();
        RuleFor(x => x.CandidateOid).NotEmpty();
    }
}

public class SubmitAnswerValidator : AbstractValidator<SubmitAnswerCommand>
{
    public SubmitAnswerValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.CandidateId).NotEmpty();
        RuleFor(x => x.QuestionId).NotEmpty();
        RuleFor(x => x.SelectedOption).Must(c => "ABCD".Contains(char.ToUpperInvariant(c)))
            .WithMessage("SelectedOption must be A, B, C, or D.");
        RuleFor(x => x.IdempotencyKey).NotEmpty();
    }
}

public class FinalizeTestValidator : AbstractValidator<FinalizeTestCommand>
{
    public FinalizeTestValidator()
    {
        RuleFor(x => x.SessionId).NotEmpty();
        RuleFor(x => x.CandidateId).NotEmpty();
    }
}
