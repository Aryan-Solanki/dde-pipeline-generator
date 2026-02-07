/**
 * Artifact Packager
 * Creates downloadable ZIP packages containing pipeline artifacts
 */

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generatePipelineReadme, generateRequirements, generateDeploymentInstructions } from './pipelineDocGenerator.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create a ZIP package with all pipeline artifacts
 * @param {Object} options - Package options
 * @param {Object} options.dag - DAG specification
 * @param {string} options.code - Generated Python code
 * @param {Array} options.additionalPackages - Additional Python packages
 * @param {Object} options.metadata - Generation metadata
 * @returns {Promise<Buffer>} ZIP file buffer
 */
export async function createArtifactPackage(options) {
  const { dag, code, additionalPackages = [], metadata = {} } = options;
  
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    const chunks = [];
    
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err) => {
      logger.error('Archive creation failed', { error: err.message });
      reject(err);
    });
    
    try {
      // Add DAG Python file
      const dagFilename = `${dag.dag_id}.py`;
      archive.append(code, { name: dagFilename });
      logger.debug('Added DAG file to archive', { filename: dagFilename });
      
      // Add README
      const readme = generatePipelineReadme(dag, metadata);
      archive.append(readme, { name: 'README.md' });
      logger.debug('Added README to archive');
      
      // Add requirements.txt
      const requirements = generateRequirements(dag, additionalPackages);
      archive.append(requirements, { name: 'requirements.txt' });
      logger.debug('Added requirements.txt to archive');
      
      // Add deployment instructions
      const deployInstructions = generateDeploymentInstructions(dag);
      archive.append(deployInstructions, { name: 'DEPLOYMENT.md' });
      logger.debug('Added deployment instructions to archive');
      
      // Add DAG specification JSON
      const dagSpec = JSON.stringify(dag, null, 2);
      archive.append(dagSpec, { name: 'dag_specification.json' });
      logger.debug('Added DAG specification to archive');
      
      // Add docker-compose.yml for local testing
      const dockerCompose = generateDockerCompose(dag);
      archive.append(dockerCompose, { name: 'docker-compose.yml' });
      logger.debug('Added docker-compose.yml to archive');
      
      // Add .env.example
      const envExample = generateEnvExample(dag);
      archive.append(envExample, { name: '.env.example' });
      logger.debug('Added .env.example to archive');
      
      // Add testing script
      const testScript = generateTestScript(dag);
      archive.append(testScript, { name: 'test_dag.py' });
      logger.debug('Added test script to archive');
      
      // Add .gitignore
      const gitignore = generateGitignore();
      archive.append(gitignore, { name: '.gitignore' });
      logger.debug('Added .gitignore to archive');
      
      // Finalize the archive
      archive.finalize();
      logger.info('Artifact package created successfully', { 
        dag_id: dag.dag_id,
        files: 9
      });
      
    } catch (error) {
      logger.error('Error creating artifact package', { 
        error: error.message,
        dag_id: dag.dag_id
      });
      reject(error);
    }
  });
}

/**
 * Generate docker-compose.yml for local Airflow testing
 */
function generateDockerCompose(dag) {
  return `version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - postgres-db-volume:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "airflow"]
      interval: 5s
      retries: 5
    restart: always

  airflow-webserver:
    image: apache/airflow:2.8.0
    depends_on:
      - postgres
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
      AIRFLOW__CORE__FERNET_KEY: ''
      AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
      AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
      AIRFLOW__API__AUTH_BACKENDS: 'airflow.api.auth.backend.basic_auth'
      _AIRFLOW_DB_UPGRADE: 'true'
      _AIRFLOW_WWW_USER_CREATE: 'true'
      _AIRFLOW_WWW_USER_USERNAME: admin
      _AIRFLOW_WWW_USER_PASSWORD: admin
    volumes:
      - ./:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
    ports:
      - "8080:8080"
    command: webserver
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost:8080/health"]
      interval: 10s
      timeout: 10s
      retries: 5
    restart: always

  airflow-scheduler:
    image: apache/airflow:2.8.0
    depends_on:
      - postgres
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
      AIRFLOW__CORE__FERNET_KEY: ''
      AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
      AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
    volumes:
      - ./:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
    command: scheduler
    healthcheck:
      test: ["CMD", "airflow", "jobs", "check", "--job-type", "SchedulerJob"]
      interval: 10s
      timeout: 10s
      retries: 5
    restart: always

volumes:
  postgres-db-volume:

# Usage:
# 1. docker-compose up -d
# 2. Wait for services to be healthy
# 3. Access Airflow UI at http://localhost:8080
# 4. Login with admin/admin
# 5. Enable DAG: ${dag.dag_id}
`;
}

/**
 * Generate .env.example file
 */
