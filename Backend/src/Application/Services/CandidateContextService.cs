using Application.DTOs;
using Domain.Ports.Repositories;

namespace Application.Services;

/// <summary>
/// Resolves the current candidate from their Entra ID OID.
/// Cached for the duration of the HTTP request (scoped lifetime).
/// Never trusts role from JWT — always fetches from DB.
/// </summary>
public class CandidateContextService
{
    private readonly ICandidateRepository _repo;
    private CandidateDto? _cached;

    public CandidateContextService(ICandidateRepository repo) => _repo = repo;

    /// <summary>
    /// Returns the candidate for the given OID.
    /// Result is cached — DB is only hit once per request.
    /// Returns null if candidate not found (caller should return 401).
    /// </summary>
    public async Task<CandidateDto?> GetAsync(string oid, CancellationToken ct = default)
    {
        if (_cached != null) return _cached;

        var candidate = await _repo.GetByOidAsync(oid, ct);
        if (candidate == null) return null;

        _cached = new CandidateDto(
            candidate.CandidateId,
            candidate.Email.Value,
            candidate.DisplayName.Value,
            candidate.Role.ToString());

        return _cached;
    }

    /// <summary>
    /// Synchronous version — safe within HTTP request scope since result is already cached.
    /// Only call this after GetAsync has been called at least once (e.g. in auth policy).
    /// </summary>
    public CandidateDto? GetCached() => _cached;

    public void Invalidate() => _cached = null;
}
