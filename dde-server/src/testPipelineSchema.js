/**
 * Quick unit tests for pipeline schema validation
 */

import { validatePipelineSpec, AIRFLOW_OPERATORS } from './pipelineSchema.js';

console.log('🧪 Testing Pipeline Schema Validation\n');
console.log('='.repeat(70));

// Test 1: Valid minimal spec
console.log('\n✅ Test 1: Valid minimal pipeline');
const validSpec = {
    dag_id: 'test_pipeline',
    description: 'Test pipeline',
    schedule: '@daily',
    tasks: [
        {
            task_id: 'task1',
            operator_type: 'PythonOperator',
            dependencies: []
        }
    ]
};
const result1 = validatePipelineSpec(validSpec);
console.log('Result:', result1);

// Test 2: Missing required fields
console.log('\n❌ Test 2: Missing required fields');
const invalidSpec1 = {
    description: 'No dag_id'
};
const result2 = validatePipelineSpec(invalidSpec1);
console.log('Result:', result2);

// Test 3: Invalid dag_id format
console.log('\n❌ Test 3: Invalid dag_id format');
const invalidSpec2 = {
    dag_id: 'invalid dag id!',
    description: 'Test',
    schedule: '@daily',
    tasks: [{ task_id: 'task1', operator_type: 'PythonOperator' }]
};
const result3 = validatePipelineSpec(invalidSpec2);
console.log('Result:', result3);

// Test 4: Duplicate task IDs
console.log('\n❌ Test 4: Duplicate task IDs');
const invalidSpec3 = {
    dag_id: 'test_dag',
    description: 'Test',
    schedule: '@daily',
    tasks: [
        { task_id: 'task1', operator_type: 'PythonOperator' },
        { task_id: 'task1', operator_type: 'BashOperator' }
    ]
};
const result4 = validatePipelineSpec(invalidSpec3);
console.log('Result:', result4);

// Test 5: Valid complex pipeline
console.log('\n✅ Test 5: Valid complex pipeline with dependencies');
const complexSpec = {
    dag_id: 'etl_pipeline',
    description: 'ETL Pipeline',
    schedule: '@daily',
    start_date: '2024-01-01',
    catchup: false,
    tags: ['etl', 'production'],
    tasks: [
        {
            task_id: 'extract',
            operator_type: 'PostgresOperator',
            description: 'Extract data',
            dependencies: []
        },
        {
            task_id: 'transform',
            operator_type: 'PythonOperator',
            description: 'Transform data',
            dependencies: ['extract']
        },
        {
            task_id: 'load',
            operator_type: 'S3FileTransformOperator',
            description: 'Load to S3',
            dependencies: ['transform']
        }
    ],
    connections: [
        { conn_id: 'postgres_default', conn_type: 'postgres' }
    ]
};
const result5 = validatePipelineSpec(complexSpec);
console.log('Result:', result5);

// Test 6: Self-dependency
console.log('\n❌ Test 6: Task depends on itself');
const invalidSpec4 = {
    dag_id: 'bad_dag',
    description: 'Test',
    schedule: '@daily',
    tasks: [
        {
            task_id: 'task1',
            operator_type: 'PythonOperator',
            dependencies: ['task1']
        }
    ]
};
const result6 = validatePipelineSpec(invalidSpec4);
console.log('Result:', result6);

console.log('\n' + '='.repeat(70));
console.log(`\n📊 Available Operators: ${AIRFLOW_OPERATORS.length}`);
console.log(`Examples: ${AIRFLOW_OPERATORS.slice(0, 5).join(', ')}...\n`);
