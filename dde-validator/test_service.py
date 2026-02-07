"""
Test script for dde-validator service
"""
import requests
import json

BASE_URL = "http://localhost:5051"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✓ Health check: {response.status_code}")
        print(f"  Response: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_validate_dag():
    """Test DAG validation endpoint"""
    try:
        dag_code = """
from airflow import DAG
from datetime import datetime

dag = DAG('test_dag', start_date=datetime(2024, 1, 1))
"""
        response = requests.post(
            f"{BASE_URL}/validate/dag",
            json={"dag_code": dag_code}
        )
        print(f"✓ DAG validation: {response.status_code}")
        print(f"  Response: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ DAG validation failed: {e}")
        return False

def test_validate_environment():
    """Test environment validation endpoint"""
    try:
        response = requests.post(
            f"{BASE_URL}/validate/environment",
            json={"dag_spec": {}, "environment": {}}
        )
        print(f"✓ Environment validation: {response.status_code}")
        print(f"  Response: {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Environment validation failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing dde-validator service...")
    print("-" * 50)
    
    test_health()
    print()
    test_validate_dag()
    print()
    test_validate_environment()
    
    print("-" * 50)
    print("Tests complete!")
