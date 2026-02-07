"""
Test DAG Code Generator
"""
from dag_generator import generate_dag_code
import json

# Test specification
spec = {
    "dag_id": "test_etl_pipeline",
    "description": "Test ETL pipeline with multiple operators",
    "schedule": "@hourly",
    "start_date": "2024-02-01",
    "catchup": False,
    "tags": ["test", "etl", "demo"],
    "default_args": {
        "owner": "test_team",
        "retries": 3,
        "retry_delay": 600,
        "email": ["test@example.com", "admin@example.com"],
        "email_on_failure": True,
        "email_on_retry": False
    },
    "tasks": [
        {
            "task_id": "start",
            "operator_type": "EmptyOperator"
        },
        {
            "task_id": "extract_postgres",
            "operator_type": "PostgresOperator",
            "parameters": {
                "postgres_conn_id": "postgres_default",
                "sql": "SELECT * FROM source_table"
            },
            "dependencies": ["start"]
        },
        {
            "task_id": "extract_api",
            "operator_type": "HttpOperator",
            "parameters": {
                "http_conn_id": "api_default",
                "endpoint": "/data",
                "method": "GET"
            },
            "dependencies": ["start"]
        },
        {
            "task_id": "transform",
            "operator_type": "PythonOperator",
            "parameters": {
                "python_callable": "py:transform_data"
            },
            "retries": 5,
            "retry_delay": 300,
            "dependencies": ["extract_postgres", "extract_api"]
        },
        {
            "task_id": "load_to_s3",
            "operator_type": "BashOperator",
            "parameters": {
                "bash_command": "aws s3 cp /tmp/data.csv s3://my-bucket/data.csv"
            },
            "dependencies": ["transform"]
        },
        {
            "task_id": "send_notification",
            "operator_type": "EmailOperator",
            "parameters": {
                "to": "team@example.com",
                "subject": "ETL Pipeline Completed",
                "html_content": "<p>Pipeline completed successfully</p>"
            },
            "dependencies": ["load_to_s3"]
        }
    ]
}

print("Testing DAG Code Generator...")
print(f"Specification: {spec['dag_id']}\n")

# Generate code
code = generate_dag_code(spec)

print("=" * 80)
print("GENERATED CODE:")
print("=" * 80)
print(code)
print("=" * 80)

# Stats
lines = code.split('\n')
print(f"\nCode Statistics:")
print(f"  Total lines: {len(lines)}")
print(f"  Total characters: {len(code)}")
print(f"  Tasks defined: {len(spec['tasks'])}")
print(f"  Dependencies: {sum(1 for t in spec['tasks'] if t.get('dependencies'))}")

# Verify key elements
print(f"\nVerification:")
print(f"  ✓ DAG ID present: {spec['dag_id'] in code}")
print(f"  ✓ Default args present: {'default_args' in code}")
print(f"  ✓ All tasks present: {all(t['task_id'] in code for t in spec['tasks'])}")
print(f"  ✓ Dependencies present: {'>>' in code}")
print(f"  ✓ Imports present: {'from airflow import DAG' in code}")

print("\n✓ DAG code generation test complete")
