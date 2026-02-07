"""
Test DAG Validator
Tests the validation logic for both code and JSON specs
"""

from validators.dag_validator import DAGValidator
import json

def test_syntax_validation():
    """Test Python syntax validation"""
    print("\n=== Testing Syntax Validation ===")
    
    validator = DAGValidator()
    
    # Test 1: Valid Python code
    valid_code = """
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG('test_dag', start_date=datetime(2024, 1, 1)) as dag:
    task1 = BashOperator(task_id='task1', bash_command='echo "Hello"')
"""
    result = validator.validate_syntax(valid_code)
    print(f"Test 1 - Valid code: {'✓ PASS' if result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {len(result['errors'])}, Warnings: {len(result['warnings'])}")
    
    # Test 2: Invalid syntax
    invalid_code = """
from airflow import DAG
def broken function():  # Syntax error
    pass
"""
    result = validator.validate_syntax(invalid_code)
    print(f"Test 2 - Syntax error: {'✓ PASS' if not result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {result['errors']}")
    
    # Test 3: Empty code
    result = validator.validate_syntax("")
    print(f"Test 3 - Empty code: {'✓ PASS' if not result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {len(result['errors'])}")


def test_structure_validation():
    """Test JSON spec validation"""
    print("\n=== Testing Structure Validation ===")
    
    validator = DAGValidator()
    
    # Test 1: Valid minimal spec
    valid_spec = {
        "dag_id": "test_pipeline",
        "description": "Test pipeline",
        "schedule": "@daily",
        "tasks": [
            {
                "task_id": "extract_data",
                "operator_type": "PythonOperator",
                "params": {"python_callable": "extract"}
            }
        ]
    }
    result = validator.validate_structure(valid_spec)
    print(f"Test 1 - Valid spec: {'✓ PASS' if result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {len(result['errors'])}, Warnings: {len(result['warnings'])}")
    
    # Test 2: Missing required fields
    invalid_spec = {
        "description": "Missing dag_id"
    }
    result = validator.validate_structure(invalid_spec)
    print(f"Test 2 - Missing fields: {'✓ PASS' if not result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {result['errors']}")
    
    # Test 3: Invalid DAG ID format
    result = validator.validate_structure({
        "dag_id": "Invalid DAG ID!",
        "description": "Test",
        "schedule": "@daily",
        "tasks": []
    })
    print(f"Test 3 - Invalid DAG ID: {'✓ PASS' if not result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {result['errors']}")
    
    # Test 4: Duplicate task IDs
    result = validator.validate_structure({
        "dag_id": "test_dag",
        "description": "Test",
        "schedule": "@daily",
        "tasks": [
            {"task_id": "task1", "operator_type": "BashOperator"},
            {"task_id": "task1", "operator_type": "PythonOperator"}
        ]
    })
    print(f"Test 4 - Duplicate tasks: {'✓ PASS' if not result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {result['errors']}")
    
    # Test 5: Circular dependencies
    result = validator.validate_structure({
        "dag_id": "test_dag",
        "description": "Test",
        "schedule": "@daily",
        "tasks": [
            {"task_id": "task1", "operator_type": "BashOperator", "dependencies": ["task2"]},
            {"task_id": "task2", "operator_type": "BashOperator", "dependencies": ["task1"]}
        ]
    })
    print(f"Test 5 - Circular deps: {'✓ PASS' if not result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {result['errors']}")
    
    # Test 6: Invalid dependency reference
    result = validator.validate_structure({
        "dag_id": "test_dag",
        "description": "Test",
        "schedule": "@daily",
        "tasks": [
            {"task_id": "task1", "operator_type": "BashOperator", "dependencies": ["nonexistent_task"]}
        ]
    })
    print(f"Test 6 - Invalid dependency: {'✓ PASS' if not result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {result['errors']}")
    
    # Test 7: Complex valid pipeline
    complex_spec = {
        "dag_id": "complex_etl_pipeline",
        "description": "Complex ETL pipeline",
        "schedule": "0 2 * * *",
        "start_date": "2024-01-01",
        "catchup": False,
        "tags": ["etl", "production"],
        "tasks": [
            {
                "task_id": "extract_postgres",
                "operator_type": "PostgresOperator",
                "params": {"sql": "SELECT * FROM source"},
                "dependencies": []
            },
            {
                "task_id": "transform_data",
                "operator_type": "PythonOperator",
                "params": {"python_callable": "transform"},
                "dependencies": ["extract_postgres"]
            },
            {
                "task_id": "load_s3",
                "operator_type": "S3FileTransformOperator",
                "params": {"bucket": "data-lake"},
                "dependencies": ["transform_data"]
            }
        ],
        "connections": [
            {"conn_id": "postgres_default", "conn_type": "postgres"},
            {"conn_id": "aws_default", "conn_type": "aws"}
        ],
        "variables": [
            {"key": "data_path", "value": "/data/etl"}
        ]
    }
    result = validator.validate_structure(complex_spec)
    print(f"Test 7 - Complex pipeline: {'✓ PASS' if result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {len(result['errors'])}, Warnings: {len(result['warnings'])}")
    if result['warnings']:
        print(f"  Warnings: {result['warnings']}")


def test_edge_cases():
    """Test edge cases and warnings"""
    print("\n=== Testing Edge Cases ===")
    
    validator = DAGValidator()
    
    # Test 1: Uppercase DAG ID (should warn)
    result = validator.validate_structure({
        "dag_id": "MY_PIPELINE",
        "description": "Test",
        "schedule": "@daily",
        "tasks": [{"task_id": "task1", "operator_type": "BashOperator"}]
    })
    print(f"Test 1 - Uppercase DAG ID: {len(result['warnings'])} warnings")
    
    # Test 2: Unknown operator type (should warn)
    result = validator.validate_structure({
        "dag_id": "test_dag",
        "description": "Test",
        "schedule": "@daily",
        "tasks": [{"task_id": "task1", "operator_type": "UnknownOperator"}]
    })
    print(f"Test 2 - Unknown operator: {len(result['warnings'])} warnings")
    
    # Test 3: No schedule (should warn)
    result = validator.validate_structure({
        "dag_id": "test_dag",
        "description": "Test",
        "schedule": None,
        "tasks": [{"task_id": "task1", "operator_type": "BashOperator"}]
    })
    print(f"Test 3 - No schedule: {len(result['warnings'])} warnings")
    
    # Test 4: Self-dependency (should error)
    result = validator.validate_structure({
        "dag_id": "test_dag",
        "description": "Test",
        "schedule": "@daily",
        "tasks": [
            {"task_id": "task1", "operator_type": "BashOperator", "dependencies": ["task1"]}
        ]
    })
    print(f"Test 4 - Self-dependency: {'✓ PASS' if not result['valid'] else '✗ FAIL'}")
    print(f"  Errors: {result['errors']}")


if __name__ == '__main__':
    print("=" * 60)
    print("DAG Validator Test Suite")
    print("=" * 60)
    
    test_syntax_validation()
    test_structure_validation()
    test_edge_cases()
    
    print("\n" + "=" * 60)
    print("Test suite completed")
    print("=" * 60)
