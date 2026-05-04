using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class TestConfiguration : IEntityTypeConfiguration<Test>
{
    public void Configure(EntityTypeBuilder<Test> builder)
    {
        builder.ToTable("Tests");

        builder.HasKey(t => t.TestId);

        builder.Property(t => t.TestId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(t => t.Title)
            .HasColumnType("NVARCHAR(255)")
            .IsRequired();

        builder.Property(t => t.Description)
            .HasColumnType("NVARCHAR(500)");

        builder.Property(t => t.DurationMinutes)
            .IsRequired();

        builder.Property(t => t.PassingScorePercent)
            .HasColumnType("DECIMAL(5,2)")
            .IsRequired();

        builder.Property(t => t.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();
    }
}

public class TestAssignmentConfiguration : IEntityTypeConfiguration<TestAssignment>
{
    public void Configure(EntityTypeBuilder<TestAssignment> builder)
    {
        builder.ToTable("TestAssignments");

        builder.HasKey(a => a.AssignmentId);

        builder.Property(a => a.AssignmentId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(a => a.QuestionCount)
            .HasDefaultValue(40)
            .IsRequired();

        builder.Property(a => a.ScheduledStart)
            .HasColumnType("DATETIME2")
            .IsRequired();

        builder.Property(a => a.Deadline)
            .HasColumnType("DATETIME2")
            .IsRequired();

        builder.Property(a => a.Status)
            .HasConversion(s => s.ToString(), v => Enum.Parse<AssignmentStatus>(v))
            .HasColumnType("VARCHAR(20)")
            .HasDefaultValue(AssignmentStatus.Pending)
            .IsRequired();

        builder.Property(a => a.MaxAttempts)
            .HasDefaultValue(1)
            .IsRequired();

        builder.Property(a => a.CreatedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.HasIndex(a => new { a.Status, a.Deadline });
        builder.HasIndex(a => a.CandidateId).HasFilter("[CandidateId] IS NOT NULL");
        builder.HasIndex(a => a.BatchId).HasFilter("[BatchId] IS NOT NULL");

        builder.HasOne(a => a.Test)
            .WithMany(t => t.TestAssignments)
            .HasForeignKey(a => a.TestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.QuestionBatch)
            .WithMany(qb => qb.TestAssignments)
            .HasForeignKey(a => a.QuestionBatchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Batch)
            .WithMany(b => b.TestAssignments)
            .HasForeignKey(a => a.BatchId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Candidate)
            .WithMany(c => c.TestAssignments)
            .HasForeignKey(a => a.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
