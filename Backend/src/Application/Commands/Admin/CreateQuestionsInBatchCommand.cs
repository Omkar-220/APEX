using Application.DTOs;
using Domain.Entities;
using Domain.Ports.Repositories;

namespace Application.Commands.Admin;

public record QuestionInput(
    string Content,
    string OptionA, string OptionB, string OptionC, string OptionD,
    char CorrectOption,
    decimal Weightage = 1);

public record CreateQuestionsInBatchCommand(
    Guid QuestionBatchId,
    Guid CreatedBy,
    List<QuestionInput> Questions);

public class CreateQuestionsInBatchHandler
{
    private readonly IQuestionBatchRepository _batchRepo;
    private readonly IQuestionRepository _questionRepo;

    public CreateQuestionsInBatchHandler(
        IQuestionBatchRepository batchRepo,
        IQuestionRepository questionRepo)
    {
        _batchRepo = batchRepo;
        _questionRepo = questionRepo;
    }

    public async Task<List<Guid>> HandleAsync(
        CreateQuestionsInBatchCommand cmd, CancellationToken ct = default)
    {
        var batch = await _batchRepo.GetByIdAsync(cmd.QuestionBatchId, ct)
            ?? throw new KeyNotFoundException($"Question batch {cmd.QuestionBatchId} not found.");

        var questionIds = new List<Guid>();

        foreach (var input in cmd.Questions)
        {
            var question = Question.Create(
                input.Content,
                input.OptionA, input.OptionB, input.OptionC, input.OptionD,
                input.CorrectOption,
                cmd.CreatedBy,
                input.Weightage);

            await _questionRepo.AddAsync(question, ct);
            questionIds.Add(question.QuestionId);
        }

        // Assign all questions to the batch atomically
        await _batchRepo.AddMembersAsync(cmd.QuestionBatchId, questionIds, ct);

        return questionIds;
    }
}
