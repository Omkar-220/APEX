using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("Questions");

        builder.HasKey(q => q.QuestionId);

        builder.Property(q => q.QuestionId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(q => q.Content)
            .HasColumnType("NVARCHAR(MAX)")
            .IsRequired();

        builder.Property(q => q.OptionA).HasColumnType("NVARCHAR(500)").IsRequired();
        builder.Property(q => q.OptionB).HasColumnType("NVARCHAR(500)").IsRequired();
        builder.Property(q => q.OptionC).HasColumnType("NVARCHAR(500)").IsRequired();
        builder.Property(q => q.OptionD).HasColumnType("NVARCHAR(500)").IsRequired();

        builder.Property(q => q.CorrectOption)
            .HasConversion(c => c.ToString(), v => v[0])
            .HasColumnType("CHAR(1)")
            .IsRequired();

        builder.Property(q => q.Weightage)
            .HasColumnType("DECIMAL(5,2)")
            .HasDefaultValue(1m)
            .IsRequired();

        builder.Property(q => q.CreatedBy).IsRequired();

        builder.Property(q => q.CreatedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.HasOne(q => q.CreatedByCandidate)
            .WithMany()
            .HasForeignKey(q => q.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class QuestionBatchConfiguration : IEntityTypeConfiguration<QuestionBatch>
{
    public void Configure(EntityTypeBuilder<QuestionBatch> builder)
    {
        builder.ToTable("QuestionBatches");

        builder.HasKey(qb => qb.QuestionBatchId);

        builder.Property(qb => qb.QuestionBatchId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(qb => qb.Name)
            .HasColumnType("NVARCHAR(255)")
            .IsRequired();

        builder.Property(qb => qb.Domain).HasColumnType("NVARCHAR(100)");
        builder.Property(qb => qb.Topic).HasColumnType("NVARCHAR(100)");

        builder.Property(qb => qb.Difficulty)
            .HasConversion(
                d => d.HasValue ? d.Value.ToString() : null,
                v => v != null ? Enum.Parse<Difficulty>(v) : (Difficulty?)null)
            .HasColumnType("VARCHAR(20)");

        builder.Property(qb => qb.CreatedBy).IsRequired();

        builder.Property(qb => qb.CreatedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.Property(qb => qb.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.HasOne(qb => qb.CreatedByCandidate)
            .WithMany()
            .HasForeignKey(qb => qb.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(qb => qb.QuestionBatchMembers)
            .WithOne(qbm => qbm.QuestionBatch)
            .HasForeignKey(qbm => qbm.QuestionBatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(qb => qb.TestAssignments)
            .WithOne(a => a.QuestionBatch)
            .HasForeignKey(a => a.QuestionBatchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class QuestionBatchMemberConfiguration : IEntityTypeConfiguration<QuestionBatchMember>
{
    public void Configure(EntityTypeBuilder<QuestionBatchMember> builder)
    {
        builder.ToTable("QuestionBatchMembers");

        builder.HasKey(qbm => new { qbm.QuestionBatchId, qbm.QuestionId });

        builder.HasOne(qbm => qbm.Question)
            .WithMany(q => q.QuestionBatchMemberships)
            .HasForeignKey(qbm => qbm.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
