using Api.Endpoints;
using Api.Middleware;
using Application.Commands;
using Application.Commands.Admin;
using Application.Queries;
using Application.Queries.Admin;
using Application.Services;
using Application.Validators;
using Domain.Ports.Repositories;
using Domain.Ports.Services;
using FluentValidation;
using Infrastructure.Adapters;
using Infrastructure.BackgroundServices;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql =>
        {
            sql.MigrationsAssembly("Infrastructure");
            sql.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
        }));

// ── Memory Cache ──────────────────────────────────────────────────────────────
builder.Services.AddMemoryCache();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
    options.AddPolicy("ApexCors", policy =>
        policy.WithOrigins(
                "http://localhost:5173",
                "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// ── Rate Limiting (per-user OID) ──────────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;

    // General: 60 req/min per user
    options.AddPolicy("general", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ctx.User.FindFirst("oid")?.Value ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Polling: 30 req/min per user (status endpoint)
    options.AddPolicy("polling", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ctx.User.FindFirst("oid")?.Value ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Submission: 120 req/min per user (answer submission)
    options.AddPolicy("submission", ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ctx.User.FindFirst("oid")?.Value ?? ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// ── Repositories ─────────────────────────────────────────────────────────────
builder.Services.AddScoped<ICandidateRepository, CandidateRepository>();
builder.Services.AddScoped<IBatchRepository, BatchRepository>();
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();
builder.Services.AddScoped<IQuestionBatchRepository, QuestionBatchRepository>();
builder.Services.AddScoped<ITestRepository, TestRepository>();
builder.Services.AddScoped<ITestAssignmentRepository, TestAssignmentRepository>();
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<IAnswerRepository, AnswerRepository>();
builder.Services.AddScoped<ISessionQuestionMappingRepository, SessionQuestionMappingRepository>();
builder.Services.AddScoped<IAuditRepository, AuditRepository>();
builder.Services.AddScoped<IWebhookOutboxRepository, WebhookOutboxRepository>();

// ── Service Adapters ──────────────────────────────────────────────────────────
builder.Services.AddScoped<INotificationPort, NotificationAdapter>();
builder.Services.AddScoped<IAuditPort, AuditAdapter>();
builder.Services.AddSingleton<IResultCachePort, ResultCacheAdapter>();

// ── HTTP Client (for webhook processor) ──────────────────────────────────────
builder.Services.AddHttpClient("webhook");

// ── Application Services ─────────────────────────────────────────────────────
builder.Services.AddScoped<CandidateContextService>();
builder.Services.AddSingleton<SessionStatusCacheService>();

// ── Application Commands ──────────────────────────────────────────────────────
builder.Services.AddScoped<ProvisionCandidateHandler>();
builder.Services.AddScoped<UpdateCandidateRoleHandler>();
builder.Services.AddScoped<CreateQuestionHandler>();
builder.Services.AddScoped<CreateQuestionBatchHandler>();
builder.Services.AddScoped<AddQuestionsToBatchHandler>();
builder.Services.AddScoped<CreateBatchHandler>();
builder.Services.AddScoped<AddCandidatesToBatchHandler>();
builder.Services.AddScoped<CreateTestHandler>();
builder.Services.AddScoped<CreateAssignmentHandler>();
builder.Services.AddScoped<InitializeExamHandler>();
builder.Services.AddScoped<SubmitAnswerHandler>();
builder.Services.AddScoped<FinalizeTestHandler>();
builder.Services.AddScoped<IFinalizeTestHandler>(sp => sp.GetRequiredService<FinalizeTestHandler>());

// ── Application Queries ───────────────────────────────────────────────────────
builder.Services.AddScoped<GetMeHandler>();
builder.Services.AddScoped<GetMyAssignmentsHandler>();
builder.Services.AddScoped<GetQuestionHandler>();
builder.Services.AddScoped<GetTestStatusHandler>();
builder.Services.AddScoped<GetTestResultHandler>();
builder.Services.AddScoped<GetAdminUsersHandler>();
builder.Services.AddScoped<GetAdminSessionsHandler>();

// ── Validators ────────────────────────────────────────────────────────────────
builder.Services.AddValidatorsFromAssemblyContaining<ProvisionCandidateValidator>();

// ── Background Services ───────────────────────────────────────────────────────
builder.Services.AddHostedService<AutoFinalizeService>();
builder.Services.AddHostedService<WebhookProcessorService>();
builder.Services.AddHostedService<SessionStatusSweepService>();

// ── OpenAPI ───────────────────────────────────────────────────────────────────
builder.Services.AddOpenApi();

var app = builder.Build();

// ── Middleware Pipeline (order matters) ───────────────────────────────────────
app.UseMiddleware<ExceptionHandlerMiddleware>();

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseCors("ApexCors");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseMiddleware<DevAuthMiddleware>();
}
// else: app.UseAuthentication(); app.UseAuthorization(); ← wire when Entra ID is ready

app.UseRateLimiter();

// ── Endpoints ─────────────────────────────────────────────────────────────────
app.MapGet("/health", () => Results.Ok(new { status = "healthy", utc = DateTime.UtcNow }))
   .WithName("Health")
   .RequireRateLimiting("general");

app.MapCandidateEndpoints();
app.MapExamEndpoints();
app.MapAdminEndpoints();

app.Run();
