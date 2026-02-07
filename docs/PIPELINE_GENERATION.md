# Pipeline Generation System - Task 3 Complete

## Overview
AI now generates structured Airflow DAG specifications in JSON format instead of free-form text responses.

## What's Implemented

### 1. Pipeline Schema (`pipelineSchema.js`)

**JSON Schema Definition**:
- Complete Airflow DAG structure
- 29 supported operators
- Task dependencies
- Connections and variables
- Default arguments

**Validation Engine**:
- Required field checking
- Format validation (dag_id, task_id patterns)
- Duplicate task detection
- Self-dependency prevention
- Circular dependency detection (basic)
- Operator type validation

**Key Features**:
```javascript
validatePipelineSpec(spec) // Returns { valid, errors, warnings }
AIRFLOW_OPERATORS // 29 supported operator types
EXAMPLE_PIPELINES // Reference implementations
```

### 2. System Prompts (`pipelinePrompts.js`)

**PIPELINE_SYSTEM_PROMPT**:
- Comprehensive instructions for AI
- JSON-only output requirement
- Available operators list
- Best practices guide
- Dependency pattern examples
- 2 complete example pipelines

**PIPELINE_REFINEMENT_PROMPT**:
- For future refinement iterations
- Maintains context of current spec
- Applies user feedback

### 3. Server Integration (`server.js`)

**Updated Endpoints**:
- `POST /api/chat` - Uses pipeline system prompt
- `POST /api/chat/stream` - Uses pipeline system prompt
- `POST /api/pipeline/generate` - NEW dedicated pipeline endpoint

**New `/api/pipeline/generate` Features**:
- Accepts message + optional parameters
- Parameter enrichment (schedule, dataSource, dataTarget, tags)
- JSON extraction from AI response
- Removes markdown code blocks
- Validates generated spec
- Returns spec + validation + metadata

### 4. Frontend API (`api.ts`)

**New Function**:
```typescript
generatePipeline(message, parameters?) 
// Returns: { specification, validation, metadata }
```

### 5. Testing

**Schema Validation Tests** (`testPipelineSchema.js`):
- ✅ Valid minimal pipeline
- ❌ Missing required fields
- ❌ Invalid formats
- ❌ Duplicate task IDs
- ✅ Complex pipeline with dependencies
- ❌ Self-dependencies

**Pipeline Generation Tests** (`testPipelineGeneration.js`):
- Simple ETL Pipeline
- API Data Ingestion
- Data Transfer with transformation

## Pipeline Specification Format

```json
{
  "dag_id": "pipeline_name",
  "description": "What the pipeline does",
  "schedule": "@daily | @hourly | cron | null",
  "start_date": "2024-01-01",
  "catchup": false,
  "tags": ["tag1", "tag2"],
  "default_args": {
    "owner": "airflow",
    "retries": 1,
    "retry_delay_minutes": 5
  },
  "tasks": [
    {
      "task_id": "task_name",
      "operator_type": "PythonOperator",
      "description": "Task description",
      "config": { /* operator-specific */ },
      "dependencies": ["upstream_task"],
      "trigger_rule": "all_success"
    }
  ],
  "connections": [
    { "conn_id": "conn_name", "conn_type": "postgres" }
  ],
  "variables": [
    { "key": "var_name", "description": "..." }
  ]
}
```

## Supported Operators (29 total)

**Data Operations**:
- BashOperator, PythonOperator, EmailOperator

**Databases**:
- PostgresOperator, MySqlOperator, SqliteOperator, MsSqlOperator, OracleOperator

**Cloud Storage**:
- S3FileTransformOperator, S3ToRedshiftOperator, RedshiftToS3Operator
- BigQueryOperator, GCSToGoogleDriveOperator
- SnowflakeOperator

**Big Data**:
- SparkSubmitOperator, DatabricksSubmitRunOperator

**Containers**:
- KubernetesPodOperator, DockerOperator

**Control Flow**:
- EmptyOperator, BranchPythonOperator, ShortCircuitOperator, TriggerDagRunOperator

**Sensors**:
- ExternalTaskSensor, HttpSensor, S3KeySensor, SqlSensor, TimeDeltaSensor

## Usage Examples

### Basic Generation
```bash
curl -X POST http://localhost:5050/api/pipeline/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a daily ETL pipeline from PostgreSQL to S3"
  }'
```

### With Parameters
```bash
curl -X POST http://localhost:5050/api/pipeline/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Build an API ingestion pipeline",
    "parameters": {
      "schedule": "@hourly",
      "dataSource": "REST API",
      "dataTarget": "MongoDB",
      "tags": ["api", "ingestion"]
    }
  }'
```

### Frontend Usage
```typescript
import { generatePipeline } from './api';

const result = await generatePipeline(
  "Create a pipeline to move data from MySQL to BigQuery",
  { schedule: "@daily", tags: ["migration"] }
);

console.log(result.specification.dag_id);
console.log(result.validation.valid);
```

## Testing

```bash
# Test schema validation
npm run test:pipeline

# Start server (in another terminal)
cd dde-server
npm run dev

# Test actual generation (requires server running)
node src/testPipelineGeneration.js
```

## What's Next

This enables:
- ✅ Structured pipeline generation
- ✅ JSON validation
- ✅ Clear error reporting
- 🔜 Frontend preview component (Task 5)
- 🔜 Python DAG code generation (Task 13)
- 🔜 Refinement endpoint (Task 8)
