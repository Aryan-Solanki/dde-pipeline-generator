/**
 * Prompt Filter Module
 * Validates that user prompts are pipeline-related
 */

const PIPELINE_KEYWORDS = [
    // Pipeline-related terms
    'pipeline', 'dag', 'airflow', 'workflow', 'etl', 'data pipeline',
    
    // Task/operator related
    'task', 'operator', 'sensor', 'trigger', 'schedule', 'cron',
    
    // Data-related
    'extract', 'transform', 'load', 'ingest', 'process', 'batch',
    
    // Airflow-specific
    'bashoperator', 'pythonoperator', 'sqloperator', 'sparkoperator',
    'kubernetes', 'docker', 'connection', 'variable',
    
    // Actions
    'create', 'generate', 'build', 'setup', 'configure', 'deploy',
    'run', 'execute', 'orchestrate', 'automate',
    
    // Data sources/targets
    'database', 'api', 's3', 'gcs', 'postgres', 'mysql', 'mongodb',
    'kafka', 'redis', 'elasticsearch', 'bigquery', 'snowflake'
];

const REJECTION_KEYWORDS = [
    // General chat
    'hello', 'hi', 'hey', 'thanks', 'thank you',
    
    // Off-topic
    'weather', 'joke', 'story', 'game', 'recipe',
    'news', 'sports', 'movie', 'music', 'book'
];

/**
 * Check if a prompt is pipeline-related
 * @param {string} prompt - User's input prompt
 * @returns {Object} - { isPipelineRelated: boolean, confidence: number, reason: string }
 */
export function isPipelineRelated(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        return {
            isPipelineRelated: false,
            confidence: 0,
            reason: 'Empty or invalid prompt'
        };
    }

    const lowerPrompt = prompt.toLowerCase();
    
    // Check for explicit rejection keywords
    const hasRejectionKeyword = REJECTION_KEYWORDS.some(keyword => 
        lowerPrompt.includes(keyword)
    );
    
    if (hasRejectionKeyword && lowerPrompt.length < 50) {
        return {
            isPipelineRelated: false,
            confidence: 0.9,
            reason: 'Prompt appears to be general conversation, not pipeline-related'
        };
    }
    
    // Count pipeline-related keywords
    const pipelineMatches = PIPELINE_KEYWORDS.filter(keyword => 
        lowerPrompt.includes(keyword)
    );
    
    const matchCount = pipelineMatches.length;
    const confidence = Math.min(matchCount * 0.3, 1.0);
    
    // Decision logic
    if (matchCount >= 2) {
        return {
            isPipelineRelated: true,
            confidence: Math.min(confidence, 0.95),
            reason: `Found ${matchCount} pipeline-related keywords: ${pipelineMatches.slice(0, 3).join(', ')}`
        };
    }
    
    if (matchCount === 1) {
        return {
            isPipelineRelated: true,
            confidence: 0.6,
            reason: `Found pipeline keyword: ${pipelineMatches[0]}`
        };
    }
    
    // Check for intent patterns
    const intentPatterns = [
        /create.*data.*flow/i,
        /build.*automation/i,
        /generate.*workflow/i,
        /automate.*process/i,
        /schedule.*job/i,
        /move.*data.*from.*to/i,
        /transfer.*data/i
    ];
    
    const hasIntentPattern = intentPatterns.some(pattern => pattern.test(prompt));
    
    if (hasIntentPattern) {
        return {
            isPipelineRelated: true,
            confidence: 0.7,
            reason: 'Detected data pipeline intent pattern'
        };
    }
    
    // Default: uncertain, but allow (better false positive than false negative)
    return {
        isPipelineRelated: prompt.length > 20, // Short prompts likely not pipelines
        confidence: 0.3,
        reason: 'Uncertain - no clear pipeline indicators found'
    };
}

/**
 * Middleware function for Express
 * Validates incoming prompts and rejects non-pipeline requests
 */
export function validatePipelinePrompt(req, res, next) {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ 
            error: 'Message is required',
            hint: 'Please provide a pipeline description'
        });
    }
    
    const result = isPipelineRelated(message);
    
    // Log the validation result
    console.log(`[Prompt Filter] Prompt: "${message.substring(0, 50)}..." | Pipeline: ${result.isPipelineRelated} | Confidence: ${result.confidence.toFixed(2)}`);
    
    // Reject if clearly not pipeline-related
    if (!result.isPipelineRelated && result.confidence > 0.7) {
        return res.status(400).json({
            error: 'This system generates data pipelines only',
            message: 'Your request does not appear to be related to pipeline generation.',
            hint: 'Please describe a data pipeline you want to create (e.g., "Create a pipeline to extract data from PostgreSQL and load it to S3")',
            reason: result.reason
        });
    }
    
    // Warn if uncertain but allow through
    if (result.confidence < 0.5) {
        req.pipelineWarning = {
            message: 'Your request may not be pipeline-related. Please ensure you are describing a data pipeline.',
            confidence: result.confidence
        };
    }
    
    // Attach filter result to request for logging
    req.pipelineFilterResult = result;
    
    next();
}

/**
 * Get helpful examples for users
 */
export function getPipelineExamples() {
    return {
        examples: [
            "Create a daily ETL pipeline that extracts data from PostgreSQL, transforms it using Python, and loads it to BigQuery",
            "Build an Airflow DAG to ingest CSV files from S3, process them with Spark, and store results in Snowflake",
            "Generate a pipeline that runs every hour to fetch data from a REST API and store it in MongoDB",
            "Create a workflow to move data from MySQL to Redshift with data quality checks",
            "Build a pipeline that processes Kafka streams and writes aggregated data to PostgreSQL"
        ],
        keywords: PIPELINE_KEYWORDS.slice(0, 15)
    };
}
