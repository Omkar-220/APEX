using Api.Middleware;
using Application.Queries;
using Application.Services;
using System.Security.Claims;

namespace Api.Endpoints;

public static class CandidateEndpoints
{
    public static void MapCandidateEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api").WithTags("Candidate");

        // GET /api/me
        group.MapGet("/me", async (
            HttpContext ctx,
            GetMeHandler handler,
            CancellationToken ct) =>
        {
            var oid   = SessionGuard.GetOid(ctx);
            var email = ctx.User.FindFirstValue("preferred_username") ?? "";
            var name  = ctx.User.FindFirstValue("name") ?? "";

            var result = await handler.HandleAsync(new GetMeQuery(oid, email, name), ct);
            return Results.Ok(result);
        });

        // GET /api/my-assignments
        group.MapGet("/my-assignments", async (
            HttpContext ctx,
            GetMeHandler meHandler,
            GetMyAssignmentsHandler assignmentsHandler,
            CancellationToken ct) =>
        {
            var oid      = SessionGuard.GetOid(ctx);
            var email    = ctx.User.FindFirstValue("preferred_username") ?? "";
            var name     = ctx.User.FindFirstValue("name") ?? "";
            var me       = await meHandler.HandleAsync(new GetMeQuery(oid, email, name), ct);
            var result   = await assignmentsHandler.HandleAsync(
                new GetMyAssignmentsQuery(me.CandidateId), ct);
            return Results.Ok(result);
        });
    }
}
