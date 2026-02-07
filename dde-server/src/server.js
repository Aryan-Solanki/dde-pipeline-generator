import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { makeUpbClient } from "./upbClient.js";
import { makeSimpleRpmLimiter } from "./rateLimit.js";
import { initSSE, sseEvent } from "./sse.js";
import { validatePipelinePrompt, getPipelineExamples } from "./promptFilter.js";
import { validatePipelineSpec } from "./pipelineSchema.js";
import { 
    PIPELINE_SYSTEM_PROMPT, 
    PIPELINE_REFINEMENT_PROMPT, 
    PIPELINE_ERROR_FIX_PROMPT,
    PIPELINE_ITERATION_PROMPT 
} from "./pipelinePrompts.js";
import logger, { 
    logRequest, 
    logResponse, 
    logError,
    logPipelineGeneration,
    logValidation,
    logRefinement,
    logRepair,
    logFileUpload,
    logCodeGeneration
} from "./logger.js";
import {
    configureHelmet,
    configureSanitizers,
    validateGenerateRequest,
    validateRefineRequest,
    validateRepairRequest,
    validateDAGRequest,
    validateCodeGenerationRequest,
    validateRequirementsRequest,
    validateFileDelete,
    handleValidationErrors,
    REQUEST_SIZE_LIMITS,
    sanitizeFilePath
} from "./security.js";
import {
    notFoundHandler,
    errorHandler,
    asyncHandler,
    setupProcessErrorHandlers
} from "./errorHandler.js";
import {
    performHealthCheck,
    isReady,
    isAlive,
    getMetrics,
    metricsMiddleware,
    trackPipelineOperation
} from "./monitoring.js";
import {
    ValidationError,
    NotFoundError,
    ExternalServiceError,
    AIServiceError,
    FileOperationError
} from "./errors.js";
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { createArtifactPackage, getPackageMetadata } from './artifactPackager.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');
dotenv.config({ path: join(rootDir, '.env') }); // Load from project root
dotenv.config(); // Also load from dde-server/.env if exists (overrides root)

const app = express();

// Security middleware - must be early in the chain
app.use(configureHelmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: REQUEST_SIZE_LIMITS.json }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_SIZE_LIMITS.urlencoded }));
app.use(...configureSanitizers());

// HTTP request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    logRequest(req);
    
    // Capture response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logResponse(req, res, duration);
    });
    
    next();
});

// Metrics tracking middleware
app.use(metricsMiddleware);

// Metrics tracking middleware
app.use(metricsMiddleware);

const PORT = Number(process.env.PORT || 5050);
const MODEL = process.env.UPB_MODEL || "gwdg.qwen3-30b-a3b-instruct-2507x";
const RPM_LIMIT = Number(process.env.RPM_LIMIT || 10);
const VALIDATOR_URL = process.env.VALIDATOR_URL || "http://localhost:5051";

