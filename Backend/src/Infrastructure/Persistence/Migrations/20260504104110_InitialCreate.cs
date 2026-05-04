using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Candidates",
                columns: table => new
                {
                    CandidateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Email = table.Column<string>(type: "NVARCHAR(255)", nullable: false),
                    AzureAdOid = table.Column<string>(type: "VARCHAR(128)", nullable: false),
                    DisplayName = table.Column<string>(type: "NVARCHAR(255)", nullable: false),
                    Role = table.Column<string>(type: "VARCHAR(20)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Candidates", x => x.CandidateId);
                });

            migrationBuilder.CreateTable(
                name: "Tests",
                columns: table => new
                {
                    TestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Title = table.Column<string>(type: "NVARCHAR(255)", nullable: false),
                    Description = table.Column<string>(type: "NVARCHAR(500)", nullable: true),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    PassingScorePercent = table.Column<decimal>(type: "DECIMAL(5,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tests", x => x.TestId);
                });

            migrationBuilder.CreateTable(
                name: "WebhookOutbox",
                columns: table => new
                {
                    OutboxId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    EventType = table.Column<string>(type: "VARCHAR(50)", nullable: false),
                    Payload = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    TargetUrl = table.Column<string>(type: "NVARCHAR(500)", nullable: false),
                    Status = table.Column<string>(type: "VARCHAR(20)", nullable: false, defaultValue: "Pending"),
                    RetryCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    LastAttempt = table.Column<DateTime>(type: "DATETIME2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebhookOutbox", x => x.OutboxId);
                });

            migrationBuilder.CreateTable(
                name: "Batches",
                columns: table => new
                {
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "NVARCHAR(255)", nullable: false),
                    Domain = table.Column<string>(type: "NVARCHAR(100)", nullable: true),
                    Topic = table.Column<string>(type: "NVARCHAR(100)", nullable: true),
                    Difficulty = table.Column<string>(type: "VARCHAR(20)", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Batches", x => x.BatchId);
                    table.ForeignKey(
                        name: "FK_Batches_Candidates_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Candidates",
                        principalColumn: "CandidateId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBatches",
                columns: table => new
                {
                    QuestionBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Name = table.Column<string>(type: "NVARCHAR(255)", nullable: false),
                    Domain = table.Column<string>(type: "NVARCHAR(100)", nullable: true),
                    Topic = table.Column<string>(type: "NVARCHAR(100)", nullable: true),
                    Difficulty = table.Column<string>(type: "VARCHAR(20)", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBatches", x => x.QuestionBatchId);
                    table.ForeignKey(
                        name: "FK_QuestionBatches_Candidates_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Candidates",
                        principalColumn: "CandidateId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BatchMembers",
                columns: table => new
                {
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CandidateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BatchMembers", x => new { x.BatchId, x.CandidateId });
                    table.ForeignKey(
                        name: "FK_BatchMembers_Batches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "Batches",
                        principalColumn: "BatchId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BatchMembers_Candidates_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "Candidates",
                        principalColumn: "CandidateId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Questions",
                columns: table => new
                {
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    Content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    OptionA = table.Column<string>(type: "NVARCHAR(500)", nullable: false),
                    OptionB = table.Column<string>(type: "NVARCHAR(500)", nullable: false),
                    OptionC = table.Column<string>(type: "NVARCHAR(500)", nullable: false),
                    OptionD = table.Column<string>(type: "NVARCHAR(500)", nullable: false),
                    CorrectOption = table.Column<string>(type: "CHAR(1)", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    QuestionBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Weightage = table.Column<decimal>(type: "DECIMAL(5,2)", nullable: false, defaultValue: 1m)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Questions", x => x.QuestionId);
                    table.ForeignKey(
                        name: "FK_Questions_Candidates_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Candidates",
                        principalColumn: "CandidateId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Questions_QuestionBatches_QuestionBatchId",
                        column: x => x.QuestionBatchId,
                        principalTable: "QuestionBatches",
                        principalColumn: "QuestionBatchId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TestAssignments",
                columns: table => new
                {
                    AssignmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    TestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CandidateId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    QuestionCount = table.Column<int>(type: "int", nullable: false, defaultValue: 40),
                    ScheduledStart = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    Deadline = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    Status = table.Column<string>(type: "VARCHAR(20)", nullable: false, defaultValue: "Pending"),
                    MaxAttempts = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestAssignments", x => x.AssignmentId);
                    table.ForeignKey(
                        name: "FK_TestAssignments_Batches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "Batches",
                        principalColumn: "BatchId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TestAssignments_Candidates_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "Candidates",
                        principalColumn: "CandidateId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TestAssignments_QuestionBatches_QuestionBatchId",
                        column: x => x.QuestionBatchId,
                        principalTable: "QuestionBatches",
                        principalColumn: "QuestionBatchId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TestAssignments_Tests_TestId",
                        column: x => x.TestId,
                        principalTable: "Tests",
                        principalColumn: "TestId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuestionBatchMembers",
                columns: table => new
                {
                    QuestionBatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionBatchMembers", x => new { x.QuestionBatchId, x.QuestionId });
                    table.ForeignKey(
                        name: "FK_QuestionBatchMembers_QuestionBatches_QuestionBatchId",
                        column: x => x.QuestionBatchId,
                        principalTable: "QuestionBatches",
                        principalColumn: "QuestionBatchId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QuestionBatchMembers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TestSessions",
                columns: table => new
                {
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    AssignmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CandidateId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CandidateAzureAdOid = table.Column<string>(type: "VARCHAR(128)", nullable: false),
                    AttemptNumber = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    StartTime = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    EndTime = table.Column<DateTime>(type: "DATETIME2", nullable: true),
                    Status = table.Column<string>(type: "VARCHAR(20)", nullable: false, defaultValue: "Active"),
                    Score = table.Column<int>(type: "int", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TestSessions", x => x.SessionId);
                    table.ForeignKey(
                        name: "FK_TestSessions_Candidates_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "Candidates",
                        principalColumn: "CandidateId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TestSessions_TestAssignments_AssignmentId",
                        column: x => x.AssignmentId,
                        principalTable: "TestAssignments",
                        principalColumn: "AssignmentId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TestSessions_Tests_TestId",
                        column: x => x.TestId,
                        principalTable: "Tests",
                        principalColumn: "TestId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Answers",
                columns: table => new
                {
                    AnswerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SelectedOption = table.Column<string>(type: "CHAR(1)", nullable: false),
                    IdempotencyKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Answers", x => x.AnswerId);
                    table.ForeignKey(
                        name: "FK_Answers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Answers_TestSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "TestSessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditEvents",
                columns: table => new
                {
                    EventId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "VARCHAR(50)", nullable: false),
                    Payload = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "DATETIME2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditEvents", x => x.EventId);
                    table.ForeignKey(
                        name: "FK_AuditEvents_TestSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "TestSessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionQuestionMappings",
                columns: table => new
                {
                    MappingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    SessionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QuestionPosition = table.Column<int>(type: "int", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OptionMapping = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionQuestionMappings", x => x.MappingId);
                    table.ForeignKey(
                        name: "FK_SessionQuestionMappings_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "QuestionId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SessionQuestionMappings_TestSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "TestSessions",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Answers_IdempotencyKey",
                table: "Answers",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Answers_QuestionId",
                table: "Answers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_Answers_SessionId",
                table: "Answers",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Answers_SessionId_QuestionId",
                table: "Answers",
                columns: new[] { "SessionId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_SessionId_OccurredAt",
                table: "AuditEvents",
                columns: new[] { "SessionId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Batches_CreatedBy",
                table: "Batches",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_BatchMembers_CandidateId",
                table: "BatchMembers",
                column: "CandidateId");

            migrationBuilder.CreateIndex(
                name: "IX_Candidates_AzureAdOid",
                table: "Candidates",
                column: "AzureAdOid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Candidates_Email",
                table: "Candidates",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBatches_CreatedBy",
                table: "QuestionBatches",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_QuestionBatchMembers_QuestionId",
                table: "QuestionBatchMembers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_CreatedBy",
                table: "Questions",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Questions_QuestionBatchId",
                table: "Questions",
                column: "QuestionBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionQuestionMappings_QuestionId",
                table: "SessionQuestionMappings",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionQuestionMappings_SessionId_QuestionId",
                table: "SessionQuestionMappings",
                columns: new[] { "SessionId", "QuestionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SessionQuestionMappings_SessionId_QuestionPosition",
                table: "SessionQuestionMappings",
                columns: new[] { "SessionId", "QuestionPosition" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TestAssignments_BatchId",
                table: "TestAssignments",
                column: "BatchId",
                filter: "[BatchId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TestAssignments_CandidateId",
                table: "TestAssignments",
                column: "CandidateId",
                filter: "[CandidateId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_TestAssignments_QuestionBatchId",
                table: "TestAssignments",
                column: "QuestionBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_TestAssignments_Status_Deadline",
                table: "TestAssignments",
                columns: new[] { "Status", "Deadline" });

            migrationBuilder.CreateIndex(
                name: "IX_TestAssignments_TestId",
                table: "TestAssignments",
                column: "TestId");

            migrationBuilder.CreateIndex(
                name: "IX_TestSessions_AssignmentId_AttemptNumber",
                table: "TestSessions",
                columns: new[] { "AssignmentId", "AttemptNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TestSessions_CandidateId_Status",
                table: "TestSessions",
                columns: new[] { "CandidateId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TestSessions_Status_StartTime",
                table: "TestSessions",
                columns: new[] { "Status", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_TestSessions_TestId",
                table: "TestSessions",
                column: "TestId");

            migrationBuilder.CreateIndex(
                name: "IX_WebhookOutbox_Status",
                table: "WebhookOutbox",
                column: "Status",
                filter: "[Status] IN ('Pending','Failed')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Answers");

            migrationBuilder.DropTable(
                name: "AuditEvents");

            migrationBuilder.DropTable(
                name: "BatchMembers");

            migrationBuilder.DropTable(
                name: "QuestionBatchMembers");

            migrationBuilder.DropTable(
                name: "SessionQuestionMappings");

            migrationBuilder.DropTable(
                name: "WebhookOutbox");

            migrationBuilder.DropTable(
                name: "Questions");

            migrationBuilder.DropTable(
                name: "TestSessions");

            migrationBuilder.DropTable(
                name: "TestAssignments");

            migrationBuilder.DropTable(
                name: "Batches");

            migrationBuilder.DropTable(
                name: "QuestionBatches");

            migrationBuilder.DropTable(
                name: "Tests");

            migrationBuilder.DropTable(
                name: "Candidates");
        }
    }
}
