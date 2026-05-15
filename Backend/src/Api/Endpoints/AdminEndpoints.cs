using Api.Middleware;
using Api.Models;
using Application.Commands;
using Application.Commands.Admin;
using Application.Queries;
using Application.Queries.Admin;
using Application.Services;
using Domain.Ports.Repositories;
using System.Security.Claims;

namespace Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin").WithTags("Admin");

        // ── Users ─────────────────────────────────────────────────────────────

        // GET /api/admin/completed-sessions
        group.MapGet("/completed-sessions", async (
            HttpContext ctx,
            GetMeHandler meHandler,
            GetCompletedSessionsHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var result = await handler.HandleAsync(ct);
            return Results.Ok(result);
        });

        // GET /api/admin/sessions/{sessionId}/scorecard
        group.MapGet("/sessions/{sessionId:guid}/scorecard", async (
            Guid sessionId,
            HttpContext ctx,
            GetMeHandler meHandler,
            GetScorecardHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var result = await handler.HandleAsync(new GetScorecardQuery(sessionId), ct);
            return Results.Ok(result);
        });

        // GET /api/admin/users
        group.MapGet("/users", async (
            HttpContext ctx,
            GetMeHandler meHandler,
            GetAdminUsersHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var result = await handler.HandleAsync(ct);
            return Results.Ok(result);
        });

        // GET /api/admin/question-batches
        group.MapGet("/question-batches", async (
            HttpContext ctx,
            GetMeHandler meHandler,
            GetQuestionBatchesHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var result = await handler.HandleAsync(ct);
            return Results.Ok(result);
        });

        // GET /api/admin/tests
        group.MapGet("/tests", async (
            HttpContext ctx,
            GetMeHandler meHandler,
            GetTestsHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var result = await handler.HandleAsync(ct);
            return Results.Ok(result);
        });

        // GET /api/admin/assignments
        group.MapGet("/assignments", async (
            HttpContext ctx,
            GetMeHandler meHandler,
            GetAssignmentsHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var result = await handler.HandleAsync(ct);
            return Results.Ok(result);
        });

        // GET /api/admin/batches
        group.MapGet("/batches", async (
            HttpContext ctx,
            GetMeHandler meHandler,
            GetBatchesHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var result = await handler.HandleAsync(ct);
            return Results.Ok(result);
        });

        // PUT /api/admin/users/{candidateId}/role
        group.MapPut("/users/{candidateId:guid}/role", async (
            Guid candidateId,
            UpdateRoleRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            UpdateCandidateRoleHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            await handler.HandleAsync(new UpdateCandidateRoleCommand(candidateId, body.Role), ct);
            return Results.Ok(new { ok = true });
        });

        // ── Questions ─────────────────────────────────────────────────────────

        // POST /api/admin/questions
        group.MapPost("/questions", async (
            CreateQuestionRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            CreateQuestionHandler handler,
            CancellationToken ct) =>
        {
            var me = await GetCurrentAdmin(ctx, meHandler, ct);
            var questionId = await handler.HandleAsync(new CreateQuestionCommand(
                body.Content, body.OptionA, body.OptionB, body.OptionC, body.OptionD,
                body.CorrectOption, me.CandidateId, body.Weightage), ct);
            return Results.Ok(new { questionId });
        });

        // ── Question Batches ──────────────────────────────────────────────────

        // PUT /api/admin/questions/{id}
        group.MapPut("/questions/{id:guid}", async (
            Guid id,
            UpdateQuestionRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            IQuestionRepository qRepo,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var question = await qRepo.GetByIdAsync(id, ct)
                ?? throw new KeyNotFoundException($"Question {id} not found.");
            question.Update(body.Content, body.OptionA, body.OptionB, body.OptionC, body.OptionD,
                body.CorrectOption, body.Weightage);
            await qRepo.UpdateAsync(question, ct);
            return Results.Ok(new { ok = true });
        });

        // GET /api/admin/question-batches/{id}/questions
        group.MapGet("/question-batches/{id:guid}/questions", async (
            Guid id,
            HttpContext ctx,
            GetMeHandler meHandler,
            IQuestionBatchRepository qbRepo,
            IQuestionRepository qRepo,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var questionIds = await qbRepo.GetQuestionIdsAsync(id, ct);
            if (questionIds.Count == 0) return Results.Ok(Array.Empty<object>());
            var questions = await qRepo.GetByIdsAsync(questionIds, ct);
            var result = questions.Select(q => new
            {
                questionId    = q.QuestionId,
                content       = q.Content,
                optionA       = q.OptionA,
                optionB       = q.OptionB,
                optionC       = q.OptionC,
                optionD       = q.OptionD,
                correctOption = q.CorrectOption.ToString(),
                weightage     = q.Weightage,
            });
            return Results.Ok(result);
        });

        // POST /api/admin/question-batches
        group.MapPost("/question-batches", async (
            CreateQuestionBatchRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            CreateQuestionBatchHandler handler,
            CancellationToken ct) =>
        {
            var me = await GetCurrentAdmin(ctx, meHandler, ct);
            var id = await handler.HandleAsync(new CreateQuestionBatchCommand(
                body.Name, me.CandidateId, body.Domain, body.Topic, body.Difficulty), ct);
            return Results.Ok(new { questionBatchId = id });
        });

        // POST /api/admin/question-batches/{id}/questions  ← bulk create + assign atomically
        group.MapPost("/question-batches/{id:guid}/questions", async (
            Guid id,
            CreateQuestionsInBatchRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            CreateQuestionsInBatchHandler handler,
            CancellationToken ct) =>
        {
            var me = await GetCurrentAdmin(ctx, meHandler, ct);
            var questionIds = await handler.HandleAsync(
                new CreateQuestionsInBatchCommand(id, me.CandidateId,
                    body.Questions.Select(q => new QuestionInput(
                        q.Content, q.OptionA, q.OptionB, q.OptionC, q.OptionD,
                        q.CorrectOption, q.Weightage)).ToList()), ct);
            return Results.Ok(new { added = questionIds.Count, questionIds });
        });

        // POST /api/admin/question-batches/{id}/members
        group.MapPost("/question-batches/{id:guid}/members", async (
            Guid id,
            AddQuestionsToBatchRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            AddQuestionsToBatchHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var added = await handler.HandleAsync(
                new AddQuestionsToBatchCommand(id, body.QuestionIds), ct);
            return Results.Ok(new { ok = true, added });
        });

        // ── Candidate Batches ─────────────────────────────────────────────────

        // POST /api/admin/batches
        group.MapPost("/batches", async (
            CreateBatchRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            CreateBatchHandler handler,
            CancellationToken ct) =>
        {
            var me = await GetCurrentAdmin(ctx, meHandler, ct);
            var batchId = await handler.HandleAsync(new CreateBatchCommand(
                body.Name, me.CandidateId, body.Domain, body.Topic, body.Difficulty), ct);
            return Results.Ok(new { batchId });
        });

        // POST /api/admin/batches/{id}/members
        group.MapPost("/batches/{id:guid}/members", async (
            Guid id,
            AddCandidatesToBatchRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            AddCandidatesToBatchHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var added = await handler.HandleAsync(
                new AddCandidatesToBatchCommand(id, body.CandidateIds), ct);
            return Results.Ok(new { ok = true, added });
        });

        // DELETE /api/admin/batches/{id}  (soft delete)
        group.MapDelete("/batches/{id:guid}", async (
            Guid id,
            HttpContext ctx,
            GetMeHandler meHandler,
            IBatchRepository batchRepo,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var batch = await batchRepo.GetByIdAsync(id, ct)
                ?? throw new KeyNotFoundException($"Batch {id} not found.");
            batch.Deactivate();
            await batchRepo.UpdateAsync(batch, ct);
            return Results.Ok(new { ok = true });
        });

        // DELETE /api/admin/question-batches/{id}  (soft delete)
        group.MapDelete("/question-batches/{id:guid}", async (
            Guid id,
            HttpContext ctx,
            GetMeHandler meHandler,
            IQuestionBatchRepository qbRepo,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var batch = await qbRepo.GetByIdAsync(id, ct)
                ?? throw new KeyNotFoundException($"Question batch {id} not found.");
            batch.Deactivate();
            await qbRepo.UpdateAsync(batch, ct);
            return Results.Ok(new { ok = true });
        });

        // ── Tests ─────────────────────────────────────────────────────────────

        // POST /api/admin/tests
        group.MapPost("/tests", async (
            CreateTestRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            CreateTestHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var testId = await handler.HandleAsync(new CreateTestCommand(
                body.Title, body.DurationMinutes, body.PassingScorePercent, body.Description), ct);
            return Results.Ok(new { testId });
        });

        // ── Assignments ───────────────────────────────────────────────────────

        // POST /api/admin/assignments
        group.MapPost("/assignments", async (
            CreateAssignmentRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            CreateAssignmentHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            if (!DateTime.TryParse(body.ScheduledStart, out var scheduledStart))
                return Results.BadRequest(new { ok = false, error = new { code = "INVALID_DATE", message = "ScheduledStart is not a valid date." } });
            if (!DateTime.TryParse(body.Deadline, out var deadline))
                return Results.BadRequest(new { ok = false, error = new { code = "INVALID_DATE", message = "Deadline is not a valid date." } });

            Guid? batchId = body.BatchId != null && Guid.TryParse(body.BatchId, out var bid) ? bid : null;
            Guid? candidateId = body.CandidateId != null && Guid.TryParse(body.CandidateId, out var cid) ? cid : null;

            var assignmentId = await handler.HandleAsync(new CreateAssignmentCommand(
                body.TestId, body.QuestionBatchId, body.QuestionCount,
                scheduledStart.ToUniversalTime(), deadline.ToUniversalTime(),
                body.MaxAttempts, batchId, candidateId), ct);
            return Results.Ok(new { assignmentId });
        });

        // ── Sessions ──────────────────────────────────────────────────────────

        // GET /api/admin/sessions?testId=&status=
        group.MapGet("/sessions", async (
            Guid testId,
            string? status,
            HttpContext ctx,
            GetMeHandler meHandler,
            GetAdminSessionsHandler handler,
            CancellationToken ct) =>
        {
            await GetCurrentAdmin(ctx, meHandler, ct);
            var result = await handler.HandleAsync(
                new GetAdminSessionsQuery(testId, status), ct);
            return Results.Ok(result);
        });
    }

    private static async Task<Application.DTOs.CandidateDto> GetCurrentAdmin(
        HttpContext ctx, GetMeHandler meHandler, CancellationToken ct)
    {
        var oid   = SessionGuard.GetOid(ctx);
        var email = ctx.User.FindFirstValue("preferred_username") ?? "";
        var name  = ctx.User.FindFirstValue("name") ?? "";
        var me    = await meHandler.HandleAsync(
            new Application.Queries.GetMeQuery(oid, email, name), ct);

        if (me.Role != "Admin" && me.Role != "SuperAdmin")
            throw new UnauthorizedAccessException(
                "Admin or SuperAdmin role required.");

        return me;
    }
}