const client = makeUpbClient();
const rateLimit = makeSimpleRpmLimiter({ rpmLimit: RPM_LIMIT });

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = './uploads';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (err) {
            cb(err, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { 
        fileSize: REQUEST_SIZE_LIMITS.fileUpload // 5MB limit from security config
    },
    fileFilter: (req, file, cb) => {
        // Allow only specific file types to prevent malicious uploads
        const allowedExts = ['.py', '.txt', '.json', '.yaml', '.yml', '.csv', '.sql', '.md'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Additional filename validation
        const filename = file.originalname;
        if (filename.length > 255 || !/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
            return cb(new Error('Invalid filename. Use only alphanumeric characters, underscores, hyphens, and dots.'));
        }
        
        if (allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} not allowed. Allowed: ${allowedExts.join(', ')}`));
        }
    }
});


// Root
app.get("/", (req, res) => {
    res.send("DDE Server is running. Use /api/health to check status.");
});

// API Documentation
app.get("/api-docs/swagger.json", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DDE API Documentation',
    customfavIcon: '/favicon.ico'
}));

// Health endpoints
app.get("/api/health", asyncHandler(async (req, res) => {
    const detailed = req.query.detailed === 'true';
    const health = await performHealthCheck({
        validatorUrl: VALIDATOR_URL,
        aiClient: client,
        includeDetailed: detailed
    });
    
    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(health);
}));

// Kubernetes/Docker readiness probe
app.get("/api/health/ready", (req, res) => {
    const readiness = isReady();
    res.status(readiness.ready ? 200 : 503).json(readiness);
});

// Kubernetes/Docker liveness probe
app.get("/api/health/live", (req, res) => {
    const liveness = isAlive();
    res.json(liveness);
});

// Metrics endpoint
app.get("/api/metrics", (req, res) => {
    const metrics = getMetrics();
    res.json(metrics);
});

// Pipeline examples
app.get("/api/pipeline/examples", (req, res) => {
    res.json(getPipelineExamples());
});

// Models
app.get("/api/models", rateLimit, async (req, res) => {
    try {
        const models = await client.models.list();
        res.json(models);
    } catch (err) {
        res.status(500).json({ error: err?.message ?? "Failed to fetch models" });
    }
});

// Non-stream chat (easy first test)
app.post("/api/chat", rateLimit, validatePipelinePrompt, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message?.trim()) return res.status(400).json({ error: "message is required" });

        const out = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "developer", content: PIPELINE_SYSTEM_PROMPT },
                { role: "user", content: message },
            ],
            temperature: 0.7,
        });

        const reply = out.choices?.[0]?.message?.content ?? "";
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: err?.message ?? "Chat failed" });
    }
});

// Streaming chat (SSE)
app.post("/api/chat/stream", rateLimit, validatePipelinePrompt, async (req, res) => {
    initSSE(res);

    try {
        const { message } = req.body;
        if (!message?.trim()) {
            sseEvent(res, "error", { error: "message is required" });
            return res.end();
        }

        const stream = await client.chat.completions.create({
            model: MODEL,
            stream: true,
            messages: [
                { role: "developer", content: PIPELINE_SYSTEM_PROMPT },
                { role: "user", content: message },
            ],
            temperature: 0.7,
        });

        for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) sseEvent(res, "delta", { delta });
        }

        sseEvent(res, "done", {});
        res.end();
    } catch (err) {
        sseEvent(res, "error", { error: err?.message ?? "Stream failed" });
        res.end();
    }
});

// Generate pipeline specification (non-streaming)
app.post("/api/pipeline/generate", 
    rateLimit,
    upload.single('file'), // Handle optional file upload
    validatePipelinePrompt, 
    validateGenerateRequest,
    handleValidationErrors,
    async (req, res) => {
    try {
        // Handle both JSON and multipart/form-data
        let message, parameters;
        
        if (req.file) {
            // File uploaded - data comes from form
            message = req.body.message;
            parameters = req.body.parameters ? JSON.parse(req.body.parameters) : undefined;
        } else {
            // No file - regular JSON request
            message = req.body.message;
            parameters = req.body.parameters;
        }

        // Enhance prompt with parameters if provided
        let enhancedPrompt = message;
        if (parameters) {
            const { schedule, dataSource, dataTarget, tags } = parameters;
            enhancedPrompt += `\n\nAdditional Requirements:`;
            if (schedule) enhancedPrompt += `\n- Schedule: ${schedule}`;
            if (dataSource) enhancedPrompt += `\n- Data Source: ${dataSource}`;
            if (dataTarget) enhancedPrompt += `\n- Data Target: ${dataTarget}`;
            if (tags) enhancedPrompt += `\n- Tags: ${tags.join(', ')}`;
        }

        // If file is uploaded, read its content and add to prompt
        if (req.file) {
            try {
                const fileContent = await fs.readFile(req.file.path, 'utf-8');
                enhancedPrompt += `\n\nReference File (${req.file.originalname}):\n\`\`\`\n${fileContent.substring(0, 5000)}\n\`\`\``;
                
                logger.info('Using uploaded reference file', {
                    filename: req.file.originalname,
                    size: req.file.size,
                    contentPreview: fileContent.substring(0, 100)
                });
                
                // Clean up uploaded file after reading
                await fs.unlink(req.file.path).catch(err => 
                    logger.warn('Failed to delete temp file', { path: req.file.path, error: err.message })
                );
            } catch (fileErr) {
                logger.error('Error reading uploaded file', { 
                    error: fileErr.message,
                    filename: req.file.originalname 
                });
                // Continue without file content rather than failing
            }
        }

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "developer", content: PIPELINE_SYSTEM_PROMPT },
                { role: "user", content: enhancedPrompt },
            ],
            temperature: 0.7,
        });

        const content = response.choices?.[0]?.message?.content ?? "";
        
        // Try to parse JSON from response
        let pipelineSpec;
        try {
            // Remove markdown code blocks if present
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            pipelineSpec = JSON.parse(cleaned);
        } catch (parseErr) {
            logError(parseErr, { 
                context: 'Pipeline generation JSON parsing',
                prompt: message.substring(0, 100),
                response_length: content.length
            });
            return res.status(500).json({ 
                error: "Failed to generate valid pipeline specification",
                raw_response: content.substring(0, 500)
            });
        }

        // Log successful pipeline generation
        logPipelineGeneration(pipelineSpec.dag_id || 'unknown', {
            description: message.substring(0, 100),
            task_count: pipelineSpec.tasks?.length || 0,
            has_schedule: !!pipelineSpec.schedule_interval,
            parameters: parameters || {}
        });

        // Validate the generated spec
        const validation = validatePipelineSpec(pipelineSpec);

        // Call Python validator for deep validation
        let pythonValidation = null;
        try {
            const validatorResponse = await fetch(`${VALIDATOR_URL}/validate/dag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dag_spec: pipelineSpec })
            });
            
            if (validatorResponse.ok) {
                pythonValidation = await validatorResponse.json();
            } else {
                logger.warn('Python validator returned error', { 
                    status: validatorResponse.status,
                    dag_id: pipelineSpec.dag_id 
                });
            }
        } catch (validatorErr) {
            logger.warn('Could not reach Python validator', { 
                error: validatorErr.message,
                dag_id: pipelineSpec.dag_id 
            });
            // Continue without Python validation - it's optional for now
        }

        // Log validation results
        const allErrors = [...(validation.errors || []), ...(pythonValidation?.errors || [])];
        const allWarnings = [...(validation.warnings || []), ...(pythonValidation?.warnings || [])];
        
        logValidation(
            pipelineSpec.dag_id,
            validation.valid && (pythonValidation?.valid !== false),
            allErrors.length,
            allWarnings.length
        );
        
        logValidation(
            pipelineSpec.dag_id,
            validation.valid && (pythonValidation?.valid !== false),
            allErrors.length,
            allWarnings.length
        );

        res.json({
            specification: pipelineSpec,
            validation: {
                schema_validation: validation,
                python_validation: pythonValidation
            },
            metadata: {
                generated_at: new Date().toISOString(),
                model: MODEL
            }
        });

        trackPipelineOperation('generated');

    } catch (err) {
        logError(err, { 
            context: 'Pipeline generation',
            message: req.body?.message?.substring(0, 100)
        });
        throw new AIServiceError('Pipeline generation failed', err.message);
    }
});

// Refine pipeline specification based on user feedback
app.post("/api/pipeline/refine-spec",
    rateLimit,
    async (req, res) => {
    try {
        const { current_spec, user_feedback } = req.body;

        if (!current_spec) {
            return res.status(400).json({ error: "current_spec is required" });
        }

        if (!user_feedback || typeof user_feedback !== 'string' || user_feedback.trim().length === 0) {
            return res.status(400).json({ error: "user_feedback is required and must be a non-empty string" });
        }

        logger.info('Refining pipeline specification', {
            dag_id: current_spec.dag_id,
            feedback_length: user_feedback.length
        });

        // Create refinement prompt
        const refinementPrompt = `Current DAG Specification:
\`\`\`json
${JSON.stringify(current_spec, null, 2)}
\`\`\`

User Requested Changes:
${user_feedback}

Please modify the DAG specification according to the user's feedback. Keep all existing structure and only change what the user requested. Return ONLY the complete updated JSON specification, no explanations.`;

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "developer", content: PIPELINE_SYSTEM_PROMPT },
                { role: "user", content: refinementPrompt }
            ],
            temperature: 0.6,
        });

        const content = response.choices?.[0]?.message?.content ?? "";
        
        // Parse JSON from response
        let refinedSpec;
        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            refinedSpec = JSON.parse(cleaned);
        } catch (parseErr) {
            logError(parseErr, { 
                context: 'Spec refinement JSON parsing',
                feedback: user_feedback.substring(0, 100)
            });
            return res.status(500).json({ 
                error: "Failed to generate valid refined specification",
                raw_response: content.substring(0, 500)
            });
        }

        // Validate the refined spec
        const validation = validatePipelineSpec(refinedSpec);

        // Call Python validator
        let pythonValidation = null;
        try {
            const validatorResponse = await fetch(`${VALIDATOR_URL}/validate/dag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dag_spec: refinedSpec })
            });
            
            if (validatorResponse.ok) {
                pythonValidation = await validatorResponse.json();
            }
        } catch (validatorErr) {
            logger.warn('Python validator unavailable during refinement', { 
                error: validatorErr.message 
            });
        }

        logRefinement(refinedSpec.dag_id, {
            feedback: user_feedback.substring(0, 200),
            changes_made: true,
            validation_passed: validation.valid && (pythonValidation?.valid !== false)
        });

        res.json({
            specification: refinedSpec,
            validation: {
                schema_validation: validation,
                python_validation: pythonValidation
            },
            metadata: {
                refined_at: new Date().toISOString(),
                user_feedback: user_feedback.substring(0, 200),
                model: MODEL
            }
        });

    } catch (err) {
        logError(err, { 
            context: 'Specification refinement',
            feedback: req.body?.user_feedback?.substring(0, 100)
        });
        throw new AIServiceError('Specification refinement failed', err.message);
    }
});

// Refine generated Python code based on user feedback
app.post("/api/pipeline/refine-code",
    rateLimit,
    async (req, res) => {
    try {
        const { current_code, current_spec, user_feedback } = req.body;

        if (!current_code) {
            return res.status(400).json({ error: "current_code is required" });
        }

        if (!user_feedback || typeof user_feedback !== 'string' || user_feedback.trim().length === 0) {
            return res.status(400).json({ error: "user_feedback is required and must be a non-empty string" });
        }

        logger.info('Refining pipeline code', {
            dag_id: current_spec?.dag_id || 'unknown',
            feedback_length: user_feedback.length,
            code_length: current_code.length
        });

        // Create code refinement prompt
        const codeRefinementPrompt = `Current DAG Python Code:
\`\`\`python
${current_code}
\`\`\`

${current_spec ? `\nOriginal Specification:\n\`\`\`json\n${JSON.stringify(current_spec, null, 2)}\n\`\`\`\n` : ''}

User Requested Changes:
${user_feedback}

Please modify the Python code according to the user's feedback. Maintain all Airflow best practices, proper imports, and code structure. Return ONLY the complete updated Python code, no explanations.`;

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "developer", content: "You are an expert Airflow DAG developer. Generate clean, production-ready Python code following Airflow best practices." },
                { role: "user", content: codeRefinementPrompt }
            ],
            temperature: 0.5,
        });

        const content = response.choices?.[0]?.message?.content ?? "";
        
        // Extract Python code from response
        let refinedCode = content;
        const pythonMatch = content.match(/```python\n([\s\S]*?)\n```/);
        if (pythonMatch) {
            refinedCode = pythonMatch[1].trim();
        } else {
            refinedCode = content.replace(/```\n?/g, '').trim();
        }

        // Validate the refined code with Python validator
        let validationResult = null;
        try {
            const validatorResponse = await fetch(`${VALIDATOR_URL}/validate/dag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dag_code: refinedCode })
            });
            
            if (validatorResponse.ok) {
                validationResult = await validatorResponse.json();
            }
        } catch (validatorErr) {
            logger.warn('Python validator unavailable during code refinement', { 
                error: validatorErr.message 
            });
        }

        logCodeGeneration(current_spec?.dag_id || 'unknown', {
            feedback: user_feedback.substring(0, 200),
            code_length: refinedCode.length,
            validation_passed: validationResult?.valid !== false,
            refinement: true
        });

        res.json({
            code: refinedCode,
            validation: validationResult,
            metadata: {
                refined_at: new Date().toISOString(),
                user_feedback: user_feedback.substring(0, 200),
                code_lines: refinedCode.split('\n').length,
                model: MODEL
            }
        });

    } catch (err) {
        logError(err, { 
            context: 'Code refinement',
            feedback: req.body?.user_feedback?.substring(0, 100)
        });
        throw new AIServiceError('Code refinement failed', err.message);
    }
});

