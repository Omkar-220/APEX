using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveQuestionBatchIdFromQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Questions_QuestionBatches_QuestionBatchId",
                table: "Questions");

            migrationBuilder.DropIndex(
                name: "IX_Questions_QuestionBatchId",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "QuestionBatchId",
                table: "Questions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "QuestionBatchId",
                table: "Questions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Questions_QuestionBatchId",
                table: "Questions",
                column: "QuestionBatchId");

            migrationBuilder.AddForeignKey(
                name: "FK_Questions_QuestionBatches_QuestionBatchId",
                table: "Questions",
                column: "QuestionBatchId",
                principalTable: "QuestionBatches",
                principalColumn: "QuestionBatchId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
