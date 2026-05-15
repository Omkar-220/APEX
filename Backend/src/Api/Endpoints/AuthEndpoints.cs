using Api.Models;
using Api.Services;
using Domain.Entities;
using Domain.Enums;
using Domain.Ports.Repositories;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // POST /api/auth/register
        group.MapPost("/register", async (
            RegisterRequest body,
            ICandidateRepository repo,
            JwtTokenService jwt,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(body.Email) ||
                string.IsNullOrWhiteSpace(body.Password) ||
                string.IsNullOrWhiteSpace(body.DisplayName))
                return Results.BadRequest(new { ok = false, error = new { code = "VALIDATION_ERROR", message = "Email, password and display name are required." } });

            if (body.Password.Length < 6)
                return Results.BadRequest(new { ok = false, error = new { code = "VALIDATION_ERROR", message = "Password must be at least 6 characters." } });

            // Check if email already exists
            var existing = await repo.GetByEmailAsync(body.Email, ct);
            if (existing != null)
                return Results.Conflict(new { ok = false, error = new { code = "EMAIL_TAKEN", message = "An account with this email already exists." } });

            var candidate = Candidate.Create(body.Email, Guid.NewGuid().ToString(), body.DisplayName);
            candidate.SetPassword(body.Password);

            try
            {
                await repo.AddAsync(candidate, ct);
            }
            catch (DbUpdateException ex) when (ex.InnerException is SqlException sqlEx
                && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                return Results.Conflict(new { ok = false, error = new { code = "EMAIL_TAKEN", message = "An account with this email already exists." } });
            }

            var token = jwt.Generate(candidate);
            return Results.Ok(new
            {
                token,
                candidateId  = candidate.CandidateId,
                displayName  = candidate.DisplayNameValue,
                email        = candidate.EmailValue,
                role         = candidate.Role.ToString()
            });
        });

        // POST /api/auth/login
        group.MapPost("/login", async (
            LoginRequest body,
            ICandidateRepository repo,
            JwtTokenService jwt,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
                return Results.BadRequest(new { ok = false, error = new { code = "VALIDATION_ERROR", message = "Email and password are required." } });

            var candidate = await repo.GetByEmailAsync(body.Email, ct);

            if (candidate == null || !candidate.VerifyPassword(body.Password))
                return Results.Unauthorized();

            var token = jwt.Generate(candidate);
            return Results.Ok(new
            {
                token,
                candidateId  = candidate.CandidateId,
                displayName  = candidate.DisplayNameValue,
                email        = candidate.EmailValue,
                role         = candidate.Role.ToString()
            });
        });
    }
}
