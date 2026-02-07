import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define console format (colorized for development)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => {
            const { timestamp, level, message, ...meta } = info;
            let msg = `${timestamp} [${level}]: ${message}`;
            
            // Add metadata if present
            if (Object.keys(meta).length > 0) {
                // Remove empty objects and internal Winston properties
                const cleanMeta = Object.keys(meta)
                    .filter(key => !['Symbol(level)', 'Symbol(message)', 'Symbol(splat)'].includes(key))
                    .reduce((obj, key) => {
                        if (meta[key] !== undefined && meta[key] !== null && meta[key] !== '') {
                            obj[key] = meta[key];
                        }
                        return obj;
                    }, {});
                
                if (Object.keys(cleanMeta).length > 0) {
                    msg += ` ${JSON.stringify(cleanMeta)}`;
                }
            }
            
            return msg;
        }
    )
);

// Determine log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'info';
};

// Define transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
    }),
    
    // Error log file
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    
    // Combined log file
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log'),
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    
    // HTTP requests log file
    new winston.transports.File({
        filename: path.join(__dirname, '../logs/http.log'),
        level: 'http',
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 3,
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
    exitOnError: false,
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

// Helper functions for structured logging
export const logRequest = (req, metadata = {}) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        ...metadata,
    });
};

export const logResponse = (req, res, duration, metadata = {}) => {
    logger.http('HTTP Response', {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ...metadata,
    });
};

export const logError = (error, context = {}) => {
    logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        ...context,
    });
};

export const logPipelineGeneration = (dagId, metadata = {}) => {
    logger.info('Pipeline generation', {
        dagId,
        type: 'pipeline_generation',
        ...metadata,
    });
};

export const logValidation = (dagId, isValid, errorCount, warningCount) => {
    logger.info('Pipeline validation', {
        dagId,
        type: 'validation',
        isValid,
        errorCount,
        warningCount,
    });
};

export const logRefinement = (dagId, iteration, metadata = {}) => {
    logger.info('Pipeline refinement', {
        dagId,
        iteration,
        type: 'refinement',
        ...metadata,
    });
};

export const logRepair = (dagId, iterations, success, metadata = {}) => {
    logger.info('Pipeline repair', {
        dagId,
        iterations,
        success,
        type: 'repair',
        ...metadata,
    });
};

export const logFileUpload = (filename, size, fileType, metadata = {}) => {
    logger.info('File upload', {
        filename,
        size,
        fileType,
        type: 'file_upload',
        ...metadata,
    });
};

export const logCodeGeneration = (dagId, linesOfCode, metadata = {}) => {
    logger.info('Code generation', {
        dagId,
        linesOfCode,
        type: 'code_generation',
        ...metadata,
    });
};

// Export the logger
export default logger;
