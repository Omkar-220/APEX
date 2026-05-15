using Domain.Entities;
using Domain.Enums;
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

        builder.Property(c => c.EmailValue)
            .HasColumnName("Email")
            .HasColumnType("NVARCHAR(255)")
            .IsRequired();

        builder.HasIndex(c => c.EmailValue)
            .IsUnique()
            .HasDatabaseName("IX_Candidates_Email");

        builder.Property(c => c.PasswordHash)
            .HasColumnType("NVARCHAR(255)")
            .IsRequired(false);

        builder.Property(c => c.AzureAdOidValue)
            .HasColumnName("AzureAdOid")
            .HasColumnType("VARCHAR(128)")
            .IsRequired();

        builder.HasIndex(c => c.AzureAdOidValue)
            .IsUnique()
            .HasDatabaseName("IX_Candidates_AzureAdOid");

        builder.Property(c => c.DisplayNameValue)
            .HasColumnName("DisplayName")
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

        // Ignore computed value object properties — EF must not try to map these
        builder.Ignore(c => c.Email);
        builder.Ignore(c => c.AzureAdOid);
        builder.Ignore(c => c.DisplayName);

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
