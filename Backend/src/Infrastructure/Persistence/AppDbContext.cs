using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<BatchMember> BatchMembers => Set<BatchMember>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionBatch> QuestionBatches => Set<QuestionBatch>();
    public DbSet<QuestionBatchMember> QuestionBatchMembers => Set<QuestionBatchMember>();
    public DbSet<Test> Tests => Set<Test>();
    public DbSet<TestAssignment> TestAssignments => Set<TestAssignment>();
    public DbSet<TestSession> TestSessions => Set<TestSession>();
    public DbSet<SessionQuestionMapping> SessionQuestionMappings => Set<SessionQuestionMapping>();
    public DbSet<Answer> Answers => Set<Answer>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<WebhookOutbox> WebhookOutbox => Set<WebhookOutbox>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
