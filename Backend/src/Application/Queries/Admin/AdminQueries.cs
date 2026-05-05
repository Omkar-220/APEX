using Application.DTOs;
using Domain.Enums;
using Domain.Ports.Repositories;

namespace Application.Queries.Admin;

// ── Get Admin Users ───────────────────────────────────────────────────────────

public class GetAdminUsersHandler
{
    private readonly ICandidateRepository _repo;
    public GetAdminUsersHandler(ICandidateRepository repo) => _repo = repo;

    public async Task<List<CandidateDto>> HandleAsync(CancellationToken ct = default)
    {
        var candidates = await _repo.GetAllAsync(ct);
        return candidates.Select(c => new CandidateDto(
            c.CandidateId,
            c.Email.Value,
            c.DisplayName.Value,
            c.Role.ToString())).ToList();
    }
}

// ── Get Admin Sessions ────────────────────────────────────────────────────────

public record GetAdminSessionsQuery(Guid TestId, string? Status);

public class GetAdminSessionsHandler
{
    private readonly ISessionRepository _sessionRepo;

    public GetAdminSessionsHandler(ISessionRepository sessionRepo)
    {
        _sessionRepo = sessionRepo;
    }

    public async Task<List<AdminSessionDto>> HandleAsync(GetAdminSessionsQuery query, CancellationToken ct = default)
    {
        TestSessionStatus? status = query.Status != null
            ? Enum.Parse<TestSessionStatus>(query.Status) : null;

        var sessions = await _sessionRepo.GetByTestAsync(query.TestId, status, ct);

        return sessions.Select(s => new AdminSessionDto(
            s.SessionId,
            s.Candidate.Email.Value,
            s.Status.ToString(),
            s.Score,
            s.StartTime)).ToList();
    }
}
