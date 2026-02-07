"""
Integration Test for Validation System
Tests the complete flow: Backend → Python Validator
"""

import requests
import json

BACKEND_URL = "http://localhost:5050"
VALIDATOR_URL = "http://localhost:5051"


def test_validator_health():
    """Test Python validator health"""
    print("\n=== Testing Validator Health ===")
    try:
        response = requests.get(f"{VALIDATOR_URL}/health")
        print(f"Validator health: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Validator not running: {e}")
        return False


def test_direct_validation():
    """Test direct validation endpoint"""
    print("\n=== Testing Direct Validation ===")
    
    # Test valid spec
    valid_spec = {
        "dag_id": "test_pipeline",
        "description": "Test pipeline for validation",
        "schedule": "@daily",
        "start_date": "2024-01-01",
        "tasks": [
            {
                "task_id": "extract_data",
                "operator_type": "PythonOperator",
                "params": {"python_callable": "extract"},
                "dependencies": []
            },
            {
                "task_id": "transform_data",
                "operator_type": "PythonOperator",
                "params": {"python_callable": "transform"},
                "dependencies": ["extract_data"]
            }
        ],
        "connections": [
            {"conn_id": "postgres_conn", "conn_type": "postgres"}
        ]
    }
    
    try:
        response = requests.post(
            f"{VALIDATOR_URL}/validate/dag",
            json={"dag_spec": valid_spec}
        )
        result = response.json()
        print(f"Status: {response.status_code}")
        print(f"Valid: {result.get('valid')}")
        print(f"Errors: {len(result.get('errors', []))}")
        print(f"Warnings: {len(result.get('warnings', []))}")
        
        if result.get('errors'):
            print(f"Error details: {result['errors']}")
        if result.get('warnings'):
            print(f"Warning details: {result['warnings']}")
        
        return result.get('valid') == True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_invalid_spec():
    """Test validation with invalid spec"""
    print("\n=== Testing Invalid Spec Validation ===")
    
    # Missing required fields and circular dependency
    invalid_spec = {
        "dag_id": "Invalid DAG!",  # Invalid characters
        "description": "Test",
        "schedule": "@daily",
        "tasks": [
            {
                "task_id": "task1",
                "operator_type": "BashOperator",
                "dependencies": ["task2"]
            },
            {
                "task_id": "task2",
                "operator_type": "BashOperator",
                "dependencies": ["task1"]  # Circular!
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{VALIDATOR_URL}/validate/dag",
            json={"dag_spec": invalid_spec}
        )
        result = response.json()
        print(f"Status: {response.status_code}")
        print(f"Valid: {result.get('valid')}")
        print(f"Errors: {len(result.get('errors', []))}")
        
        if result.get('errors'):
            print("Error types:")
            for err in result['errors']:
                print(f"  - {err.get('type')}: {err.get('message')}")
        
        return result.get('valid') == False and len(result.get('errors', [])) > 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_backend_validation():
    """Test backend validation endpoint (proxy to Python validator)"""
    print("\n=== Testing Backend Validation Endpoint ===")
    
    spec = {
        "dag_id": "backend_test_pipeline",
        "description": "Testing backend validation proxy",
        "schedule": "@hourly",
        "tasks": [
            {
                "task_id": "start",
                "operator_type": "EmptyOperator",
                "params": {}
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/pipeline/validate",
            json={"dag_spec": spec}
        )
        
        if response.status_code == 500:
            print("⚠️  Backend validation endpoint not available (may need to restart server)")
            return False
        
        result = response.json()
        print(f"Status: {response.status_code}")
        print(f"Valid: {result.get('valid')}")
        print(f"Errors: {len(result.get('errors', []))}")
        print(f"Warnings: {len(result.get('warnings', []))}")
        
        return True
    except requests.exceptions.ConnectionError:
        print("⚠️  Backend not running on port 5050")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_python_code_validation():
    """Test Python DAG code syntax validation"""
    print("\n=== Testing Python Code Validation ===")
    
    # Valid Airflow DAG code
    valid_code = """
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG(
    'test_dag',
    start_date=datetime(2024, 1, 1),
    schedule='@daily',
    catchup=False
) as dag:
    
    task1 = BashOperator(
        task_id='print_hello',
        bash_command='echo "Hello World"'
    )
    
    task2 = BashOperator(
        task_id='print_date',
        bash_command='date'
    )
    
    task1 >> task2
"""
    
    try:
        response = requests.post(
            f"{VALIDATOR_URL}/validate/dag",
            json={"dag_code": valid_code}
        )
        result = response.json()
        print(f"Status: {response.status_code}")
        print(f"Valid: {result.get('valid')}")
        
        if result.get('details', {}).get('syntax_validation'):
            syntax = result['details']['syntax_validation']
            print(f"Syntax errors: {len(syntax.get('errors', []))}")
            print(f"Syntax warnings: {len(syntax.get('warnings', []))}")
        
        return result.get('valid') == True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_syntax_error_detection():
    """Test Python syntax error detection"""
    print("\n=== Testing Syntax Error Detection ===")
    
    # Invalid Python code
    invalid_code = """
from airflow import DAG

def broken function():  # Syntax error!
    pass

with DAG('test') as dag
    pass  # Missing colon
"""
    
    try:
        response = requests.post(
            f"{VALIDATOR_URL}/validate/dag",
            json={"dag_code": invalid_code}
        )
        result = response.json()
        print(f"Status: {response.status_code}")
        print(f"Valid: {result.get('valid')}")
        print(f"Errors: {len(result.get('errors', []))}")
        
        if result.get('errors'):
            for err in result['errors']:
                if 'line' in err:
                    print(f"  Line {err['line']}: {err['message']}")
        
        return result.get('valid') == False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == '__main__':
    print("=" * 70)
    print("Validation System Integration Test")
    print("=" * 70)
    
    results = []
    
    # Run tests
    results.append(("Validator Health", test_validator_health()))
    results.append(("Direct Validation (Valid)", test_direct_validation()))
    results.append(("Direct Validation (Invalid)", test_invalid_spec()))
    results.append(("Backend Validation Proxy", test_backend_validation()))
    results.append(("Python Code Validation", test_python_code_validation()))
    results.append(("Syntax Error Detection", test_syntax_error_detection()))
    
    # Print summary
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:40} {status}")
        if result:
            passed += 1
    
    print("=" * 70)
    print(f"Results: {passed}/{len(results)} tests passed")
    print("=" * 70)
