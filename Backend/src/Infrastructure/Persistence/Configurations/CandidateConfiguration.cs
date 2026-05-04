using Domain.Entities;
using Domain.Enums;
using Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CandidateConfiguration : IEntityTypeConfiguration<Candidate>
{
    public void Configure(EntityTypeBuilder<Candidate> builder)
    {
        builder.ToTable("Candidates");

        builder.HasKey(c => c.CandidateId);

        builder.Property(c => c.CandidateId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(c => c.Email)
            .HasConversion(e => e.Value, v => Email.Create(v))
            .HasColumnType("NVARCHAR(255)")
            .IsRequired();

        builder.HasIndex(c => c.Email).IsUnique();

        builder.Property(c => c.AzureAdOid)
            .HasConversion(o => o.Value, v => AzureAdOid.Create(v))
            .HasColumnType("VARCHAR(128)")
            .IsRequired();

        builder.HasIndex(c => c.AzureAdOid).IsUnique();

        builder.Property(c => c.DisplayName)
            .HasConversion(d => d.Value, v => DisplayName.Create(v))
            .HasColumnType("NVARCHAR(255)")
            .IsRequired();

        builder.Property(c => c.Role)
            .HasConversion(r => r.ToString(), v => Enum.Parse<Role>(v))
            .HasColumnType("VARCHAR(20)")
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.HasMany(c => c.BatchMemberships)
            .WithOne(bm => bm.Candidate)
            .HasForeignKey(bm => bm.CandidateId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.TestSessions)
            .WithOne(s => s.Candidate)
            .HasForeignKey(s => s.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.TestAssignments)
            .WithOne(a => a.Candidate)
            .HasForeignKey(a => a.CandidateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
