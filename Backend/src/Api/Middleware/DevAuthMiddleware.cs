using System.Security.Claims;

namespace Api.Middleware;

/// <summary>
/// Development-only middleware that simulates Entra ID authentication.
/// ONLY registered in Development environment via Program.cs.
/// NEVER ships to production — production uses Microsoft.Identity.Web.
/// </summary>
public class DevAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _env;

    public DevAuthMiddleware(RequestDelegate next, IWebHostEnvironment env)
    {
        _next = next;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Hard guard — refuses to run outside Development even if accidentally registered
        if (!_env.IsDevelopment())
            throw new InvalidOperationException(
                "DevAuthMiddleware must never run outside Development environment.");

        var role = context.Request.Headers["X-Dev-Role"].FirstOrDefault() ?? "Candidate";

        var (oid, email, name) = role switch
        {
            "SuperAdmin" => ("dev-oid-superadmin", "superadmin@dev.local", "Dev SuperAdmin"),
            "Admin"      => ("dev-oid-admin",      "admin@dev.local",      "Dev Admin"),
            _            => ("dev-oid-candidate",   "candidate@dev.local",  "Dev Candidate")
        };

        var claims = new[]
        {
            new Claim("oid",                oid),
            new Claim("preferred_username", email),
            new Claim("name",               name),
            new Claim(ClaimTypes.Name,      name)
        };

        var identity = new ClaimsIdentity(claims, "DevAuth");
        context.User = new ClaimsPrincipal(identity);

        await _next(context);
    }
}
