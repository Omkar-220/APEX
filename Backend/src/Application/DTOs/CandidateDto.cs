namespace Application.DTOs;

public record CandidateDto(
    Guid CandidateId,
    string Email,
    string DisplayName,
    string Role
);
