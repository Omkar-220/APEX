using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class TestSessionConfiguration : IEntityTypeConfiguration<TestSession>
{
    public void Configure(EntityTypeBuilder<TestSession> builder)
    {
        builder.ToTable("TestSessions");

        builder.HasKey(s => s.SessionId);

        builder.Property(s => s.SessionId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(s => s.CandidateAzureAdOid)
            .HasColumnType("VARCHAR(128)")
            .IsRequired();

        builder.Property(s => s.AttemptNumber)
            .HasDefaultValue(1)
            .IsRequired();

        builder.Property(s => s.StartTime)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.Property(s => s.EndTime)
            .HasColumnType("DATETIME2");

        builder.Property(s => s.Status)
            .HasConversion(s => s.ToString(), v => Enum.Parse<TestSessionStatus>(v))
            .HasColumnType("VARCHAR(20)")
            .HasDefaultValue(TestSessionStatus.Active)
            .IsRequired();

        builder.Property(s => s.Score)
            .IsRequired(false);

        builder.Property(s => s.RowVersion)
            .IsRowVersion()
            .IsRequired();

        builder.HasIndex(s => new { s.AssignmentId, s.CandidateId, s.AttemptNumber }).IsUnique();
        builder.HasIndex(s => new { s.CandidateId, s.Status });
        builder.HasIndex(s => new { s.Status, s.StartTime });

        builder.HasOne(s => s.Assignment)
            .WithMany(a => a.TestSessions)
            .HasForeignKey(s => s.AssignmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Candidate)
            .WithMany(c => c.TestSessions)
            .HasForeignKey(s => s.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Test)
            .WithMany(t => t.TestSessions)
            .HasForeignKey(s => s.TestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(s => s.QuestionMappings)
            .WithOne(m => m.Session)
            .HasForeignKey(m => m.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Answers)
            .WithOne(a => a.Session)
            .HasForeignKey(a => a.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.AuditEvents)
            .WithOne(e => e.Session)
            .HasForeignKey(e => e.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SessionQuestionMappingConfiguration : IEntityTypeConfiguration<SessionQuestionMapping>
{
    public void Configure(EntityTypeBuilder<SessionQuestionMapping> builder)
    {
        builder.ToTable("SessionQuestionMappings");

        builder.HasKey(m => m.MappingId);

        builder.Property(m => m.MappingId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(m => m.OptionMapping)
            .HasColumnType("NVARCHAR(MAX)")
            .IsRequired();

        builder.HasIndex(m => new { m.SessionId, m.QuestionPosition }).IsUnique();
        builder.HasIndex(m => new { m.SessionId, m.QuestionId }).IsUnique();

        builder.HasOne(m => m.Question)
            .WithMany(q => q.SessionMappings)
            .HasForeignKey(m => m.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class AnswerConfiguration : IEntityTypeConfiguration<Answer>
{
    public void Configure(EntityTypeBuilder<Answer> builder)
    {
        builder.ToTable("Answers");

        builder.HasKey(a => a.AnswerId);

        builder.Property(a => a.AnswerId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(a => a.SelectedOption)
            .HasConversion(c => c.ToString(), v => v[0])
            .HasColumnType("CHAR(1)")
            .IsRequired();

        builder.Property(a => a.IdempotencyKey)
            .IsRequired();

        builder.Property(a => a.SubmittedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.HasIndex(a => a.IdempotencyKey).IsUnique();
        builder.HasIndex(a => new { a.SessionId, a.QuestionId }).IsUnique();
        builder.HasIndex(a => a.SessionId);

        builder.HasOne(a => a.Question)
            .WithMany(q => q.Answers)
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
