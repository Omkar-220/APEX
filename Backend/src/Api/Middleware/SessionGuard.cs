using System.Security.Claims;
using Domain.Entities;
using Domain.Ports.Repositories;

namespace Api.Middleware;

public static class SessionGuard
{
    /// <summary>
    /// Validates:
    /// 1. X-Session-Id header is present and matches the route sessionId
    /// 2. Session exists in DB
    /// 3. Session belongs to the authenticated candidate (OID match)
    /// 
    /// Throws UnauthorizedAccessException or KeyNotFoundException on failure.
    /// </summary>
    public static async Task<TestSession> ValidateAsync(
        HttpContext ctx,
        Guid sessionId,
        ISessionRepository repo,
        CancellationToken ct = default)
    {
        // Validate X-Session-Id header matches route param
        var headerVal = ctx.Request.Headers["X-Session-Id"].FirstOrDefault();
        if (!Guid.TryParse(headerVal, out var headerId) || headerId != sessionId)
            throw new UnauthorizedAccessException("X-Session-Id header is missing or invalid.");

        // Load session
        var session = await repo.GetByIdAsync(sessionId, ct)
            ?? throw new KeyNotFoundException($"Session {sessionId} not found.");

        // Validate OID ownership
        var oid = ctx.User.FindFirstValue("oid")
            ?? throw new UnauthorizedAccessException("OID claim not found in token.");

        if (session.CandidateAzureAdOid != oid)
            throw new UnauthorizedAccessException("Session does not belong to this candidate.");

        return session;
    }

    /// <summary>
    /// Extracts OID from the current user claims.
    /// Throws UnauthorizedAccessException if not found.
    /// </summary>
    public static string GetOid(HttpContext ctx) =>
        ctx.User.FindFirstValue("oid")
        ?? throw new UnauthorizedAccessException("OID claim not found in token.");
}
