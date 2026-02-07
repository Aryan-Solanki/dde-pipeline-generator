# API Guide

> Comprehensive API reference with examples and best practices

## Table of Contents

- [Authentication](#authentication)
- [Base URL](#base-url)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Health & Monitoring](#health--monitoring)
- [Pipeline Operations](#pipeline-operations)
- [File Management](#file-management)
- [Models](#models)
- [Code Examples](#code-examples)

## Authentication

Currently, the API does not require authentication. For production deployments, implement:
- API keys
- OAuth 2.0
- JWT tokens

## Base URL

**Development:**
```
http://localhost:5050
```

**Production:**
```
https://api.dde.example.com
```

All endpoints are prefixed with `/api` except the root endpoint.

## Rate Limiting

### Global Rate Limits

- **100 requests** per 15 minutes per IP address
- Applies to all endpoints

### Endpoint-Specific Limits

- **Generate**: 10 requests per 15 minutes
- **Refine**: 20 requests per 15 minutes
- **Repair**: 10 requests per 15 minutes

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643040000
```

### Exceeding Rate Limits

**Response:**
```json
{
  "error": "Too many requests, please try again later.",
  "statusCode": 429,
  "timestamp": "2026-02-06T10:30:00.000Z"
}
```

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": "Error message description",
  "statusCode": 400,
  "timestamp": "2026-02-06T10:30:00.000Z",
  "path": "/api/pipeline/generate",
  "details": {
    "field": "message",
    "issue": "Message length must be between 10 and 5000 characters"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | AI/Validator unavailable |

### Common Error Types

#### Validation Error (400)

```json
{
  "error": "Validation failed",
  "statusCode": 400,
  "details": {
    "message": "Message is required and must be between 10-5000 characters"
  }
}
```

#### Not Found Error (404)

```json
{
  "error": "File not found: config.json",
  "statusCode": 404,
  "timestamp": "2026-02-06T10:30:00.000Z"
}
```

#### Service Unavailable (503)

```json
{
  "error": "AI service is currently unavailable",
  "statusCode": 503,
  "timestamp": "2026-02-06T10:30:00.000Z"
}
```

## Health & Monitoring

### GET /api/health

Basic health check endpoint.

**Request:**
```bash
curl http://localhost:5050/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "uptime": 3600,
  "model": "qwen2.5-coder:32b-instruct-q4_K_M"
}
```

### GET /api/health?detailed=true

Detailed health check with all system components.

**Request:**
```bash
curl http://localhost:5050/api/health?detailed=true
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "memory": {
      "status": "ok",
      "usage": 45.2,
      "threshold": 90
    },
    "disk": {
      "status": "ok",
      "usage": 62.1,
      "threshold": 90
    },
    "validator": {
      "status": "ok",
      "responseTime": 145
    },
    "ai": {
      "status": "ok",
      "model": "qwen2.5-coder:32b-instruct-q4_K_M"
    }
  }
}
```

### GET /api/health/ready

Kubernetes readiness probe.

**Request:**
```bash
curl http://localhost:5050/api/health/ready
```

**Response:**
```json
{
  "status": "ready",
  "validator": "ok",
  "ai": "ok"
}
```

### GET /api/health/live

Kubernetes liveness probe.

**Request:**
```bash
curl http://localhost:5050/api/health/live
```

**Response:**
```json
{
  "status": "alive"
}
```

### GET /api/metrics

Application metrics and statistics.

**Request:**
```bash
curl http://localhost:5050/api/metrics
```

**Response:**
```json
{
  "requests": {
    "total": 1523,
    "successful": 1401,
    "errors": 122,
    "successRate": "92.0%",
    "byEndpoint": {
      "/api/pipeline/generate": 450,
      "/api/pipeline/validate": 380,
      "/api/health": 693
    }
  },
  "pipeline": {
    "generated": 450,
    "validated": 830,
    "refined": 123,
    "repaired": 67
  },
  "errors": {
    "byType": {
      "ValidationError": 45,
      "TimeoutError": 12,
      "HTTP_404": 65
    },
    "total": 122
  },
  "uptime": 86400,
  "timestamp": "2026-02-06T10:30:00.000Z"
}
```

## Pipeline Operations

### POST /api/pipeline/generate

Generate a DAG pipeline from natural language description.

**Request:**
```bash
curl -X POST http://localhost:5050/api/pipeline/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a daily ETL pipeline that extracts from PostgreSQL, transforms with pandas, and loads to S3",
    "parameters": {
      "schedule": "@daily",
      "dataSource": "PostgreSQL",
      "dataTarget": "S3",
      "tags": ["etl", "data-pipeline"]
    }
  }'
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | Pipeline description (10-5000 chars) |
| parameters | object | No | Additional parameters |
| parameters.schedule | string | No | Schedule interval |
| parameters.dataSource | string | No | Data source type |
| parameters.dataTarget | string | No | Data target type |
| parameters.tags | array | No | Pipeline tags |

**Response:**
```json
{
  "dag": {
    "dag_id": "postgres_etl_pipeline",
    "description": "Daily ETL pipeline for PostgreSQL to S3",
    "schedule_interval": "@daily",
    "start_date": "2026-02-06",
    "tags": ["etl", "data-pipeline"],
    "tasks": [
      {
        "task_id": "extract_postgres",
        "operator": "PostgresOperator",
        "sql": "SELECT * FROM source_table",
        "postgres_conn_id": "postgres_default"
      },
      {
        "task_id": "transform_data",
        "operator": "PythonOperator",
        "python_callable": "transform_with_pandas"
      },
      {
        "task_id": "load_to_s3",
        "operator": "S3Operator",
        "bucket": "data-bucket",
        "key": "processed/{{ ds }}/data.parquet"
      }
    ]
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "metadata": {
    "generatedAt": "2026-02-06T10:30:00.000Z",
    "model": "qwen2.5-coder:32b-instruct-q4_K_M",
    "processingTime": 2345
  }
}
```

### POST /api/pipeline/validate

Validate a DAG specification or Python code.

**Request (DAG Specification):**
```bash
curl -X POST http://localhost:5050/api/pipeline/validate \
  -H "Content-Type: application/json" \
  -d '{
    "dag": {
      "dag_id": "test_pipeline",
      "schedule_interval": "@daily",
      "tasks": [...]
    }
  }'
```

**Request (Python Code):**
```bash
curl -X POST http://localhost:5050/api/pipeline/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "from airflow import DAG\nfrom airflow.operators.python import PythonOperator\n..."
  }'
```

**Response (Valid):**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Consider adding retry logic to task 'extract_data'"
  ]
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "errors": [
    {
      "line": 15,
      "message": "NameError: name 'undefined_task' is not defined",
      "type": "syntax_error"
    }
  ],
  "warnings": []
}
```

### POST /api/pipeline/refine

Refine an existing pipeline with user feedback.

**Request:**
```bash
curl -X POST http://localhost:5050/api/pipeline/refine \
  -H "Content-Type: application/json" \
  -d '{
    "currentDag": {
      "dag_id": "postgres_etl_pipeline",
      "schedule_interval": "@daily",
      "tasks": [...]
    },
    "feedback": "Change the schedule to @hourly and add error notification",
    "parameters": {
      "schedule": "@hourly"
    }
  }'
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentDag | object | Yes | Current DAG specification |
| feedback | string | Yes | Refinement instructions |
| parameters | object | No | Updated parameters |

