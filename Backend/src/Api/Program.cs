using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Adapters;
using Infrastructure.BackgroundServices;
using Domain.Ports.Repositories;
using Domain.Ports.Services;
using Microsoft.EntityFrameworkCore;

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

// ── Background Services ───────────────────────────────────────────────────────
builder.Services.AddHostedService<AutoFinalizeService>();
builder.Services.AddHostedService<WebhookProcessorService>();

// ── OpenAPI ───────────────────────────────────────────────────────────────────
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", utc = DateTime.UtcNow }))
   .WithName("Health");

app.Run();
