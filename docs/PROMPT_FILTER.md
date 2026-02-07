# Prompt Filter Module Documentation

## Overview

The prompt filter ensures that all user requests are related to data pipeline generation. It validates incoming prompts and rejects non-pipeline requests with helpful guidance.

## Features

✅ **Keyword Detection**: Identifies pipeline-related terms (pipeline, DAG, ETL, operators, etc.)
✅ **Intent Recognition**: Detects data workflow patterns through regex
✅ **Confidence Scoring**: Returns confidence level (0.0-1.0) for each validation
✅ **Smart Rejection**: Filters out general chat, off-topic requests
✅ **Helpful Feedback**: Provides examples when rejecting requests
✅ **Express Middleware**: Ready-to-use middleware for API routes

## Usage

### As Middleware

```javascript
import { validatePipelinePrompt } from './promptFilter.js';

app.post('/api/chat', validatePipelinePrompt, async (req, res) => {
    // Only pipeline-related prompts reach here
});
```

### Programmatic Check

```javascript
import { isPipelineRelated } from './promptFilter.js';

const result = isPipelineRelated("Create a DAG to extract data from S3");
console.log(result);
// {
//   isPipelineRelated: true,
//   confidence: 0.95,
//   reason: "Found 3 pipeline-related keywords: dag, create, extract"
// }
```

### Get Examples

```javascript
import { getPipelineExamples } from './promptFilter.js';

const examples = getPipelineExamples();
// Returns helpful examples for users
```

## Validation Rules

### ✅ ACCEPTED Prompts

- Contains 2+ pipeline keywords
- Matches intent patterns (e.g., "move data from X to Y")
- Mentions Airflow operators, data sources, or workflows

**Examples:**
- "Create a daily ETL pipeline from PostgreSQL to BigQuery"
- "Generate an Airflow DAG to process CSV files"
- "Build a workflow to ingest API data every hour"

### ❌ REJECTED Prompts

- General conversation (hello, thanks, etc.)
- Off-topic requests (weather, jokes, news)
- Short prompts with no pipeline indicators

**Examples:**
- "Hello, how are you?"
- "Tell me a joke"
- "What's the weather?"

## Pipeline Keywords

The filter recognizes 40+ keywords across categories:

**Pipeline Terms**: pipeline, dag, airflow, workflow, etl, data pipeline

**Operators**: task, operator, sensor, trigger, schedule, cron

**Data Operations**: extract, transform, load, ingest, process, batch

**Airflow-Specific**: bashoperator, pythonoperator, sqloperator, sparkoperator

**Data Systems**: postgres, mysql, mongodb, s3, kafka, redis, bigquery, snowflake

## Response Format

### Rejected Request
```json
{
  "error": "This system generates data pipelines only",
  "message": "Your request does not appear to be related to pipeline generation.",
  "hint": "Please describe a data pipeline you want to create...",
  "reason": "Prompt appears to be general conversation, not pipeline-related"
}
```

### Warning (Low Confidence)
Attached to `req.pipelineWarning`:
```javascript
{
  message: "Your request may not be pipeline-related. Please ensure you are describing a data pipeline.",
  confidence: 0.4
}
```

## Testing

Run the test suite:

```bash
npm run test:filter
```

Expected output: 11/11 tests passing

## Configuration

No configuration needed - works out of the box!

To customize keywords, edit `promptFilter.js`:

```javascript
const PIPELINE_KEYWORDS = [
    // Add your custom keywords here
];
```

## Logging

The middleware logs all validation attempts:

```
[Prompt Filter] Prompt: "Create a pipeline..." | Pipeline: true | Confidence: 0.95
```

## Integration Points

Currently integrated into:
- ✅ `POST /api/chat` (non-streaming)
- ✅ `POST /api/chat/stream` (streaming)

Available endpoint:
- ✅ `GET /api/pipeline/examples` (returns example prompts)

## Future Enhancements

- Machine learning-based classification
- User feedback loop for improving accuracy
- Multi-language support
- Custom keyword sets per deployment
