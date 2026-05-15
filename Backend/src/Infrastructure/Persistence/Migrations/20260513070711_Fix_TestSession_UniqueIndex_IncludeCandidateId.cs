using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Fix_TestSession_UniqueIndex_IncludeCandidateId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TestSessions_AssignmentId_AttemptNumber",
                table: "TestSessions");

            migrationBuilder.CreateIndex(
                name: "IX_TestSessions_AssignmentId_CandidateId_AttemptNumber",
                table: "TestSessions",
                columns: new[] { "AssignmentId", "CandidateId", "AttemptNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TestSessions_AssignmentId_CandidateId_AttemptNumber",
                table: "TestSessions");

            migrationBuilder.CreateIndex(
                name: "IX_TestSessions_AssignmentId_AttemptNumber",
                table: "TestSessions",
                columns: new[] { "AssignmentId", "AttemptNumber" },
                unique: true);
        }
    }
}
