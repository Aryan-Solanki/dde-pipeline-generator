/**
 * Security middleware and validators
 * Task 13: Comprehensive security implementation
 */

import { body, param, query, validationResult } from 'express-validator';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { logError } from './logger.js';

// ============================================================================
// HELMET SECURITY HEADERS
// ============================================================================

/**
 * Configure helmet for security headers
 */
export function configureHelmet() {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        frameguard: { action: 'deny' },
        noSniff: true,
        xssFilter: true
    });
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize data to prevent NoSQL injection and XSS
 */
export function configureSanitizers() {
    return [
        // Prevent NoSQL injection by removing $ and . from input
        mongoSanitize({
            replaceWith: '_',
            onSanitize: ({ req, key }) => {
                logError(new Error('Potential NoSQL injection attempt'), {
                    context: 'Input sanitization',
                    key,
                    path: req.path,
                    ip: req.ip
                });
            }
        }),
        
        // Prevent HTTP Parameter Pollution
        hpp()
    ];
}

// ============================================================================
// INPUT VALIDATION RULES
// ============================================================================

/**
 * Validate pipeline generation request
 */
export const validateGenerateRequest = [
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters')
        .matches(/^[a-zA-Z0-9\s\-_.,!?()@#$%&*+=\[\]{}:;"'\/\\\n\r°µ±×÷]+$/).withMessage('Message contains invalid characters'),
    
    body('parameters').optional().isObject().withMessage('Parameters must be an object'),
    
    body('parameters.schedule').optional()
        .trim()
        .matches(/^(@once|@hourly|@daily|@weekly|@monthly|[0-9*\s\/,\-]+)$/).withMessage('Invalid schedule format'),
    
    body('parameters.dataSource').optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Data source too long')
        .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Invalid data source format'),
    
    body('parameters.dataTarget').optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Data target too long')
        .matches(/^[a-zA-Z0-9\s\-_]+$/).withMessage('Invalid data target format'),
    
    body('parameters.tags').optional()
        .isArray({ max: 20 }).withMessage('Maximum 20 tags allowed')
        .custom((tags) => {
            return tags.every(tag => 
                typeof tag === 'string' && 
                tag.length <= 50 && 
                /^[a-z0-9\-]+$/.test(tag)
            );
        }).withMessage('Tags must be lowercase alphanumeric with hyphens, max 50 chars each')
];

/**
 * Validate refinement request
 */
export const validateRefineRequest = [
    body('current_spec')
        .notEmpty().withMessage('Current specification is required')
        .isObject().withMessage('Specification must be an object'),
    
    body('current_spec.dag_id')
        .trim()
        .notEmpty().withMessage('DAG ID is required')
        .isLength({ max: 100 }).withMessage('DAG ID too long')
        .matches(/^[a-z0-9_\-]+$/).withMessage('DAG ID must be lowercase alphanumeric with underscores/hyphens'),
    
    body('feedback')
        .trim()
        .notEmpty().withMessage('Feedback is required')
        .isLength({ min: 5, max: 2000 }).withMessage('Feedback must be between 5 and 2000 characters'),
    
    body('validation').optional().isObject().withMessage('Validation must be an object')
];

/**
 * Validate repair request
 */
export const validateRepairRequest = [
    body('current_spec')
        .notEmpty().withMessage('Current specification is required')
        .isObject().withMessage('Specification must be an object'),
    
    body('current_spec.dag_id')
        .trim()
        .notEmpty().withMessage('DAG ID is required')
        .matches(/^[a-z0-9_\-]+$/).withMessage('Invalid DAG ID format'),
    
    body('max_iterations')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage('Max iterations must be between 1 and 5')
        .toInt(),
    
    body('validation').optional().isObject().withMessage('Validation must be an object')
];

/**
 * Validate DAG validation request
 */
export const validateDAGRequest = [
    body('dag_code').optional()
        .isString().withMessage('DAG code must be a string')
        .isLength({ max: 100000 }).withMessage('DAG code too large (max 100KB)'),
    
    body('dag_spec').optional()
        .isObject().withMessage('DAG spec must be an object'),
    
    body().custom((body) => {
        if (!body.dag_code && !body.dag_spec) {
            throw new Error('Either dag_code or dag_spec is required');
        }
        return true;
    })
];

/**
 * Validate code generation request
 */
export const validateCodeGenerationRequest = [
    body('specification')
        .notEmpty().withMessage('Specification is required')
        .isObject().withMessage('Specification must be an object'),
    
    body('specification.dag_id')
        .trim()
        .notEmpty().withMessage('DAG ID is required')
        .matches(/^[a-z0-9_\-]+$/).withMessage('Invalid DAG ID format'),
    
    body('specification.tasks')
        .isArray({ min: 1, max: 100 }).withMessage('Must have 1-100 tasks')
];

/**
 * Validate file upload
 */
export const validateFileUpload = [
    // Multer handles the file validation, but we can add metadata validation
    body('fileType').optional()
        .isIn(['python', 'requirements', 'config', 'dag_spec']).withMessage('Invalid file type')
];

/**
 * Validate requirements parsing request
 */
export const validateRequirementsRequest = [
    body('content')
        .notEmpty().withMessage('Content is required')
        .isString().withMessage('Content must be a string')
        .isLength({ max: 50000 }).withMessage('Content too large (max 50KB)')
];

/**
 * Validate file deletion request
 */
export const validateFileDelete = [
    param('filename')
        .trim()
        .notEmpty().withMessage('Filename is required')
        .matches(/^[a-zA-Z0-9_\-\.]+$/).withMessage('Invalid filename format')
        .isLength({ max: 255 }).withMessage('Filename too long')
];

// ============================================================================
// VALIDATION ERROR HANDLER
// ============================================================================

/**
 * Middleware to handle validation errors
 */
export function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));
        
        logError(new Error('Input validation failed'), {
            context: 'Request validation',
            path: req.path,
            method: req.method,
            errors: errorMessages,
            ip: req.ip
        });
        
        return res.status(400).json({
            error: 'Validation failed',
            details: errorMessages
        });
    }
    
    next();
}

