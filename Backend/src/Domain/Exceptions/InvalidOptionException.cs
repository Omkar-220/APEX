namespace Domain.Exceptions;

/// <summary>
/// Thrown when an invalid option (not A, B, C, or D) is provided for a question
/// </summary>
public class InvalidOptionException : DomainException
{
    public char ProvidedOption { get; }

    public InvalidOptionException(char providedOption)
        : base($"Invalid option '{providedOption}'. Valid options are A, B, C, or D.")
    {
        ProvidedOption = providedOption;
    }

    public InvalidOptionException(char providedOption, string message)
        : base(message)
    {
        ProvidedOption = providedOption;
    }
}