function generateEnvExample(dag) {
  const tasks = dag.tasks || [];
  const envVars = new Set([
    'AIRFLOW__CORE__FERNET_KEY=your-fernet-key-here',
    'AIRFLOW__CORE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@postgres/airflow'
  ]);
  
  // Add task-specific env vars
  tasks.forEach(task => {
    const operator = task.operator || task.operator_type || '';
    
    if (task.aws_conn_id || (operator && operator.includes('S3'))) {
      envVars.add('AWS_ACCESS_KEY_ID=your-access-key');
      envVars.add('AWS_SECRET_ACCESS_KEY=your-secret-key');
      envVars.add('AWS_DEFAULT_REGION=us-east-1');
    }
    
    if (task.gcp_conn_id || (operator && operator.includes('GCS'))) {
      envVars.add('GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json');
    }
    
    if (task.postgres_conn_id) {
      envVars.add(`POSTGRES_HOST=localhost`);
      envVars.add(`POSTGRES_PORT=5432`);
      envVars.add(`POSTGRES_USER=your-username`);
      envVars.add(`POSTGRES_PASSWORD=your-password`);
      envVars.add(`POSTGRES_DB=your-database`);
    }
  });
  
  return Array.from(envVars).sort().join('\n') + '\n';
}

/**
 * Generate test script for DAG
 */
function generateTestScript(dag) {
  return `#!/usr/bin/env python3
"""
Test script for ${dag.dag_id}
Validates DAG structure and runs basic tests
"""

import sys
from airflow.models import DagBag

def test_dag_loading():
    """Test that DAG loads without errors"""
    dagbag = DagBag(dag_folder='.', include_examples=False)
    
    # Check for import errors
    if dagbag.import_errors:
        print("❌ DAG import errors:")
        for filename, error in dagbag.import_errors.items():
            print(f"  {filename}: {error}")
        return False
    
    # Check DAG exists
    if '${dag.dag_id}' not in dagbag.dags:
        print("❌ DAG '${dag.dag_id}' not found in DagBag")
        return False
    
    print("✓ DAG loaded successfully")
    return True

def test_dag_structure():
    """Test DAG structure and configuration"""
    dagbag = DagBag(dag_folder='.', include_examples=False)
    dag = dagbag.get_dag('${dag.dag_id}')
    
    if not dag:
        print("❌ DAG not found")
        return False
    
    # Check task count
    expected_tasks = ${dag.tasks?.length || 0}
    actual_tasks = len(dag.tasks)
    
    if actual_tasks != expected_tasks:
        print(f"⚠ Warning: Expected {expected_tasks} tasks, found {actual_tasks}")
    else:
        print(f"✓ Task count correct: {actual_tasks} tasks")
    
    # Check for cycles
    try:
        dag.check_cycle()
        print("✓ No cycles detected in DAG")
    except Exception as e:
        print(f"❌ Cycle detected: {e}")
        return False
    
    # Check schedule
    if dag.schedule_interval:
        print(f"✓ Schedule interval: {dag.schedule_interval}")
    
    return True

def test_task_dependencies():
    """Test that all task dependencies are valid"""
    dagbag = DagBag(dag_folder='.', include_examples=False)
    dag = dagbag.get_dag('${dag.dag_id}')
    
    if not dag:
        return False
    
    for task in dag.tasks:
        # Check upstream tasks exist
        for upstream_id in task.upstream_task_ids:
            if upstream_id not in dag.task_dict:
                print(f"❌ Task '{task.task_id}' has invalid upstream: '{upstream_id}'")
                return False
        
        # Check downstream tasks exist
        for downstream_id in task.downstream_task_ids:
            if downstream_id not in dag.task_dict:
                print(f"❌ Task '{task.task_id}' has invalid downstream: '{downstream_id}'")
                return False
    
    print("✓ All task dependencies are valid")
    return True

if __name__ == '__main__':
    print(f"Testing DAG: ${dag.dag_id}\\n")
    
    tests = [
        ("DAG Loading", test_dag_loading),
        ("DAG Structure", test_dag_structure),
        ("Task Dependencies", test_task_dependencies),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        print(f"Running: {test_name}")
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            failed += 1
        print()
    
    print(f"Results: {passed} passed, {failed} failed")
    
    sys.exit(0 if failed == 0 else 1)
`;
}

/**
 * Generate .gitignore file
 */
function generateGitignore() {
  return `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Airflow
airflow.cfg
airflow.db
airflow-webserver.pid
logs/
plugins/
*.log

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Docker
docker-compose.override.yml
`;
}

/**
 * Get artifact package metadata
 */
export function getPackageMetadata(dag, code) {
  const tasks = dag.tasks || [];
  const operators = [...new Set(tasks.map(t => t.operator))];
  
  return {
    dag_id: dag.dag_id,
    files: [
      `${dag.dag_id}.py`,
      'README.md',
      'requirements.txt',
      'DEPLOYMENT.md',
      'dag_specification.json',
      'docker-compose.yml',
      '.env.example',
      'test_dag.py',
      '.gitignore'
    ],
    task_count: tasks.length,
    operators: operators,
    estimated_size: Buffer.byteLength(code) + 10240 // Code + ~10KB for docs
  };
}
