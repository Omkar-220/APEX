using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class AuditEventConfiguration : IEntityTypeConfiguration<AuditEvent>
{
    public void Configure(EntityTypeBuilder<AuditEvent> builder)
    {
        builder.ToTable("AuditEvents");

        builder.HasKey(e => e.EventId);

        builder.Property(e => e.EventId)
            .UseIdentityColumn();

        builder.Property(e => e.EventType)
            .HasColumnType("VARCHAR(50)")
            .IsRequired();

        builder.Property(e => e.Payload)
            .HasColumnType("NVARCHAR(MAX)");

        builder.Property(e => e.OccurredAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.HasIndex(e => new { e.SessionId, e.OccurredAt });
    }
}

public class WebhookOutboxConfiguration : IEntityTypeConfiguration<WebhookOutbox>
{
    public void Configure(EntityTypeBuilder<WebhookOutbox> builder)
    {
        builder.ToTable("WebhookOutbox");

        builder.HasKey(w => w.OutboxId);

        builder.Property(w => w.OutboxId)
            .HasDefaultValueSql("NEWID()");

        builder.Property(w => w.EventType)
            .HasColumnType("VARCHAR(50)")
            .IsRequired();

        builder.Property(w => w.Payload)
            .HasColumnType("NVARCHAR(MAX)")
            .IsRequired();

        builder.Property(w => w.TargetUrl)
            .HasColumnType("NVARCHAR(500)")
            .IsRequired();

        builder.Property(w => w.Status)
            .HasConversion(s => s.ToString(), v => Enum.Parse<WebhookStatus>(v))
            .HasColumnType("VARCHAR(20)")
            .HasDefaultValue(WebhookStatus.Pending)
            .IsRequired();

        builder.Property(w => w.RetryCount)
            .HasDefaultValue(0)
            .IsRequired();

        builder.Property(w => w.LastAttempt)
            .HasColumnType("DATETIME2");

        builder.Property(w => w.CreatedAt)
            .HasColumnType("DATETIME2")
            .HasDefaultValueSql("SYSUTCDATETIME()")
            .IsRequired();

        builder.HasIndex(w => w.Status)
            .HasFilter("[Status] IN ('Pending','Failed')");
    }
}
