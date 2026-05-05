using Domain.Exceptions;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.Json;

namespace Api.Middleware;

public class ExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlerMiddleware> _logger;

    public ExceptionHandlerMiddleware(RequestDelegate next, ILogger<ExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (statusCode, errorCode, message) = ex switch
        {
            ValidationException ve => (
                HttpStatusCode.BadRequest,
                "VALIDATION_ERROR",
                string.Join(", ", ve.Errors.Select(e => e.ErrorMessage))),

            ArgumentException ae => (
                HttpStatusCode.BadRequest,
                "DOMAIN_VIOLATION",
                ae.Message),

            // Subclasses of DomainException must come BEFORE DomainException
            SessionExpiredException => (
                HttpStatusCode.Gone,
                "SESSION_EXPIRED",
                ex.Message),

            MaxAttemptsExceededException => (
                HttpStatusCode.Conflict,
                "MAX_ATTEMPTS_EXCEEDED",
                ex.Message),

            InvalidTimeWindowException => (
                HttpStatusCode.Forbidden,
                "INVALID_TIME_WINDOW",
                ex.Message),

            DomainException => (
                HttpStatusCode.BadRequest,
                "DOMAIN_VIOLATION",
                ex.Message),

            UnauthorizedAccessException => (
                HttpStatusCode.Forbidden,
                "FORBIDDEN",
                "You do not have permission to perform this action."),

            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                "NOT_FOUND",
                ex.Message),

            DbUpdateConcurrencyException => (
                HttpStatusCode.Conflict,
                "CONCURRENCY_CONFLICT",
                "The resource was modified by another request. Please retry."),

            OperationCanceledException => (
                (HttpStatusCode)499,
                "REQUEST_CANCELLED",
                "Request was cancelled by the client."),

            InvalidOperationException => (
                HttpStatusCode.BadRequest,
                "DOMAIN_VIOLATION",
                ex.Message),

            _ => (
                HttpStatusCode.InternalServerError,
                "INTERNAL_ERROR",
                "An unexpected error occurred.")
        };

        // Log 5xx errors
        if ((int)statusCode >= 500)
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
        else
            _logger.LogWarning("Handled exception [{Code}]: {Message}", errorCode, ex.Message);

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var envelope = new
        {
            ok = false,
            error = new { code = errorCode, message }
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(envelope));
    }
}
