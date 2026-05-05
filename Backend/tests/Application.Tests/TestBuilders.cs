using Domain.Entities;
using Domain.Enums;

namespace Application.Tests;

/// <summary>
/// Shared builders for domain objects used across command and query tests.
/// </summary>
internal static class TestBuilders
{
    public static Candidate MakeCandidate(
        string oid = "test-oid",
        string email = "user@test.com",
        string name = "Test User",
        Role role = Role.Candidate) =>
        Candidate.Create(email, oid, name, role);

    public static TestAssignment MakeBatchAssignment(
        Guid? testId = null,
        Guid? questionBatchId = null,
        Guid? batchId = null,
        int questionCount = 40,
        int maxAttempts = 1,
        DateTime? start = null,
        DateTime? deadline = null) =>
        TestAssignment.CreateForBatch(
            testId ?? Guid.NewGuid(),
            questionBatchId ?? Guid.NewGuid(),
            batchId ?? Guid.NewGuid(),
            questionCount,
            start ?? DateTime.UtcNow.AddMinutes(-5),
            deadline ?? DateTime.UtcNow.AddHours(2),
            maxAttempts);

    public static TestAssignment MakeCandidateAssignment(
        Guid? testId = null,
        Guid? questionBatchId = null,
        Guid? candidateId = null,
        int questionCount = 40,
        int maxAttempts = 1,
        DateTime? start = null,
        DateTime? deadline = null) =>
        TestAssignment.CreateForCandidate(
            testId ?? Guid.NewGuid(),
            questionBatchId ?? Guid.NewGuid(),
            candidateId ?? Guid.NewGuid(),
            questionCount,
            start ?? DateTime.UtcNow.AddMinutes(-5),
            deadline ?? DateTime.UtcNow.AddHours(2),
            maxAttempts);

    public static Test MakeTest(int durationMinutes = 60, decimal passingScore = 70m) =>
        Test.Create("Test Title", durationMinutes, passingScore);

    public static TestSession MakeSession(
        Guid? assignmentId = null,
        Guid? candidateId = null,
        Guid? testId = null,
        string oid = "test-oid",
        int attemptNumber = 1) =>
        TestSession.Create(
            assignmentId ?? Guid.NewGuid(),
            candidateId ?? Guid.NewGuid(),
            testId ?? Guid.NewGuid(),
            oid,
            attemptNumber);

    public static Question MakeQuestion(char correctOption = 'B') =>
        Question.Create(
            "What is the answer?",
            "Option A text", "Option B text", "Option C text", "Option D text",
            correctOption,
            Guid.NewGuid());

    public static List<Guid> MakeQuestionIds(int count) =>
        Enumerable.Range(0, count).Select(_ => Guid.NewGuid()).ToList();
}
