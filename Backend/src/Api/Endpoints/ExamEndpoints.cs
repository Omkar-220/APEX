using Api.Middleware;
using Api.Models;
using Application.Commands;
using Application.Queries;
using Application.Services;
using Domain.Ports.Repositories;
using Domain.Ports.Services;
using System.Security.Claims;

namespace Api.Endpoints;

public static class ExamEndpoints
{
    public static void MapExamEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api").WithTags("Exam");

        // POST /api/tests/{testId}/initialize
        group.MapPost("/tests/{testId:guid}/initialize", async (
            Guid testId,
            InitializeExamRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            InitializeExamHandler handler,
            CancellationToken ct) =>
        {
            var oid   = SessionGuard.GetOid(ctx);
            var email = ctx.User.FindFirstValue("preferred_username") ?? "";
            var name  = ctx.User.FindFirstValue("name") ?? "";
            var me    = await meHandler.HandleAsync(new GetMeQuery(oid, email, name), ct);

            var result = await handler.HandleAsync(
                new InitializeExamCommand(me.CandidateId, testId, body.AssignmentId, oid), ct);

            return Results.Ok(result);
        });

        // GET /api/sessions/{sessionId}/status
        group.MapGet("/sessions/{sessionId:guid}/status", async (
            Guid sessionId,
            HttpContext ctx,
            GetMeHandler meHandler,
            GetTestStatusHandler handler,
            ISessionRepository sessionRepo,
            CancellationToken ct) =>
        {
            await SessionGuard.ValidateAsync(ctx, sessionId, sessionRepo, ct);
            var oid   = SessionGuard.GetOid(ctx);
            var email = ctx.User.FindFirstValue("preferred_username") ?? "";
            var name  = ctx.User.FindFirstValue("name") ?? "";
            var me    = await meHandler.HandleAsync(new GetMeQuery(oid, email, name), ct);

            var result = await handler.HandleAsync(
                new GetTestStatusQuery(sessionId, me.CandidateId), ct);

            return Results.Ok(result);
        });

        // GET /api/sessions/{sessionId}/questions/{questionId}
        group.MapGet("/sessions/{sessionId:guid}/questions/{questionId:guid}", async (
            Guid sessionId,
            Guid questionId,
            HttpContext ctx,
            GetMeHandler meHandler,
            GetQuestionHandler handler,
            ISessionRepository sessionRepo,
            CancellationToken ct) =>
        {
            await SessionGuard.ValidateAsync(ctx, sessionId, sessionRepo, ct);
            var oid   = SessionGuard.GetOid(ctx);
            var email = ctx.User.FindFirstValue("preferred_username") ?? "";
            var name  = ctx.User.FindFirstValue("name") ?? "";
            var me    = await meHandler.HandleAsync(new GetMeQuery(oid, email, name), ct);

            var result = await handler.HandleAsync(
                new GetQuestionQuery(sessionId, me.CandidateId, questionId), ct);

            return Results.Ok(result);
        });

        // PUT /api/sessions/{sessionId}/answers
        group.MapPut("/sessions/{sessionId:guid}/answers", async (
            Guid sessionId,
            SubmitAnswerRequest body,
            HttpContext ctx,
            GetMeHandler meHandler,
            SubmitAnswerHandler handler,
            ISessionRepository sessionRepo,
            CancellationToken ct) =>
        {
            await SessionGuard.ValidateAsync(ctx, sessionId, sessionRepo, ct);

            var idempotencyKeyStr = ctx.Request.Headers["X-Idempotency-Key"].FirstOrDefault();
            if (!Guid.TryParse(idempotencyKeyStr, out var idempotencyKey))
                return Results.BadRequest(new { ok = false, error = new { code = "MISSING_IDEMPOTENCY_KEY", message = "X-Idempotency-Key header must be a valid GUID." } });

            var oid   = SessionGuard.GetOid(ctx);
            var email = ctx.User.FindFirstValue("preferred_username") ?? "";
            var name  = ctx.User.FindFirstValue("name") ?? "";
            var me    = await meHandler.HandleAsync(new GetMeQuery(oid, email, name), ct);

            await handler.HandleAsync(new SubmitAnswerCommand(
                sessionId, me.CandidateId, body.QuestionId, body.SelectedOption, idempotencyKey), ct);

            return Results.Ok(new { ok = true });
        });

        // POST /api/sessions/{sessionId}/finalize
        group.MapPost("/sessions/{sessionId:guid}/finalize", async (
            Guid sessionId,
            HttpContext ctx,
            GetMeHandler meHandler,
            IFinalizeTestHandler handler,
            ISessionRepository sessionRepo,
            CancellationToken ct) =>
        {
            await SessionGuard.ValidateAsync(ctx, sessionId, sessionRepo, ct);
            var oid   = SessionGuard.GetOid(ctx);
            var email = ctx.User.FindFirstValue("preferred_username") ?? "";
            var name  = ctx.User.FindFirstValue("name") ?? "";
            var me    = await meHandler.HandleAsync(new GetMeQuery(oid, email, name), ct);

            var result = await handler.HandleAsync(
                new FinalizeTestCommand(sessionId, me.CandidateId, "candidate"), ct);

            return Results.Ok(result);
        });

        // GET /api/sessions/{sessionId}/result
        group.MapGet("/sessions/{sessionId:guid}/result", async (
            Guid sessionId,
            HttpContext ctx,
            GetMeHandler meHandler,
            GetTestResultHandler handler,
            CancellationToken ct) =>
        {
            var oid   = SessionGuard.GetOid(ctx);
            var email = ctx.User.FindFirstValue("preferred_username") ?? "";
            var name  = ctx.User.FindFirstValue("name") ?? "";
            var me    = await meHandler.HandleAsync(new GetMeQuery(oid, email, name), ct);

            var result = await handler.HandleAsync(
                new GetTestResultQuery(sessionId, me.CandidateId), ct);

            return Results.Ok(result);
        });

        // POST /api/audit
        group.MapPost("/audit", async (
            AuditEventRequest body,
            HttpContext ctx,
            IAuditPort auditPort,
            CancellationToken ct) =>
        {
            var sessionIdStr = ctx.Request.Headers["X-Session-Id"].FirstOrDefault();
            if (!Guid.TryParse(sessionIdStr, out var sessionId))
                return Results.BadRequest(new { ok = false, error = new { code = "MISSING_SESSION_ID", message = "X-Session-Id header is required." } });

            await auditPort.RecordAsync(sessionId, body.Type, body.Payload, ct);
            return Results.Ok(new { ok = true });
        });
    }
}
