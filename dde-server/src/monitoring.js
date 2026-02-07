/**
 * System Monitoring and Health Checks
 * Provides detailed health status and metrics for the application
 */

import os from 'os';
import { promises as fs } from 'fs';
import path from 'path';

// Track application metrics
const metrics = {
    requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {}
    },
    pipeline: {
        generated: 0,
        validated: 0,
        refined: 0,
        repaired: 0,
        codeGenerated: 0
    },
    errors: {
        total: 0,
        byType: {}
    },
    startTime: Date.now()
};

/**
 * Increment request metrics
 */
export function trackRequest(endpoint, success = true) {
    metrics.requests.total++;
    if (success) {
        metrics.requests.success++;
    } else {
        metrics.requests.errors++;
    }
    
    if (!metrics.requests.byEndpoint[endpoint]) {
        metrics.requests.byEndpoint[endpoint] = { total: 0, success: 0, errors: 0 };
    }
    metrics.requests.byEndpoint[endpoint].total++;
    if (success) {
        metrics.requests.byEndpoint[endpoint].success++;
    } else {
        metrics.requests.byEndpoint[endpoint].errors++;
    }
}

/**
 * Track pipeline operation
 */
export function trackPipelineOperation(operation) {
    const validOps = ['generated', 'validated', 'refined', 'repaired', 'codeGenerated'];
    if (validOps.includes(operation)) {
        metrics.pipeline[operation]++;
    }
}

/**
 * Track error
 */
export function trackError(errorType) {
    metrics.errors.total++;
    if (!metrics.errors.byType[errorType]) {
        metrics.errors.byType[errorType] = 0;
    }
    metrics.errors.byType[errorType]++;
}

/**
 * Get current metrics
 */
export function getMetrics() {
    const uptime = Date.now() - metrics.startTime;
    return {
        ...metrics,
        uptime: {
            ms: uptime,
            seconds: Math.floor(uptime / 1000),
            minutes: Math.floor(uptime / 60000),
            hours: Math.floor(uptime / 3600000)
        }
    };
}

/**
 * Reset metrics (useful for testing)
 */
export function resetMetrics() {
    metrics.requests.total = 0;
    metrics.requests.success = 0;
    metrics.requests.errors = 0;
    metrics.requests.byEndpoint = {};
    metrics.pipeline.generated = 0;
    metrics.pipeline.validated = 0;
    metrics.pipeline.refined = 0;
    metrics.pipeline.repaired = 0;
    metrics.pipeline.codeGenerated = 0;
    metrics.errors.total = 0;
    metrics.errors.byType = {};
}

/**
 * Check disk space
 */
async function checkDiskSpace() {
    try {
        // This is a simplified check - in production use a library like 'check-disk-space'
        const uploadDir = './uploads';
        const logDir = './logs';
        
        const uploadExists = await fs.access(uploadDir).then(() => true).catch(() => false);
        const logExists = await fs.access(logDir).then(() => true).catch(() => false);
        
        return {
            status: 'ok',
            uploadDir: uploadExists ? 'accessible' : 'not found',
            logDir: logExists ? 'accessible' : 'not found'
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

/**
 * Check memory usage
 */
function checkMemory() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;
    
    const processMemory = process.memoryUsage();
    
    return {
        status: memUsagePercent > 90 ? 'warning' : 'ok',
        system: {
            total: Math.round(totalMem / 1024 / 1024),
            used: Math.round(usedMem / 1024 / 1024),
            free: Math.round(freeMem / 1024 / 1024),
            usagePercent: Math.round(memUsagePercent * 100) / 100
        },
        process: {
            heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024),
            heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024),
            rss: Math.round(processMemory.rss / 1024 / 1024),
            external: Math.round(processMemory.external / 1024 / 1024)
        },
        unit: 'MB'
    };
}

/**
 * Check validator service
 */
async function checkValidator(validatorUrl) {
    try {
        const response = await fetch(`${validatorUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
            const data = await response.json();
            return {
                status: 'ok',
                reachable: true,
                responseTime: response.headers.get('x-response-time') || 'N/A',
                data
            };
        } else {
            return {
                status: 'degraded',
                reachable: true,
                statusCode: response.status,
                message: 'Validator returned non-200 status'
            };
        }
    } catch (error) {
        return {
            status: 'error',
            reachable: false,
            message: error.message
        };
    }
}

/**
 * Check AI service connectivity
 */
async function checkAIService(client) {
    try {
        // Simple check - you might want to make an actual test call
        if (!client) {
            return {
                status: 'error',
                configured: false,
                message: 'AI client not configured'
            };
        }
        
        return {
            status: 'ok',
            configured: true,
            message: 'AI client initialized'
        };
    } catch (error) {
        return {
            status: 'error',
            message: error.message
        };
    }
}

/**
 * Comprehensive health check
 */
export async function performHealthCheck(options = {}) {
    const { validatorUrl, aiClient, includeDetailed = false } = options;
    
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    };

    // Basic checks
    const checks = {
        memory: checkMemory(),
        disk: await checkDiskSpace()
    };

    // Check external services if URLs provided
    if (validatorUrl) {
        checks.validator = await checkValidator(validatorUrl);
    }

    if (aiClient) {
        checks.ai = await checkAIService(aiClient);
    }

    // Determine overall status
    const hasErrors = Object.values(checks).some(check => check.status === 'error');
    const hasWarnings = Object.values(checks).some(check => check.status === 'warning' || check.status === 'degraded');
    
    if (hasErrors) {
        health.status = 'error';
    } else if (hasWarnings) {
        health.status = 'degraded';
    }

    health.checks = checks;

    // Include detailed metrics if requested
    if (includeDetailed) {
        health.metrics = getMetrics();
        health.system = {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            cpus: os.cpus().length,
            loadAverage: os.loadavg()
        };
    }

    return health;
}

/**
 * Simple readiness check (for k8s/docker)
 */
export function isReady() {
    const memoryCheck = checkMemory();
    return {
        ready: memoryCheck.status !== 'error',
        timestamp: new Date().toISOString()
    };
}

/**
 * Simple liveness check (for k8s/docker)
 */
export function isAlive() {
    return {
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - metrics.startTime) / 1000)
    };
}

/**
 * Middleware to track request metrics
 */
export function metricsMiddleware(req, res, next) {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const startTime = Date.now();
    
    // Track when response finishes
    res.on('finish', () => {
        const success = res.statusCode < 400;
        trackRequest(endpoint, success);
        
        if (!success) {
            trackError(`HTTP_${res.statusCode}`);
        }
    });
    
    next();
}