**Response:**
```json
{
  "dag": {
    "dag_id": "postgres_etl_pipeline",
    "schedule_interval": "@hourly",
    "tasks": [
      ...existing tasks...,
      {
        "task_id": "send_error_notification",
        "operator": "EmailOperator",
        "to": "team@example.com",
        "subject": "Pipeline Error",
        "trigger_rule": "one_failed"
      }
    ]
  },
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  },
  "changes": [
    "Updated schedule_interval from '@daily' to '@hourly'",
    "Added error notification task"
  ]
}
```

### POST /api/pipeline/repair

Automatically repair validation errors.

**Request:**
```bash
curl -X POST http://localhost:5050/api/pipeline/repair \
  -H "Content-Type: application/json" \
  -d '{
    "dag": {
      "dag_id": "broken_pipeline",
      "tasks": [...]
    },
    "validationErrors": [
      {
        "line": 15,
        "message": "NameError: name 'task2' is not defined"
      }
    ],
    "maxIterations": 5
  }'
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dag | object | Yes | DAG with errors |
| validationErrors | array | Yes | Validation errors |
| maxIterations | number | No | Max repair attempts (default: 5) |

**Response:**
```json
{
  "success": true,
  "dag": {
    "dag_id": "broken_pipeline",
    "tasks": [...fixed tasks...]
  },
  "iterations": 2,
  "repairs": [
    "Added missing task definition for 'task2'",
    "Fixed task dependency ordering"
  ],
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

**Response (Failed Repair):**
```json
{
  "success": false,
  "message": "Could not repair pipeline after 5 iterations",
  "lastAttempt": {
    "dag": {...},
    "errors": [...]
  }
}
```

### POST /api/pipeline/generate-code

Generate Python code from DAG specification.

**Request:**
```bash
curl -X POST http://localhost:5050/api/pipeline/generate-code \
  -H "Content-Type: application/json" \
  -d '{
    "dag": {
      "dag_id": "etl_pipeline",
      "description": "ETL pipeline",
      "schedule_interval": "@daily",
      "tasks": [...]
    }
  }'
```

**Response:**
```json
{
  "code": "from airflow import DAG\nfrom airflow.operators.python import PythonOperator\nfrom datetime import datetime, timedelta\n\ndefault_args = {\n    'owner': 'airflow',\n    'depends_on_past': False,\n    'start_date': datetime(2026, 2, 6),\n    'retries': 1,\n    'retry_delay': timedelta(minutes=5)\n}\n\ndag = DAG(\n    'etl_pipeline',\n    default_args=default_args,\n    description='ETL pipeline',\n    schedule_interval='@daily',\n    catchup=False\n)\n\n# Task definitions...\n",
  "filename": "etl_pipeline.py",
  "validation": {
    "valid": true,
    "errors": [],
    "warnings": []
  }
}
```

### GET /api/pipeline/examples

Get example pipeline descriptions.

**Request:**
```bash
curl http://localhost:5050/api/pipeline/examples
```

**Response:**
```json
{
  "examples": [
    {
      "title": "Daily ETL Pipeline",
      "description": "Create a daily ETL pipeline that extracts from PostgreSQL, transforms with pandas, and loads to S3",
      "category": "ETL",
      "tags": ["etl", "postgresql", "s3"]
    },
    {
      "title": "ML Training Pipeline",
      "description": "Build a weekly ML training pipeline that loads data from BigQuery, trains a model, and saves to GCS",
      "category": "Machine Learning",
      "tags": ["ml", "training", "bigquery"]
    },
    {
      "title": "Data Quality Check",
      "description": "Set up hourly data quality checks that validate completeness and send alerts for issues",
      "category": "Monitoring",
      "tags": ["data-quality", "monitoring"]
    }
  ]
}
```

## File Management

### POST /api/files/upload

Upload files for pipeline configuration.

**Request:**
```bash
curl -X POST http://localhost:5050/api/files/upload \
  -F "file=@requirements.txt"
```

**Response:**
```json
{
  "filename": "requirements.txt",
  "size": 1234,
  "path": "/uploads/requirements.txt",
  "uploadedAt": "2026-02-06T10:30:00.000Z"
}
```

**Constraints:**
- Maximum file size: 5 MB
- Allowed extensions: `.txt`, `.json`, `.yaml`, `.yml`, `.py`

### POST /api/files/parse-requirements

Parse a requirements.txt file.

**Request:**
```bash
curl -X POST http://localhost:5050/api/files/parse-requirements \
  -H "Content-Type: application/json" \
  -d '{
    "content": "pandas==2.0.0\nnumpy==1.24.0\nrequests>=2.31.0"
  }'
```

**Response:**
```json
{
  "packages": [
    {
      "name": "pandas",
      "version": "2.0.0",
      "operator": "=="
    },
    {
      "name": "numpy",
      "version": "1.24.0",
      "operator": "=="
    },
    {
      "name": "requests",
      "version": "2.31.0",
      "operator": ">="
    }
  ],
  "count": 3
}
```

### DELETE /api/files/:filename

Delete an uploaded file.

**Request:**
```bash
curl -X DELETE http://localhost:5050/api/files/requirements.txt
```

**Response:**
```json
{
  "message": "File deleted successfully",
  "filename": "requirements.txt"
}
```

## Models

### GET /api/models

List available AI models.

**Request:**
```bash
curl http://localhost:5050/api/models
```

**Response:**
```json
{
  "models": [
    {
      "name": "qwen2.5-coder:32b-instruct-q4_K_M",
      "size": "32B",
      "type": "code-generation",
      "active": true
    }
  ],
  "active": "qwen2.5-coder:32b-instruct-q4_K_M"
}
```

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:5050';

// Generate a pipeline
async function generatePipeline(description, params = {}) {
  try {
    const response = await axios.post(`${BASE_URL}/api/pipeline/generate`, {
      message: description,
      parameters: params
    });
    
    return response.data;
  } catch (error) {
    console.error('Error generating pipeline:', error.response?.data);
    throw error;
  }
}

// Validate a pipeline
async function validatePipeline(dag) {
  try {
    const response = await axios.post(`${BASE_URL}/api/pipeline/validate`, {
      dag: dag
    });
    
    return response.data;
  } catch (error) {
    console.error('Validation failed:', error.response?.data);
    throw error;
  }
}

// Usage
(async () => {
  const result = await generatePipeline(
    'Create a daily ETL pipeline from PostgreSQL to S3',
    { schedule: '@daily', tags: ['etl'] }
  );
  
  console.log('Generated DAG:', result.dag);
  console.log('Validation:', result.validation);
})();
```

### Python

```python
import requests

BASE_URL = 'http://localhost:5050'

def generate_pipeline(description, params=None):
    """Generate a pipeline from description"""
    url = f'{BASE_URL}/api/pipeline/generate'
    payload = {
        'message': description,
        'parameters': params or {}
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

def validate_pipeline(dag=None, code=None):
    """Validate a DAG specification or Python code"""
    url = f'{BASE_URL}/api/pipeline/validate'
    payload = {}
    
    if dag:
        payload['dag'] = dag
    elif code:
        payload['code'] = code
    else:
        raise ValueError('Must provide either dag or code')
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

# Usage
if __name__ == '__main__':
    result = generate_pipeline(
        'Create a daily ETL pipeline from PostgreSQL to S3',
        {'schedule': '@daily', 'tags': ['etl']}
    )
    
    print('Generated DAG:', result['dag'])
    print('Valid:', result['validation']['valid'])
```

### cURL Examples

**Generate Pipeline:**
```bash
curl -X POST http://localhost:5050/api/pipeline/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a daily ETL pipeline",
    "parameters": {
      "schedule": "@daily"
    }
  }'
```

**Validate Pipeline:**
```bash
curl -X POST http://localhost:5050/api/pipeline/validate \
  -H "Content-Type: application/json" \
  -d '{
    "dag": {
      "dag_id": "test",
      "schedule_interval": "@daily"
    }
  }'
