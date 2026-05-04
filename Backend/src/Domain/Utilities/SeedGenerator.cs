using System.Security.Cryptography;
using System.Text;

namespace Domain.Utilities;

/// <summary>
/// Generates deterministic seeds for randomization using SHA256.
/// Centralizes seed formula to ensure reproducibility for audits.
/// </summary>
public static class SeedGenerator
{
    /// <summary>
    /// Generates seed for question order randomization.
    /// Formula: SHA256("{candidateId}:{testId}:{attemptNumber}:{appSalt}")
    /// </summary>
    public static int ForQuestionOrder(Guid candidateId, Guid testId, int attemptNumber, string appSalt)
    {
        if (string.IsNullOrWhiteSpace(appSalt))
            throw new ArgumentException("App salt cannot be empty.", nameof(appSalt));

        if (attemptNumber <= 0)
            throw new ArgumentException("Attempt number must be positive.", nameof(attemptNumber));

        var input = $"{candidateId}:{testId}:{attemptNumber}:{appSalt}";
        return GenerateSeed(input);
    }

    /// <summary>
    /// Generates seed for option shuffle randomization.
    /// Formula: SHA256("{candidateId}:{testId}:{questionId}:{appSalt}")
    /// </summary>
    public static int ForOptionShuffle(Guid candidateId, Guid testId, Guid questionId, string appSalt)
    {
        if (string.IsNullOrWhiteSpace(appSalt))
            throw new ArgumentException("App salt cannot be empty.", nameof(appSalt));

        var input = $"{candidateId}:{testId}:{questionId}:{appSalt}";
        return GenerateSeed(input);
    }

    /// <summary>
    /// Generates a deterministic integer seed from input string using SHA256
    /// </summary>
    private static int GenerateSeed(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        
        // Take first 4 bytes and convert to int32
        return BitConverter.ToInt32(hash, 0);
    }
}
