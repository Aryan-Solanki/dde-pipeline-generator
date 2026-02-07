/**
 * Centralized Error Handling Middleware
 * Catches and formats all errors with proper logging and responses
 */

import { logError } from './logger.js';
import { AppError, isOperationalError, formatErrorForLogging } from './errors.js';

/**
 * Not found handler - catches 404s
 */
export function notFoundHandler(req, res, next) {
    const error = new AppError(`Route not found: ${req.method} ${req.path}`, 404);
    next(error);
}

/**
 * Global error handler - must be last middleware
 */
export function errorHandler(err, req, res, next) {
    // Default to 500 if no status code
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    
    // Handle specific error types
    if (err.name === 'ValidationError' && !err.statusCode) {
        statusCode = 400;
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Invalid or expired token';
    } else if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = `File too large. Maximum size is ${err.limit} bytes`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Unexpected file field';
    } else if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON in request body';
    } else if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Request entity too large';
    }

    // Log the error with context
    logError(err, {
        context: 'HTTP Error Handler',
        path: req.path,
        method: req.method,
        statusCode,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.body,
        query: req.query,
        params: req.params
    });

    // Build error response
    const errorResponse = {
        error: message,
        statusCode,
        timestamp: new Date().toISOString(),
        path: req.path
    };

    // Add additional error details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        if (err.details) errorResponse.details = err.details;
        if (err.validationErrors) errorResponse.validationErrors = err.validationErrors;
    } else {
        // Production: only include details for operational errors
        if (err instanceof AppError) {
            if (err.details) errorResponse.details = err.details;
            if (err.validationErrors) errorResponse.validationErrors = err.validationErrors;
            if (err.service) errorResponse.service = err.service;
            if (err.retryAfter) errorResponse.retryAfter = err.retryAfter;
        }
    }

    // Send error response
    res.status(statusCode).json(errorResponse);

    // For non-operational errors, consider alerting/logging to external service
    if (!isOperationalError(err) && statusCode >= 500) {
        // Here you could send to error tracking service (Sentry, etc.)
        console.error('❌ Non-operational error:', formatErrorForLogging(err));
    }
}

/**
 * Async handler wrapper - catches errors in async route handlers
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Handle process-level errors
 */
export function setupProcessErrorHandlers() {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        logError(new Error('Unhandled Promise Rejection'), {
            context: 'Process Error Handler',
            reason: reason?.toString(),
            promise: promise?.toString()
        });
        
        // Give logger time to write, then exit
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    });

    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error);
        logError(error, {
            context: 'Process Error Handler',
            type: 'Uncaught Exception'
        });
        
        // Give logger time to write, then exit
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
        process.exit(0);
    });

    process.on('SIGINT', () => {
        console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
        process.exit(0);
    });
}
