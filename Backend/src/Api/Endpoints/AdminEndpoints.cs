using Api.Middleware;
using Api.Models;
using Application.Commands.Admin;
using Application.Queries;
using Application.Queries.Admin;
using Application.Services;
using System.Security.Claims;

namespace Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin").WithTags("Admin");

        // ── Users ─────────────────────────────────────────────────────────────

        // GET /api/admin/users
        group.MapGet("/users", async (
            GetAdminUsersHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(ct);
            return Results.Ok(result);
        });

        // PUT /api/admin/users/{candidateId}/role
        group.MapPut("/users/{candidateId:guid}/role", async (
            Guid candidateId,
            UpdateRoleRequest body,
            UpdateCandidateRoleHandler handler,
            CancellationToken ct) =>
        {
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

        // POST /api/admin/question-batches/{id}/members
        group.MapPost("/question-batches/{id:guid}/members", async (
            Guid id,
            AddQuestionsToBatchRequest body,
            AddQuestionsToBatchHandler handler,
            CancellationToken ct) =>
        {
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
            AddCandidatesToBatchHandler handler,
            CancellationToken ct) =>
        {
            var added = await handler.HandleAsync(
                new AddCandidatesToBatchCommand(id, body.CandidateIds), ct);
            return Results.Ok(new { ok = true, added });
        });

        // ── Tests ─────────────────────────────────────────────────────────────

        // POST /api/admin/tests
        group.MapPost("/tests", async (
            CreateTestRequest body,
            CreateTestHandler handler,
            CancellationToken ct) =>
        {
            var testId = await handler.HandleAsync(new CreateTestCommand(
                body.Title, body.DurationMinutes, body.PassingScorePercent, body.Description), ct);
            return Results.Ok(new { testId });
        });

        // ── Assignments ───────────────────────────────────────────────────────

        // POST /api/admin/assignments
        group.MapPost("/assignments", async (
            CreateAssignmentRequest body,
            CreateAssignmentHandler handler,
            CancellationToken ct) =>
        {
            var assignmentId = await handler.HandleAsync(new CreateAssignmentCommand(
                body.TestId, body.QuestionBatchId, body.QuestionCount,
                body.ScheduledStart, body.Deadline, body.MaxAttempts,
                body.BatchId, body.CandidateId), ct);
            return Results.Ok(new { assignmentId });
        });

        // ── Sessions ──────────────────────────────────────────────────────────

        // GET /api/admin/sessions?testId=&status=
        group.MapGet("/sessions", async (
            Guid testId,
            string? status,
            GetAdminSessionsHandler handler,
            CancellationToken ct) =>
        {
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
        return await meHandler.HandleAsync(
            new Application.Queries.GetMeQuery(oid, email, name), ct);
    }
}