// Validate DAG endpoint - proxies to Python validator
app.post("/api/pipeline/validate", 
    validateDAGRequest,
    handleValidationErrors,
    async (req, res) => {
    try {
        const { dag_code, dag_spec } = req.body;
        
        if (!dag_code && !dag_spec) {
            return res.status(400).json({ error: "Either dag_code or dag_spec is required" });
        }

        const validatorResponse = await fetch(`${VALIDATOR_URL}/validate/dag`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dag_code, dag_spec })
        });

        const validationResult = await validatorResponse.json();
        
        // Log validation results
        logValidation(
            dag_spec?.dag_id || 'code_validation',
            validationResult.valid,
            validationResult.errors?.length || 0,
            validationResult.warnings?.length || 0
        );

        trackPipelineOperation('validated');
        res.status(validatorResponse.status).json(validationResult);

    } catch (err) {
        logError(err, { 
            context: 'DAG validation',
            has_code: !!req.body?.dag_code,
            has_spec: !!req.body?.dag_spec
        });
        throw new ExternalServiceError('Validator', 'Validation service unavailable');
    }
});

// Refine pipeline with user feedback
app.post("/api/pipeline/refine", 
    rateLimit, 
    validateRefineRequest,
    handleValidationErrors,
    async (req, res) => {
    try {
        const { current_spec, feedback, validation } = req.body;
        
        if (!current_spec) {
            return res.status(400).json({ error: "current_spec is required" });
        }
        
        if (!feedback || !feedback.trim()) {
            return res.status(400).json({ error: "feedback is required" });
        }

        // Format validation errors and warnings for the prompt
        const errors = validation?.errors || [];
        const warnings = validation?.warnings || [];
        
        const errorText = errors.length > 0 
            ? errors.map(e => typeof e === 'string' ? e : `[${e.type}] ${e.message}${e.field ? ` (${e.field})` : ''}`).join('\n')
            : 'None';
            
        const warningText = warnings.length > 0
            ? warnings.map(w => typeof w === 'string' ? w : `[${w.type}] ${w.message}${w.field ? ` (${w.field})` : ''}`).join('\n')
            : 'None';

        // Build refinement prompt
        const refinementPrompt = PIPELINE_REFINEMENT_PROMPT
            .replace('{current_spec}', JSON.stringify(current_spec, null, 2))
            .replace('{feedback}', feedback)
            .replace('{validation_errors}', errorText)
            .replace('{validation_warnings}', warningText);

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "developer", content: PIPELINE_SYSTEM_PROMPT },
                { role: "user", content: refinementPrompt }
            ],
            temperature: 0.7,
        });

        const content = response.choices?.[0]?.message?.content ?? "";
        
        // Parse JSON from response
        let refinedSpec;
        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            refinedSpec = JSON.parse(cleaned);
        } catch (parseErr) {
            logError(parseErr, { 
                context: 'Pipeline refinement JSON parsing',
                dag_id: current_spec.dag_id,
                feedback: feedback.substring(0, 100)
            });
            return res.status(500).json({ 
                error: "Failed to generate valid refined specification",
                raw_response: content.substring(0, 500)
            });
        }

        // Validate the refined spec
        const schemaValidation = validatePipelineSpec(refinedSpec);
        
        // Call Python validator
        let pythonValidation = null;
        try {
            const validatorResponse = await fetch(`${VALIDATOR_URL}/validate/dag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dag_spec: refinedSpec })
            });
            
            if (validatorResponse.ok) {
                pythonValidation = await validatorResponse.json();
            }
        } catch (validatorErr) {
            logger.warn('Could not reach Python validator during refinement', { 
                error: validatorErr.message,
                dag_id: refinedSpec.dag_id 
            });
        }

        // Log refinement operation
        logRefinement(refinedSpec.dag_id, 1, {
            feedback_length: feedback.length,
            original_errors: errors.length,
            original_warnings: warnings.length,
            new_errors: pythonValidation?.errors?.length || 0,
            new_warnings: pythonValidation?.warnings?.length || 0,
            is_valid: schemaValidation.valid && (pythonValidation?.valid !== false)
        });

        res.json({
            specification: refinedSpec,
            validation: {
                schema_validation: schemaValidation,
                python_validation: pythonValidation
            },
            metadata: {
                refined_at: new Date().toISOString(),
                model: MODEL,
                original_errors: errors.length,
                original_warnings: warnings.length
            }
        });

        trackPipelineOperation('refined');

    } catch (err) {
        logError(err, { 
            context: 'Pipeline refinement',
            dag_id: req.body?.current_spec?.dag_id,
            feedback: req.body?.feedback?.substring(0, 100)
        });
        throw new AIServiceError('Pipeline refinement failed', err.message);
    }
});

// Auto-fix validation errors
app.post("/api/pipeline/fix", rateLimit, async (req, res) => {
    try {
        const { current_spec, validation } = req.body;
        
        if (!current_spec) {
            return res.status(400).json({ error: "current_spec is required" });
        }

        const errors = validation?.errors || [];
        const warnings = validation?.warnings || [];
        
        if (errors.length === 0) {
            return res.status(400).json({ error: "No errors to fix" });
        }

        console.log('[Fix] Auto-fixing', errors.length, 'validation errors');

        const errorText = errors.map(e => 
            typeof e === 'string' ? e : `[${e.type}] ${e.message}${e.field ? ` (${e.field})` : ''}${e.line ? ` at line ${e.line}` : ''}`
        ).join('\n');
        
        const warningText = warnings.map(w => 
            typeof w === 'string' ? w : `[${w.type}] ${w.message}${w.field ? ` (${w.field})` : ''}`
        ).join('\n');

        const fixPrompt = PIPELINE_ERROR_FIX_PROMPT
            .replace('{current_spec}', JSON.stringify(current_spec, null, 2))
            .replace('{validation_errors}', errorText)
            .replace('{validation_warnings}', warningText || 'None');

        const response = await client.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "developer", content: PIPELINE_SYSTEM_PROMPT },
                { role: "user", content: fixPrompt }
            ],
            temperature: 0.5, // Lower temperature for more deterministic fixes
        });

        const content = response.choices?.[0]?.message?.content ?? "";
        
        let fixedSpec;
        try {
            const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            fixedSpec = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('[Fix] Failed to parse JSON:', parseErr);
            return res.status(500).json({ 
                error: "Failed to generate valid fixed specification",
                raw_response: content.substring(0, 500)
            });
        }

        // Validate the fixed spec
        const schemaValidation = validatePipelineSpec(fixedSpec);
        
        let pythonValidation = null;
        try {
            const validatorResponse = await fetch(`${VALIDATOR_URL}/validate/dag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dag_spec: fixedSpec })
            });
            
            if (validatorResponse.ok) {
                pythonValidation = await validatorResponse.json();
            }
        } catch (validatorErr) {
            console.warn('[Fix] Could not reach Python validator:', validatorErr.message);
        }

        const newErrors = pythonValidation?.errors || schemaValidation.errors || [];
        const fixSuccess = newErrors.length < errors.length;

        console.log('[Fix] Fix complete. Errors reduced:', errors.length, '→', newErrors.length);

        res.json({
            specification: fixedSpec,
            validation: {
                schema_validation: schemaValidation,
                python_validation: pythonValidation
            },
            metadata: {
                fixed_at: new Date().toISOString(),
                model: MODEL,
                original_errors: errors.length,
                remaining_errors: newErrors.length,
                fix_success: fixSuccess
            }
        });

    } catch (err) {
        console.error('[Fix] Error:', err);
        res.status(500).json({ error: err?.message ?? "Auto-fix failed" });
    }
});

