# User Guide

> Complete guide to using the DDE Pipeline Generator

## Table of Contents

- [Getting Started](#getting-started)
- [Creating Your First Pipeline](#creating-your-first-pipeline)
- [Pipeline Features](#pipeline-features)
- [File Uploads](#file-uploads)
- [Refinement and Repair](#refinement-and-repair)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing the Application

1. **Web Interface**: Navigate to http://localhost:5173
2. **API Documentation**: Visit http://localhost:5050/api-docs for interactive API testing

### Interface Overview

The DDE interface consists of:

- **Message Input Area** - Enter your pipeline description
- **Chat History** - View conversation and pipeline iterations
- **Example Prompts** - Quick-start templates
- **Settings Panel** - Configure parameters (schedule, data source, target)

## Creating Your First Pipeline

### Step 1: Describe Your Pipeline

Use natural language to describe what you want your pipeline to do:

**Example:**
```
Create a daily ETL pipeline that:
1. Reads customer data from PostgreSQL database
2. Transforms the data by removing duplicates and formatting dates
3. Loads the clean data into Amazon S3 bucket
4. Sends a notification email when complete
```

### Step 2: Set Parameters (Optional)

Before generating, you can set optional parameters:

- **Schedule**: `@daily`, `@hourly`, `@weekly`, or cron expression
- **Data Source**: PostgreSQL, MySQL, MongoDB, S3, etc.
- **Data Target**: S3, Redshift, BigQuery, Snowflake, etc.
- **Tags**: Categorize your pipeline (e.g., `etl`, `data-quality`)

### Step 3: Generate Pipeline

Click **Send** or press `Ctrl+Enter` to generate the pipeline. The AI will:

1. Analyze your description
2. Create a DAG specification
3. Validate the Python syntax
4. Return a validated pipeline

### Step 4: Review the Output

The system returns a JSON specification:

```json
{
  "dag_id": "customer_etl_pipeline",
  "description": "Daily ETL pipeline for customer data processing",
  "schedule_interval": "@daily",
  "start_date": "2026-02-06",
  "tags": ["etl", "customer-data"],
  "tasks": [
    {
      "task_id": "extract_customer_data",
      "operator": "PostgresOperator",
      "sql": "SELECT * FROM customers WHERE updated_at >= {{ ds }}",
      "postgres_conn_id": "postgres_default"
    },
    {
      "task_id": "transform_data",
      "operator": "PythonOperator",
      "python_callable": "transform_customer_data"
    },
    {
      "task_id": "load_to_s3",
      "operator": "S3Operator",
      "bucket": "customer-data-bucket",
      "key": "processed/{{ ds }}/customers.parquet"
    },
    {
      "task_id": "send_notification",
      "operator": "EmailOperator",
      "to": "data-team@company.com",
      "subject": "Customer ETL Complete"
    }
  ]
}
```

## Pipeline Features

### Supported Operators

DDE supports all common Airflow operators:

**Data Transfer:**
- `PostgresOperator` - Execute PostgreSQL queries
- `MySqlOperator` - Execute MySQL queries
- `MongoOperator` - MongoDB operations
- `S3Operator` - S3 file operations
- `GCSOperator` - Google Cloud Storage
- `RedshiftOperator` - Amazon Redshift

**Python:**
- `PythonOperator` - Execute Python functions
- `BranchPythonOperator` - Conditional branching
- `ShortCircuitOperator` - Skip downstream tasks

**Containers:**
- `DockerOperator` - Run Docker containers
- `KubernetesPodOperator` - Run Kubernetes pods

**Notifications:**
- `EmailOperator` - Send emails
- `SlackOperator` - Send Slack messages

**Sensors:**
- `S3KeySensor` - Wait for S3 file
- `HttpSensor` - Wait for HTTP endpoint
- `TimeDeltaSensor` - Wait for time interval

### Task Dependencies

Specify dependencies using natural language:

```
Create a pipeline where:
- Task A runs first
- Task B and C run in parallel after A
- Task D runs after both B and C complete
```

This creates:
```
A >> [B, C] >> D
```

### Schedule Intervals

Supported schedule formats:

**Presets:**
- `@once` - Run once
- `@hourly` - Every hour
- `@daily` - Every day at midnight
- `@weekly` - Every Sunday
- `@monthly` - First day of month
- `@yearly` - January 1st

**Cron Expressions:**
- `0 0 * * *` - Daily at midnight
- `*/15 * * * *` - Every 15 minutes
- `0 9 * * 1-5` - Weekdays at 9 AM
- `0 0 1 * *` - First day of month

**Timedelta:**
- `timedelta(hours=1)` - Every hour
- `timedelta(days=1)` - Every day

### Example Prompts

#### Simple ETL
```
Build a daily pipeline that extracts data from MySQL, 
transforms it with pandas, and loads to S3
```

#### Data Quality
```
Create an hourly data quality check pipeline that:
- Validates data completeness
- Checks for duplicates
- Sends alerts if issues found
```

#### ML Pipeline
```
Design a weekly ML training pipeline:
1. Extract training data from Snowflake
2. Preprocess and feature engineer
3. Train model with Python
4. Save model to S3
5. Update model registry
```

#### Monitoring
```
Set up a monitoring pipeline that runs every 5 minutes to:
- Check API health endpoints
- Log response times
- Alert if any service is down
```

## File Uploads

### Uploading Requirements Files

Upload `requirements.txt` to include dependencies:

1. Click **Upload File** or use API endpoint
2. Select your `requirements.txt`
3. The system parses and includes dependencies

**Example requirements.txt:**
```txt
pandas==2.0.0
numpy==1.24.0
requests==2.31.0
sqlalchemy==2.0.0
```

### Uploading Configuration Files

Upload JSON/YAML configuration:

```json
{
  "database": {
    "host": "db.example.com",
    "port": 5432,
    "database": "analytics"
  },
  "s3": {
    "bucket": "data-pipeline",
    "region": "us-east-1"
  }
}
```

### File Size Limits

- Maximum file size: **5 MB**
- Accepted formats: `.txt`, `.json`, `.yaml`, `.yml`, `.py`

## Refinement and Repair

### Refining a Pipeline

If the generated pipeline needs changes:

1. Click **Refine** or send a refinement message
2. Describe what to change:
   ```
   Change the schedule to @hourly and add error handling
   ```

3. The system updates the pipeline while preserving valid parts

### Auto-Repair

If validation fails, use auto-repair:

1. Click **Repair** or call `/api/pipeline/repair`
2. The system:
   - Analyzes validation errors
   - Attempts automatic fixes
   - Re-validates (up to 5 iterations)
   - Returns repaired pipeline

**Example Repair Scenario:**

Original (invalid):
```python
task1 >> task2  # task2 not defined
```

Repaired:
```python
task1 = PythonOperator(task_id='task1', ...)
task2 = PythonOperator(task_id='task2', ...)
task1 >> task2
```

### Iteration History

View all iterations:
- See the progression of refinements
- Compare versions
- Revert to previous versions

## Best Practices

### Writing Effective Descriptions

**DO:**
- ✅ Be specific about data sources and targets
- ✅ Mention schedule requirements
- ✅ Describe error handling needs
- ✅ Include dependencies and connections
- ✅ Specify data transformations

**DON'T:**
- ❌ Use vague descriptions like "process data"
- ❌ Forget to mention schedule
- ❌ Omit important error cases
- ❌ Mix multiple unrelated workflows

**Good Example:**
```
Create a daily pipeline at 2 AM that:
1. Extracts new orders from PostgreSQL (orders table)
2. Validates order data (non-null amounts, valid dates)
3. Aggregates by customer using pandas
4. Loads to Redshift (customer_summary table)
5. Sends Slack notification on completion or failure
```

**Poor Example:**
```
Make a pipeline that processes orders
```

### Parameter Configuration

**Schedule Best Practices:**
- Use `@daily` instead of `0 0 * * *` for clarity
- Set realistic intervals (don't run ML training every minute)
- Account for processing time in schedule

**Data Source Best Practices:**
- Specify connection IDs: `postgres_conn_id='analytics_db'`
- Use incremental queries: `WHERE updated_at >= {{ ds }}`
- Add timeouts and retries

**Error Handling:**
- Always include failure callbacks
- Set appropriate retries: `retries=3`
- Define retry delays: `retry_delay=timedelta(minutes=5)`

### Pipeline Organization

**Tags:**
Use consistent tags for organization:
- Environment: `prod`, `staging`, `dev`
- Domain: `finance`, `marketing`, `engineering`
- Type: `etl`, `ml`, `monitoring`, `reporting`

**Naming:**
Use clear, descriptive DAG IDs:
- ✅ `customer_orders_daily_etl`
- ✅ `fraud_detection_ml_weekly`
- ❌ `pipeline1`
- ❌ `dag_v2`

## Troubleshooting

### Common Issues

#### "Validation Failed"

**Cause:** Syntax errors or unsupported operators

**Solution:**
1. Check error messages in response
2. Use **Repair** to auto-fix
3. Try **Refine** with corrections

#### "AI Service Unavailable"

**Cause:** AI service is down or unreachable

**Solution:**
1. Check `/api/health` endpoint
2. Verify AI service is running
3. Check network connectivity

#### "Rate Limit Exceeded"

**Cause:** Too many requests in short time

**Solution:**
1. Wait 15 minutes for limit reset
2. Reduce request frequency
3. Contact admin for limit increase

#### "File Upload Failed"

**Cause:** File too large or invalid format

**Solution:**
1. Check file size (max 5 MB)
2. Verify file format (txt, json, yaml, py)
3. Check file content is valid

### Getting Help

1. **Check API Documentation**: http://localhost:5050/api-docs
2. **View Logs**: Check `logs/error.log` for details
3. **Health Check**: `/api/health?detailed=true` for system status
4. **Metrics**: `/api/metrics` for system performance

### Feature Requests

To request features:
1. Check existing documentation
2. Review API endpoints for capabilities
3. Submit enhancement request with use case

## Advanced Usage

### Using the API Directly

```javascript
// Generate pipeline
const response = await fetch('http://localhost:5050/api/pipeline/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Your pipeline description here',
    parameters: {
      schedule: '@daily',
      dataSource: 'PostgreSQL',
      dataTarget: 'S3'
    }
  })
});

const { dag, validation, metadata } = await response.json();
```

### Generating Python Code

Convert DAG specification to Python:

```javascript
const codeResponse = await fetch('http://localhost:5050/api/pipeline/generate-code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dag: dagSpecification
  })
});

const { code } = await codeResponse.json();
// code contains executable Python file
```

### Batch Processing

For multiple pipelines:

1. Collect all descriptions
2. Generate each pipeline
3. Validate in batch
4. Export all Python files

## Next Steps

- **[API Guide](API_GUIDE.md)** - Learn detailed API usage
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Deploy to production
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Extend and customize

---

**Need more help?** Check the [documentation](README.md) or visit the [API docs](http://localhost:5050/api-docs).
