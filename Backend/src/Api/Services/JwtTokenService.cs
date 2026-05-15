using Domain.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Api.Services;

public class JwtTokenService
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryHours;

    public JwtTokenService(IConfiguration config)
    {
        _secret      = config["Jwt:Secret"]    ?? throw new InvalidOperationException("Jwt:Secret not configured.");
        _issuer      = config["Jwt:Issuer"]    ?? "apex-api";
        _audience    = config["Jwt:Audience"] ?? "apex-client";
        _expiryHours = int.TryParse(config["Jwt:ExpiryHours"], out var h) ? h : 8;
    }

    public string Generate(Candidate candidate)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("oid",                candidate.AzureAdOidValue),
            new Claim("preferred_username", candidate.EmailValue),
            new Claim("name",               candidate.DisplayNameValue),
            new Claim("role",               candidate.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, candidate.CandidateId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             _issuer,
            audience:           _audience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(_expiryHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
