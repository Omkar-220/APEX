using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class BatchConfiguration : IEntityTypeConfiguration<Batch>
{
    public void Configure(EntityTypeBuilder<Batch> builder)
    {
        builder.ToTable("Batches");

        builder.HasKey(b => b.BatchId);

        builder.Property(b => b.BatchId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(b => b.Name)
            .HasColumnType("NVARCHAR(255)")
            .IsRequired();

        builder.Property(b => b.Domain)
            .HasColumnType("NVARCHAR(100)");

        builder.Property(b => b.Topic)
            .HasColumnType("NVARCHAR(100)");

        builder.Property(b => b.Difficulty)
            .HasConversion(
                d => d.HasValue ? d.Value.ToString() : null,
                v => v != null ? Enum.Parse<Difficulty>(v) : (Difficulty?)null)
            .HasColumnType("VARCHAR(20)");

        builder.Property(b => b.CreatedBy)
            .IsRequired();

        builder.Property(b => b.CreatedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.Property(b => b.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.HasOne(b => b.CreatedByCandidate)
            .WithMany()
            .HasForeignKey(b => b.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(b => b.Members)
            .WithOne(bm => bm.Batch)
            .HasForeignKey(bm => bm.BatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.TestAssignments)
            .WithOne(a => a.Batch)
            .HasForeignKey(a => a.BatchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class BatchMemberConfiguration : IEntityTypeConfiguration<BatchMember>
{
    public void Configure(EntityTypeBuilder<BatchMember> builder)
    {
        builder.ToTable("BatchMembers");

        builder.HasKey(bm => new { bm.BatchId, bm.CandidateId });

        builder.Property(bm => bm.AddedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.HasOne(bm => bm.Candidate)
            .WithMany(c => c.BatchMemberships)
            .HasForeignKey(bm => bm.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
