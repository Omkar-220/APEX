using Application.Commands;
using Application.Commands.Admin;
using Application.Validators;
using FluentAssertions;
using FluentValidation;

namespace Application.Tests.Validators;

public class ProvisionCandidateValidatorTests
{
    private readonly ProvisionCandidateValidator _sut = new();

    [Fact]
    public void ValidInput_Passes()
    {
        var cmd = new ProvisionCandidateCommand("valid-oid", "user@test.com", "Test User");
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("", "user@test.com", "Name")]
    [InlineData("oid", "", "Name")]
    [InlineData("oid", "user@test.com", "")]
    public void EmptyRequiredField_Fails(string oid, string email, string name)
    {
        var cmd = new ProvisionCandidateCommand(oid, email, name);
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void InvalidEmail_Fails()
    {
        var cmd = new ProvisionCandidateCommand("oid", "not-an-email", "Name");
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void OidTooLong_Fails()
    {
        var cmd = new ProvisionCandidateCommand(new string('a', 129), "user@test.com", "Name");
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class UpdateCandidateRoleValidatorTests
{
    private readonly UpdateCandidateRoleValidator _sut = new();

    [Theory]
    [InlineData("Candidate")]
    [InlineData("Admin")]
    [InlineData("SuperAdmin")]
    public void ValidRole_Passes(string role)
    {
        var cmd = new UpdateCandidateRoleCommand(Guid.NewGuid(), role);
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Fact]
    public void InvalidRole_Fails()
    {
        var cmd = new UpdateCandidateRoleCommand(Guid.NewGuid(), "God");
        var result = _sut.Validate(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Candidate, Admin, or SuperAdmin"));
    }

    [Fact]
    public void EmptyCandidateId_Fails()
    {
        var cmd = new UpdateCandidateRoleCommand(Guid.Empty, "Admin");
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class CreateQuestionValidatorTests
{
    private readonly CreateQuestionValidator _sut = new();

    private static CreateQuestionCommand Valid() => new(
        "What is 2+2?", "1", "2", "3", "4", 'D', Guid.NewGuid());

    [Fact]
    public void ValidInput_Passes() => _sut.Validate(Valid()).IsValid.Should().BeTrue();

    [Fact]
    public void EmptyContent_Fails()
    {
        var cmd = Valid() with { Content = "" };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData('E')]
    [InlineData('Z')]
    [InlineData('1')]
    public void InvalidCorrectOption_Fails(char option)
    {
        var cmd = Valid() with { CorrectOption = option };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData('A')]
    [InlineData('B')]
    [InlineData('C')]
    [InlineData('D')]
    public void ValidCorrectOption_Passes(char option)
    {
        var cmd = Valid() with { CorrectOption = option };
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Fact]
    public void ZeroWeightage_Fails()
    {
        var cmd = Valid() with { Weightage = 0 };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void EmptyCreatedBy_Fails()
    {
        var cmd = Valid() with { CreatedBy = Guid.Empty };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class CreateQuestionBatchValidatorTests
{
    private readonly CreateQuestionBatchValidator _sut = new();

    private static CreateQuestionBatchCommand Valid() =>
        new("Batch Name", Guid.NewGuid(), "Frontend", "React", "Intermediate");

    [Fact]
    public void ValidInput_Passes() => _sut.Validate(Valid()).IsValid.Should().BeTrue();

    [Fact]
    public void NullOptionalFields_Passes()
    {
        var cmd = new CreateQuestionBatchCommand("Name", Guid.NewGuid());
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Fact]
    public void InvalidDifficulty_Fails()
    {
        var cmd = Valid() with { Difficulty = "VeryHard" };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("Beginner")]
    [InlineData("Intermediate")]
    [InlineData("Advanced")]
    public void ValidDifficulty_Passes(string difficulty)
    {
        var cmd = Valid() with { Difficulty = difficulty };
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }
}

public class AddQuestionsToBatchValidatorTests
{
    private readonly AddQuestionsToBatchValidator _sut = new();

    [Fact]
    public void ValidInput_Passes()
    {
        var cmd = new AddQuestionsToBatchCommand(Guid.NewGuid(), [Guid.NewGuid(), Guid.NewGuid()]);
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyQuestionIds_Fails()
    {
        var cmd = new AddQuestionsToBatchCommand(Guid.NewGuid(), []);
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void QuestionIdsContainsEmptyGuid_Fails()
    {
        var cmd = new AddQuestionsToBatchCommand(Guid.NewGuid(), [Guid.NewGuid(), Guid.Empty]);
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class CreateBatchValidatorTests
{
    private readonly CreateBatchValidator _sut = new();

    [Fact]
    public void ValidInput_Passes()
    {
        var cmd = new CreateBatchCommand("Batch", Guid.NewGuid(), "Domain", "Topic", "Advanced");
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyName_Fails()
    {
        var cmd = new CreateBatchCommand("", Guid.NewGuid());
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void InvalidDifficulty_Fails()
    {
        var cmd = new CreateBatchCommand("Name", Guid.NewGuid(), Difficulty: "Easy");
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class AddCandidatesToBatchValidatorTests
{
    private readonly AddCandidatesToBatchValidator _sut = new();

    [Fact]
    public void ValidInput_Passes()
    {
        var cmd = new AddCandidatesToBatchCommand(Guid.NewGuid(), [Guid.NewGuid()]);
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptyCandidateIds_Fails()
    {
        var cmd = new AddCandidatesToBatchCommand(Guid.NewGuid(), []);
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void EmptyGuidInList_Fails()
    {
        var cmd = new AddCandidatesToBatchCommand(Guid.NewGuid(), [Guid.Empty]);
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class CreateTestValidatorTests
{
    private readonly CreateTestValidator _sut = new();

    private static CreateTestCommand Valid() =>
        new("Test Title", 60, 70m, "Description");

    [Fact]
    public void ValidInput_Passes() => _sut.Validate(Valid()).IsValid.Should().BeTrue();

    [Fact]
    public void EmptyTitle_Fails()
    {
        var cmd = Valid() with { Title = "" };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void ZeroDuration_Fails()
    {
        var cmd = Valid() with { DurationMinutes = 0 };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    public void PassingScoreOutOfRange_Fails(decimal score)
    {
        var cmd = Valid() with { PassingScorePercent = score };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(50)]
    [InlineData(100)]
    public void PassingScoreInRange_Passes(decimal score)
    {
        var cmd = Valid() with { PassingScorePercent = score };
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }
}

public class CreateAssignmentValidatorTests
{
    private readonly CreateAssignmentValidator _sut = new();

    private static CreateAssignmentCommand ValidBatch() => new(
        Guid.NewGuid(), Guid.NewGuid(), 40,
        DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(3),
        MaxAttempts: 1, BatchId: Guid.NewGuid(), CandidateId: null);

    private static CreateAssignmentCommand ValidCandidate() => new(
        Guid.NewGuid(), Guid.NewGuid(), 40,
        DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(3),
        MaxAttempts: 1, BatchId: null, CandidateId: Guid.NewGuid());

    [Fact]
    public void ValidBatchAssignment_Passes() => _sut.Validate(ValidBatch()).IsValid.Should().BeTrue();

    [Fact]
    public void ValidCandidateAssignment_Passes() => _sut.Validate(ValidCandidate()).IsValid.Should().BeTrue();

    [Fact]
    public void BothBatchAndCandidateProvided_Fails()
    {
        var cmd = ValidBatch() with { CandidateId = Guid.NewGuid() };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void NeitherBatchNorCandidateProvided_Fails()
    {
        var cmd = ValidBatch() with { BatchId = null, CandidateId = null };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void DeadlineBeforeStart_Fails()
    {
        var cmd = ValidBatch() with
        {
            ScheduledStart = DateTime.UtcNow.AddHours(3),
            Deadline = DateTime.UtcNow.AddHours(1)
        };
        var result = _sut.Validate(cmd);
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("Deadline"));
    }

    [Fact]
    public void ZeroQuestionCount_Fails()
    {
        var cmd = ValidBatch() with { QuestionCount = 0 };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void ZeroMaxAttempts_Fails()
    {
        var cmd = ValidBatch() with { MaxAttempts = 0 };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class SubmitAnswerValidatorTests
{
    private readonly SubmitAnswerValidator _sut = new();

    private static SubmitAnswerCommand Valid() => new(
        Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 'A', Guid.NewGuid());

    [Fact]
    public void ValidInput_Passes() => _sut.Validate(Valid()).IsValid.Should().BeTrue();

    [Theory]
    [InlineData('A')]
    [InlineData('B')]
    [InlineData('C')]
    [InlineData('D')]
    public void ValidOption_Passes(char option)
    {
        var cmd = Valid() with { SelectedOption = option };
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData('E')]
    [InlineData('Z')]
    [InlineData('1')]
    public void InvalidOption_Fails(char option)
    {
        var cmd = Valid() with { SelectedOption = option };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void EmptySessionId_Fails()
    {
        var cmd = Valid() with { SessionId = Guid.Empty };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void EmptyIdempotencyKey_Fails()
    {
        var cmd = Valid() with { IdempotencyKey = Guid.Empty };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class InitializeExamValidatorTests
{
    private readonly InitializeExamValidator _sut = new();

    private static InitializeExamCommand Valid() => new(
        Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "valid-oid");

    [Fact]
    public void ValidInput_Passes() => _sut.Validate(Valid()).IsValid.Should().BeTrue();

    [Fact]
    public void EmptyCandidateId_Fails()
    {
        var cmd = Valid() with { CandidateId = Guid.Empty };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void EmptyOid_Fails()
    {
        var cmd = Valid() with { CandidateOid = "" };
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}

public class FinalizeTestValidatorTests
{
    private readonly FinalizeTestValidator _sut = new();

    [Fact]
    public void ValidInput_Passes()
    {
        var cmd = new FinalizeTestCommand(Guid.NewGuid(), Guid.NewGuid(), "candidate");
        _sut.Validate(cmd).IsValid.Should().BeTrue();
    }

    [Fact]
    public void EmptySessionId_Fails()
    {
        var cmd = new FinalizeTestCommand(Guid.Empty, Guid.NewGuid(), "candidate");
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void EmptyCandidateId_Fails()
    {
        var cmd = new FinalizeTestCommand(Guid.NewGuid(), Guid.Empty, "candidate");
        _sut.Validate(cmd).IsValid.Should().BeFalse();
    }
}