```

**Upload File:**
```bash
curl -X POST http://localhost:5050/api/files/upload \
  -F "file=@requirements.txt"
```

**Check Health:**
```bash
curl http://localhost:5050/api/health?detailed=true
```

**Get Metrics:**
```bash
curl http://localhost:5050/api/metrics
```

## Best Practices

### Error Handling

Always handle errors appropriately:

```javascript
try {
  const result = await generatePipeline(description);
  // Process result
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded - wait and retry
    await new Promise(resolve => setTimeout(resolve, 60000));
    return generatePipeline(description);
  } else if (error.response?.status === 503) {
    // Service unavailable - check health
    const health = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
    console.error('Service status:', health.status);
  } else {
    // Other error
    console.error('Error:', error.response?.data);
  }
}
```

### Rate Limit Handling

```javascript
async function withRateLimit(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const resetTime = error.response.headers['x-ratelimit-reset'];
        const waitTime = resetTime 
          ? (parseInt(resetTime) * 1000) - Date.now()
          : 60000;
        
        console.log(`Rate limited. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}
```

### Validation

Always validate inputs before sending:

```javascript
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a string');
  }
  if (message.length < 10 || message.length > 5000) {
    throw new Error('Message must be between 10 and 5000 characters');
  }
}

function generatePipeline(message, params) {
  validateMessage(message);
  // Proceed with API call
}
```

## Next Steps

- **[User Guide](USER_GUIDE.md)** - Learn how to use the UI
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Deploy to production
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Extend the API

---

**Interactive API Documentation:** http://localhost:5050/api-docs