// ============================================================================
// REQUEST SIZE LIMITS
// ============================================================================

/**
 * Configure request size limits
 */
export const REQUEST_SIZE_LIMITS = {
    json: '10mb',      // For pipeline specs and code generation
    urlencoded: '5mb', // For form data
    fileUpload: 5 * 1024 * 1024 // 5MB for file uploads
};

// ============================================================================
// SAFE STRING UTILITIES
// ============================================================================

/**
 * Escape special characters to prevent injection
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize DAG ID to ensure it's safe
 */
export function sanitizeDAGId(dagId) {
    if (typeof dagId !== 'string') return '';
    
    return dagId
        .toLowerCase()
        .replace(/[^a-z0-9_\-]/g, '_')
        .substring(0, 100);
}

/**
 * Sanitize task ID to ensure it's safe
 */
export function sanitizeTaskId(taskId) {
    if (typeof taskId !== 'string') return '';
    
    return taskId
        .toLowerCase()
        .replace(/[^a-z0-9_\-]/g, '_')
        .substring(0, 100);
}

/**
 * Validate and sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(filePath, baseDir) {
    const path = require('path');
    
    // Normalize and resolve the path
    const normalizedPath = path.normalize(filePath);
    const resolvedPath = path.resolve(baseDir, normalizedPath);
    const resolvedBase = path.resolve(baseDir);
    
    // Ensure the resolved path is within the base directory
    if (!resolvedPath.startsWith(resolvedBase)) {
        throw new Error('Invalid file path: directory traversal detected');
    }
    
    return resolvedPath;
}

// ============================================================================
// CONTENT VALIDATION
// ============================================================================

/**
 * Validate JSON payload structure
 */
export function validateJSONStructure(data, maxDepth = 10, currentDepth = 0) {
    if (currentDepth > maxDepth) {
        throw new Error('JSON structure too deep');
    }
    
    if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        
        if (keys.length > 1000) {
            throw new Error('Too many keys in object');
        }
        
        for (const key of keys) {
            if (key.length > 100) {
                throw new Error('Key name too long');
            }
            
            validateJSONStructure(data[key], maxDepth, currentDepth + 1);
        }
    }
    
    if (Array.isArray(data)) {
        if (data.length > 1000) {
            throw new Error('Array too large');
        }
        
        for (const item of data) {
            validateJSONStructure(item, maxDepth, currentDepth + 1);
        }
    }
    
    return true;
}

/**
 * Check for malicious patterns in code/text
 */
export function checkMaliciousPatterns(text) {
    const maliciousPatterns = [
        /eval\s*\(/i,
        /exec\s*\(/i,
        /__import__\s*\(/i,
        /subprocess\./i,
        /os\.system/i,
        /\$\{.*\}/,  // Template injection
        /<script/i,  // XSS
        /javascript:/i,
        /on\w+\s*=/i // Event handlers
    ];
    
    for (const pattern of maliciousPatterns) {
        if (pattern.test(text)) {
            return {
                isSafe: false,
                reason: `Potentially malicious pattern detected: ${pattern}`
            };
        }
    }
    
    return { isSafe: true };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    configureHelmet,
    configureSanitizers,
    validateGenerateRequest,
    validateRefineRequest,
    validateRepairRequest,
    validateDAGRequest,
    validateCodeGenerationRequest,
    validateFileUpload,
    validateRequirementsRequest,
    validateFileDelete,
    handleValidationErrors,
    REQUEST_SIZE_LIMITS,
    escapeHTML,
    sanitizeDAGId,
    sanitizeTaskId,
    sanitizeFilePath,
    validateJSONStructure,
    checkMaliciousPatterns
};