// Repair loop orchestration - automatically attempts to fix errors iteratively
app.post("/api/pipeline/repair", 
    rateLimit, 
    validateRepairRequest,
    handleValidationErrors,
    async (req, res) => {
    try {
        const { current_spec, max_iterations = 3 } = req.body;

        if (!current_spec) {
            return res.status(400).json({ error: "current_spec is required" });
        }

        if (max_iterations < 1 || max_iterations > 5) {
            return res.status(400).json({ error: "max_iterations must be between 1 and 5" });
        }

        console.log('[Repair] Starting repair loop with max iterations:', max_iterations);

        let currentSpec = current_spec;
        const iterations = [];
        let finalValidation = null;

        // Validate initial spec
        let schemaValidation = validatePipelineSpec(currentSpec);
        let pythonValidation = null;

        try {
            const validatorResponse = await fetch(`${VALIDATOR_URL}/validate/dag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dag_spec: currentSpec })
            });
            
            if (validatorResponse.ok) {
                pythonValidation = await validatorResponse.json();
            }
        } catch (validatorErr) {
            console.warn('[Repair] Could not reach Python validator:', validatorErr.message);
        }

        let currentErrors = [
            ...(schemaValidation.errors || []),
            ...(pythonValidation?.errors || [])
        ];

        // Record initial state
        iterations.push({
            iteration: 0,
            errors: currentErrors.length,
            warnings: (pythonValidation?.warnings || []).length,
            status: 'initial',
            timestamp: new Date().toISOString()
        });

        console.log('[Repair] Initial errors:', currentErrors.length);

        // If no errors, return immediately
        if (currentErrors.length === 0) {
            console.log('[Repair] No errors found, returning original spec');
            return res.json({
                specification: currentSpec,
                validation: {
                    schema_validation: schemaValidation,
                    python_validation: pythonValidation
                },
                iterations,
                metadata: {
                    repair_needed: false,
                    iterations_performed: 0,
                    final_error_count: 0,
                    repaired_at: new Date().toISOString()
                }
            });
        }

        // Repair loop
        for (let i = 1; i <= max_iterations; i++) {
            console.log(`[Repair] Iteration ${i}/${max_iterations} - Attempting to fix ${currentErrors.length} errors`);

            // Format errors for the prompt
            const errorMessages = currentErrors.map((err, idx) => {
                if (typeof err === 'string') {
                    return `${idx + 1}. ${err}`;
                }
                const field = err.field ? ` (${err.field})` : '';
                const line = err.line ? ` at line ${err.line}` : '';
                return `${idx + 1}. [${err.type}] ${err.message}${field}${line}`;
            }).join('\n');

            // Use the fix prompt
            const fixPrompt = PIPELINE_ERROR_FIX_PROMPT
                .replace('{current_spec}', JSON.stringify(currentSpec, null, 2))
                .replace('{errors}', errorMessages);

            // Call AI to fix errors
            const response = await client.chat.completions.create({
                model: MODEL,
                messages: [
                    { role: "developer", content: PIPELINE_SYSTEM_PROMPT },
                    { role: "user", content: fixPrompt }
                ],
                temperature: 0.5, // Lower temperature for more deterministic fixes
            });

            const content = response.choices?.[0]?.message?.content ?? "";
            
            // Parse fixed spec
            let fixedSpec;
            try {
                const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                fixedSpec = JSON.parse(cleaned);
            } catch (parseErr) {
                console.error(`[Repair] Iteration ${i} - Failed to parse JSON:`, parseErr);
                iterations.push({
                    iteration: i,
                    status: 'parse_error',
                    error: 'Failed to parse AI response',
                    timestamp: new Date().toISOString()
                });
                break; // Stop repair loop on parse error
            }

            // Validate fixed spec
            schemaValidation = validatePipelineSpec(fixedSpec);
            pythonValidation = null;

            try {
                const validatorResponse = await fetch(`${VALIDATOR_URL}/validate/dag`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dag_spec: fixedSpec })
                });
                
                if (validatorResponse.ok) {
                    pythonValidation = await validatorResponse.json();
                }
            } catch (validatorErr) {
                console.warn(`[Repair] Iteration ${i} - Could not reach Python validator:`, validatorErr.message);
            }

            const newErrors = [
                ...(schemaValidation.errors || []),
                ...(pythonValidation?.errors || [])
            ];

            const errorReduction = currentErrors.length - newErrors.length;
            
            iterations.push({
                iteration: i,
                errors: newErrors.length,
                warnings: (pythonValidation?.warnings || []).length,
                error_reduction: errorReduction,
                status: errorReduction > 0 ? 'improved' : (errorReduction === 0 ? 'no_change' : 'regressed'),
                timestamp: new Date().toISOString()
            });

            console.log(`[Repair] Iteration ${i} - Errors: ${currentErrors.length} → ${newErrors.length} (${errorReduction >= 0 ? '+' : ''}${errorReduction})`);

            // Update current spec and errors
            currentSpec = fixedSpec;
            finalValidation = {
                schema_validation: schemaValidation,
                python_validation: pythonValidation
            };

            // Check if we've fixed all errors
            if (newErrors.length === 0) {
                console.log(`[Repair] All errors fixed in ${i} iteration(s)!`);
                break;
            }

            // Check if no progress was made
            if (errorReduction <= 0) {
                console.log(`[Repair] No progress in iteration ${i}, stopping repair loop`);
                break;
            }

            // Update errors for next iteration
            currentErrors = newErrors;
        }

        const finalErrorCount = finalValidation 
            ? [...(finalValidation.schema_validation?.errors || []), ...(finalValidation.python_validation?.errors || [])]
            : currentErrors;

        // Log repair completion
        logRepair(currentSpec.dag_id, iterations.length - 1, finalErrorCount.length === 0, {
            initial_errors: iterations[0].errors,
            final_errors: finalErrorCount.length,
            max_iterations,
            improvements: iterations.filter(i => i.status === 'improved').length
        });

        res.json({
            specification: currentSpec,
            validation: finalValidation,
            iterations,
            metadata: {
                repair_needed: true,
                iterations_performed: iterations.length - 1, // Exclude initial state
                initial_errors: iterations[0].errors,
                final_error_count: finalErrorCount.length,
                fully_repaired: finalErrorCount.length === 0,
                repaired_at: new Date().toISOString(),
                model: MODEL
            }
        });

        trackPipelineOperation('repaired');

    } catch (err) {
        logError(err, { 
            context: 'Repair loop',
            dag_id: req.body?.current_spec?.dag_id,
            max_iterations: req.body?.max_iterations
        });
        throw new AIServiceError('Repair loop failed', err.message);
    }
});

// File upload endpoint - single file
app.post("/api/files/upload", upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.file;

        // Read file content
        const content = await fs.readFile(file.path, 'utf-8');
        const ext = path.extname(file.originalname).toLowerCase();

        let analysis = {
            filename: file.originalname,
            size: file.size,
            type: ext,
            uploadedAt: new Date().toISOString()
        };

        // Analyze based on file type
        if (ext === '.py') {
            // Python DAG file
            analysis.fileType = 'python_dag';
            analysis.lines = content.split('\n').length;
            
            // Check for Airflow imports
            const hasAirflowImports = /from airflow|import airflow/i.test(content);
            const hasDagDefinition = /DAG\s*\(/i.test(content);
            const hasOperators = /Operator\s*\(/i.test(content);
            
            analysis.airflowDetected = hasAirflowImports;
            analysis.dagDefinitionFound = hasDagDefinition;
            analysis.operatorsFound = hasOperators;
            
            // Extract potential DAG ID
            const dagIdMatch = content.match(/dag_id\s*=\s*['"]([^'"]+)['"]/);
            if (dagIdMatch) {
                analysis.dagId = dagIdMatch[1];
            }

        } else if (ext === '.txt' && file.originalname.toLowerCase().includes('requirement')) {
            // Requirements file
            analysis.fileType = 'requirements';
            const packages = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
            
            analysis.packageCount = packages.length;
            analysis.packages = packages.slice(0, 20); // First 20 packages
            
            // Check for Airflow
            const hasAirflow = packages.some(pkg => pkg.toLowerCase().includes('apache-airflow'));
            analysis.airflowIncluded = hasAirflow;

        } else if (['.json', '.yaml', '.yml'].includes(ext)) {
            // Configuration file
            analysis.fileType = 'config';
            analysis.lines = content.split('\n').length;
            
            if (ext === '.json') {
                try {
                    const parsed = JSON.parse(content);
                    analysis.validJson = true;
                    analysis.keys = Object.keys(parsed);
                } catch (e) {
                    analysis.validJson = false;
                    analysis.parseError = e.message;
                }
            }
        }

        // Store file metadata
        analysis.storedPath = file.path;
        analysis.content = content.substring(0, 1000); // First 1000 chars for preview

        // Log file upload
        logFileUpload(file.originalname, file.size, analysis.fileType || ext, {
            lines: analysis.lines,
            airflow_detected: analysis.airflowDetected,
            dag_id: analysis.dagId
        });

        res.json({
            success: true,
            file: analysis
        });

    } catch (err) {
        logError(err, { 
            context: 'File upload',
            filename: req.file?.originalname
        });
        res.status(500).json({ error: err?.message ?? "File upload failed" });
    }
});

// Multiple file upload endpoint
app.post("/api/files/upload-multiple", upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        console.log(`[Upload] ${req.files.length} files received`);

        const processedFiles = await Promise.all(req.files.map(async (file) => {
            const content = await fs.readFile(file.path, 'utf-8');
            const ext = path.extname(file.originalname).toLowerCase();

            return {
                filename: file.originalname,
                size: file.size,
                type: ext,
                storedPath: file.path,
                uploadedAt: new Date().toISOString()
            };
        }));

        res.json({
            success: true,
            filesCount: processedFiles.length,
            files: processedFiles
        });

    } catch (err) {
        console.error('[Upload Multiple] Error:', err);
        res.status(500).json({ error: err?.message ?? "Multiple file upload failed" });
    }
});

// Parse requirements.txt endpoint
app.post("/api/files/parse-requirements", 
    validateRequirementsRequest,
    handleValidationErrors,
    async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: "content is required" });
        }

        const lines = content.split('\n');
        const packages = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) continue;
            
            // Parse package name and version
            const match = trimmed.match(/^([a-zA-Z0-9_-]+)([><=!~]+.*)?$/);
            if (match) {
                packages.push({
                    name: match[1],
                    version: match[2] ? match[2].trim() : null,
                    raw: trimmed
                });
            }
        }

        // Check for Airflow and common dependencies
        const airflowPackages = packages.filter(pkg => 
            pkg.name.toLowerCase().includes('airflow')
        );
        
        const commonDependencies = {
            pandas: packages.some(pkg => pkg.name === 'pandas'),
            numpy: packages.some(pkg => pkg.name === 'numpy'),
            requests: packages.some(pkg => pkg.name === 'requests'),
            sqlalchemy: packages.some(pkg => pkg.name.toLowerCase().includes('sqlalchemy'))
        };

        res.json({
            success: true,
            totalPackages: packages.length,
            packages,
            airflowPackages,
            commonDependencies
        });

    } catch (err) {
        console.error('[Parse Requirements] Error:', err);
        res.status(500).json({ error: err?.message ?? "Failed to parse requirements" });
    }
});

// Delete uploaded file endpoint
app.delete("/api/files/:filename", 
    validateFileDelete,
    handleValidationErrors,
    async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Use secure file path validation
        const filePath = sanitizeFilePath(filename, './uploads');

        await fs.unlink(filePath);
        logger.info('File deleted', { filename });

        res.json({ success: true, message: "File deleted" });

    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ error: "File not found" });
        }
        if (err.message && err.message.includes('directory traversal')) {
            return res.status(403).json({ error: "Invalid file path" });
        }
        logError(err, { context: 'File deletion', filename: req.params.filename });
        res.status(500).json({ error: err?.message ?? "Failed to delete file" });
    }
});

// Generate DAG Python code from specification
app.post("/api/pipeline/generate-code", 
    validateCodeGenerationRequest,
    handleValidationErrors,
    async (req, res) => {
    try {
        const { specification } = req.body;
        
        if (!specification) {
            return res.status(400).json({ error: "specification is required" });
        }

        // Call Python DAG generator via subprocess
        const { spawn } = await import('child_process');
        
        return new Promise((resolve, reject) => {
            // Determine Python path
            const pythonPath = process.platform === 'win32' 
                ? path.join('..', 'dde-validator', 'venv', 'Scripts', 'python.exe')
                : path.join('..', 'dde-validator', 'venv', 'bin', 'python');
            
            const scriptPath = path.join('..', 'dde-validator', 'dag_generator.py');
            
            const proc = spawn(pythonPath, ['-c', `
import sys
import json
from dag_generator import generate_dag_code

spec = json.loads(sys.stdin.read())
code = generate_dag_code(spec)
print(code)
`]);

            let stdout = '';
            let stderr = '';

            proc.stdin.write(JSON.stringify(specification));
            proc.stdin.end();

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            proc.on('close', (code) => {
                if (code !== 0) {
                    logError(new Error('Python DAG generation failed'), {
                        context: 'Code generation subprocess',
                        dag_id: specification.dag_id,
                        stderr: stderr.substring(0, 500)
                    });
                    return res.status(500).json({ 
                        error: "Failed to generate DAG code",
                        details: stderr
                    });
                }

                const linesOfCode = stdout.split('\n').length;

                // Log successful code generation
                logCodeGeneration(specification.dag_id, linesOfCode, {
                    task_count: specification.tasks?.length || 0,
                    filename: `${specification.dag_id}.py`
                });

                trackPipelineOperation('codeGenerated');

                res.json({
                    success: true,
                    code: stdout,
                    filename: `${specification.dag_id}.py`,
                    metadata: {
                        dag_id: specification.dag_id,
                        generated_at: new Date().toISOString(),
                        lines: linesOfCode
                    }
                });
            });

            proc.on('error', (err) => {
                logError(err, {
                    context: 'Code generation process spawn',
                    dag_id: specification.dag_id,
                    python_path: pythonPath
                });
                res.status(500).json({ 
                    error: "Failed to spawn Python process",
                    details: err.message
                });
            });
        });

    } catch (err) {
        logError(err, { 
            context: 'Code generation',
            dag_id: req.body?.specification?.dag_id
        });
        throw new FileOperationError('code generation', req.body?.specification?.dag_id, err);
    }
});

// Export complete pipeline package as ZIP
app.post("/api/pipeline/export",
    validateCodeGenerationRequest,
    handleValidationErrors,
    async (req, res) => {
    try {
        const { specification, additionalPackages = [] } = req.body;
        
        if (!specification) {
            throw new ValidationError('specification is required');
        }

logger.info('Starting pipeline export', {
            dag_id: specification.dag_id,
            task_count: specification.tasks?.length || 0
        });

        // First, generate the Python code
        const { spawn } = await import('child_process');
        
        const generateCode = () => new Promise((resolve, reject) => {
            const pythonPath = process.platform === 'win32' 
                ? path.join('..', 'dde-validator', 'venv', 'Scripts', 'python.exe')
                : path.join('..', 'dde-validator', 'venv', 'bin', 'python');
            
            const proc = spawn(pythonPath, ['-c', `
import sys
import json
from dag_generator import generate_dag_code

spec = json.loads(sys.stdin.read())
code = generate_dag_code(spec)
print(code)
`]);

            let stdout = '';
            let stderr = '';

            proc.stdin.write(JSON.stringify(specification));
            proc.stdin.end();

            proc.stdout.on('data', (data) => stdout += data.toString());
            proc.stderr.on('data', (data) => stderr += data.toString());

            proc.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Code generation failed: ${stderr}`));
                } else {
                    resolve(stdout);
                }
            });

            proc.on('error', (err) => reject(err));
        });

        // Generate Python code
        const code = await generateCode();
        
        // Create artifact package
        const packageBuffer = await createArtifactPackage({
            dag: specification,
            code: code,
            additionalPackages: additionalPackages,
            metadata: {
                generatedBy: 'DDE Pipeline Generator',
                model: MODEL,
                generatedAt: new Date().toISOString()
            }
        });

        // Get package metadata
        const metadata = getPackageMetadata(specification, code);

        logger.info('Pipeline package exported successfully', {
            dag_id: specification.dag_id,
            package_size: packageBuffer.length,
            files: metadata.files.length
        });

        trackPipelineOperation('exported');

        // Set headers for ZIP download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${specification.dag_id}_pipeline.zip"`);
        res.setHeader('Content-Length', packageBuffer.length);
        res.setHeader('X-Package-Files', metadata.files.length);
        res.setHeader('X-Task-Count', metadata.task_count);

        // Send ZIP file
        res.send(packageBuffer);

    } catch (err) {
        logError(err, {
            context: 'Pipeline export',
            dag_id: req.body?.specification?.dag_id
        });
        
        if (!res.headersSent) {
            if (err instanceof ValidationError) {
                res.status(400).json({ error: err.message });
            } else {
                res.status(500).json({ 
                    error: 'Failed to export pipeline package',
                    details: err.message
                });
            }
        }
    }
});


// Error handling middleware - must be AFTER all routes
app.use(notFoundHandler);
app.use(errorHandler);

// Setup process-level error handlers
setupProcessErrorHandlers();

app.listen(PORT, () => {
    logger.info('Server started successfully', {
        port: PORT,
        model: MODEL,
        validator_url: VALIDATOR_URL,
        environment: process.env.NODE_ENV || 'development'
    });
    console.log(`✓ dde-server running at http://localhost:${PORT}`);
    console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    console.log(`✓ Metrics: http://localhost:${PORT}/api/metrics`);
    console.log(`✓ API Documentation: http://localhost:${PORT}/api-docs`);
}).on('error', (err) => {
    logger.error('Server startup error', { error: err.message, stack: err.stack });
    console.error('❌ Server startup error:', err);
    process.exit(1);
});
