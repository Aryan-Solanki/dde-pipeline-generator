/**
 * Custom Error Classes for DDE Pipeline Generator
 * Provides structured error handling with proper status codes and context
 */

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: this.message,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
        };
    }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, 400);
        this.name = 'ValidationError';
        this.details = details;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            ...(this.details && { details: this.details })
        };
    }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
        this.resource = resource;
    }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests', retryAfter = null) {
        super(message, 429);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            ...(this.retryAfter && { retryAfter: this.retryAfter })
        };
    }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends AppError {
    constructor(service, message = 'External service unavailable') {
        super(message, 502);
        this.name = 'ExternalServiceError';
        this.service = service;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            service: this.service
        };
    }
}

/**
 * AI service error (503)
 */
export class AIServiceError extends AppError {
    constructor(message = 'AI service unavailable', context = null) {
        super(message, 503);
        this.name = 'AIServiceError';
        this.context = context;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            ...(this.context && { context: this.context })
        };
    }
}

/**
 * Pipeline validation error (422)
 */
export class PipelineValidationError extends AppError {
    constructor(message, validationErrors = []) {
        super(message, 422);
        this.name = 'PipelineValidationError';
        this.validationErrors = validationErrors;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            validationErrors: this.validationErrors
        };
    }
}

/**
 * File operation error (500)
 */
export class FileOperationError extends AppError {
    constructor(operation, filename, originalError) {
        super(`File ${operation} failed: ${filename}`, 500);
        this.name = 'FileOperationError';
        this.operation = operation;
        this.filename = filename;
        this.originalError = originalError?.message;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation,
            filename: this.filename,
            ...(this.originalError && { originalError: this.originalError })
        };
    }
}

/**
 * Timeout error (408)
 */
export class TimeoutError extends AppError {
    constructor(operation, timeoutMs) {
        super(`Operation timed out: ${operation}`, 408);
        this.name = 'TimeoutError';
        this.operation = operation;
        this.timeoutMs = timeoutMs;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            operation: this.operation,
            timeout: `${this.timeoutMs}ms`
        };
    }
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error) {
    if (error instanceof AppError) {
        return {
            name: error.name,
            message: error.message,
            statusCode: error.statusCode,
            timestamp: error.timestamp,
            stack: error.stack,
            ...(error.details && { details: error.details }),
            ...(error.service && { service: error.service }),
            ...(error.validationErrors && { validationErrors: error.validationErrors })
        };
    }

    return {
        name: error.name || 'Error',
        message: error.message,
        stack: error.stack
    };
}
