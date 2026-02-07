"""
Simple manual test for DAG validator
Run this to test validation logic directly without network calls
"""

import sys
import os

# Add parent directory to path to import validators
sys.path.insert(0, os.path.dirname(__file__))

from validators.dag_validator import DAGValidator
import json


def main():
    print("=" * 70)
    print("DAG Validator - Manual Test")
    print("=" * 70)
    
    validator = DAGValidator()
    
    # Test 1: Complete valid pipeline
    print("\n[Test 1] Valid ETL Pipeline")
    print("-" * 70)
    
    valid_spec = {
        "dag_id": "etl_pipeline",
        "description": "ETL pipeline from Postgres to S3",
        "schedule": "@daily",
        "start_date": "2024-01-01",
        "catchup": False,
        "tags": ["etl", "production"],
        "tasks": [
            {
                "task_id": "extract_from_postgres",
                "operator_type": "PostgresOperator",
                "params": {"sql": "SELECT * FROM users"},
                "dependencies": []
            },
            {
                "task_id": "transform_data",
                "operator_type": "PythonOperator",
                "params": {"python_callable": "transform_users"},
                "dependencies": ["extract_from_postgres"]
            },
            {
                "task_id": "load_to_s3",
                "operator_type": "S3FileTransformOperator",
                "params": {"bucket": "data-lake", "key": "users.parquet"},
                "dependencies": ["transform_data"]
            }
        ],
        "connections": [
            {"conn_id": "postgres_prod", "conn_type": "postgres"},
            {"conn_id": "aws_s3", "conn_type": "aws"}
        ],
        "variables": [
            {"key": "output_path", "value": "/data/etl"}
        ]
    }
    
    result = validator.validate_structure(valid_spec)
    print(f"✓ Valid: {result['valid']}")
    print(f"  Errors: {len(result['errors'])}")
    print(f"  Warnings: {len(result['warnings'])}")
    if result['warnings']:
        for w in result['warnings']:
            print(f"    - {w['message']}")
    
    # Test 2: Invalid pipeline with multiple errors
    print("\n[Test 2] Invalid Pipeline (Multiple Errors)")
    print("-" * 70)
    
    invalid_spec = {
        "dag_id": "Bad Pipeline Name!",  # Invalid characters
        "description": "Test",
        # Missing schedule
        "tasks": [
            {
                "task_id": "task 1",  # Invalid characters
                "operator_type": "UnknownOperator",
                "dependencies": ["nonexistent", "task 1"]  # Non-existent dep + self-dep
            },
            {
                "task_id": "task 1",  # Duplicate ID
                "operator_type": "BashOperator"
            }
        ]
    }
    
    result = validator.validate_structure(invalid_spec)
    print(f"✗ Valid: {result['valid']}")
    print(f"  Errors: {len(result['errors'])}")
    for err in result['errors']:
        print(f"    - [{err['type']}] {err['message']}")
    print(f"  Warnings: {len(result['warnings'])}")
    
    # Test 3: Circular dependency detection
    print("\n[Test 3] Circular Dependency")
    print("-" * 70)
    
    circular_spec = {
        "dag_id": "circular_dag",
        "description": "Test circular deps",
        "schedule": "@daily",
        "tasks": [
            {
                "task_id": "task_a",
                "operator_type": "BashOperator",
                "dependencies": ["task_b"]
            },
            {
                "task_id": "task_b",
                "operator_type": "BashOperator",
                "dependencies": ["task_c"]
            },
            {
                "task_id": "task_c",
                "operator_type": "BashOperator",
                "dependencies": ["task_a"]  # Circular!
            }
        ]
    }
    
    result = validator.validate_structure(circular_spec)
    print(f"✗ Valid: {result['valid']}")
    print(f"  Circular dependency detected: {any('circular' in e['message'].lower() for e in result['errors'])}")
    for err in result['errors']:
        if 'circular' in err['message'].lower():
            print(f"    - {err['message']}")
    
    # Test 4: Python code validation
    print("\n[Test 4] Python DAG Code Validation")
    print("-" * 70)
    
    valid_code = """
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG('example_dag', start_date=datetime(2024, 1, 1)) as dag:
    task = BashOperator(task_id='hello', bash_command='echo "Hello"')
"""
    
    result = validator.validate_syntax(valid_code)
    print(f"✓ Valid Python syntax: {result['valid']}")
    print(f"  Warnings: {len(result['warnings'])} (checking for DAG structure)")
    
    # Test 5: Syntax error detection
    print("\n[Test 5] Python Syntax Error")
    print("-" * 70)
    
    invalid_code = """
from airflow import DAG

def broken syntax here:
    pass
"""
    
    result = validator.validate_syntax(invalid_code)
    print(f"✗ Valid syntax: {result['valid']}")
    print(f"  Errors: {len(result['errors'])}")
    for err in result['errors']:
        print(f"    - Line {err.get('line', '?')}: {err['message']}")
    
    print("\n" + "=" * 70)
    print("Manual test completed successfully!")
    print("=" * 70)


if __name__ == '__main__':
    main()
