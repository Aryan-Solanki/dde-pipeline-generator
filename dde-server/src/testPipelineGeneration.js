/**
 * Test script for pipeline generation
 */

const BASE_URL = 'http://localhost:5050';

async function testPipelineGeneration() {
    console.log('🧪 Testing Pipeline Generation\n');
    console.log('='.repeat(70));

    const testCases = [
        {
            name: 'Simple ETL Pipeline',
            prompt: 'Create a daily pipeline that extracts data from PostgreSQL and loads it to S3',
            parameters: {
                schedule: '@daily',
                tags: ['etl', 'production']
            }
        },
        {
            name: 'API Data Ingestion',
            prompt: 'Build a pipeline that fetches data from a REST API every hour and stores it in MongoDB',
            parameters: {
                schedule: '@hourly',
                tags: ['api', 'ingestion']
            }
        },
        {
            name: 'Data Transfer',
            prompt: 'Generate a workflow to move data from MySQL to BigQuery with transformation',
            parameters: {
                dataSource: 'MySQL',
                dataTarget: 'BigQuery',
                tags: ['migration']
            }
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n📝 Test: ${testCase.name}`);
        console.log('-'.repeat(70));
        console.log(`Prompt: "${testCase.prompt}"`);
        console.log(`Parameters:`, testCase.parameters);
        
        try {
            const response = await fetch(`${BASE_URL}/api/pipeline/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: testCase.prompt,
                    parameters: testCase.parameters
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.log(`❌ Failed: ${error.error}`);
                continue;
            }

            const data = await response.json();
            
            console.log(`\n✅ Generated Specification:`);
            console.log(`   DAG ID: ${data.specification.dag_id}`);
            console.log(`   Description: ${data.specification.description}`);
            console.log(`   Schedule: ${data.specification.schedule}`);
            console.log(`   Tasks: ${data.specification.tasks.length}`);
            
            data.specification.tasks.forEach((task, i) => {
                console.log(`      ${i + 1}. ${task.task_id} (${task.operator_type})`);
                if (task.dependencies && task.dependencies.length > 0) {
                    console.log(`         Dependencies: ${task.dependencies.join(', ')}`);
                }
            });

            console.log(`\n   Validation:`);
            console.log(`      Valid: ${data.validation.valid ? '✅' : '❌'}`);
            if (data.validation.errors.length > 0) {
                console.log(`      Errors: ${data.validation.errors.length}`);
                data.validation.errors.forEach(err => console.log(`         - ${err}`));
            }
            if (data.validation.warnings.length > 0) {
                console.log(`      Warnings: ${data.validation.warnings.length}`);
                data.validation.warnings.forEach(warn => console.log(`         - ${warn}`));
            }

            if (data.specification.connections) {
                console.log(`\n   Connections Required: ${data.specification.connections.length}`);
                data.specification.connections.forEach(conn => {
                    console.log(`      - ${conn.conn_id} (${conn.conn_type})`);
                });
            }

        } catch (err) {
            console.log(`❌ Error: ${err.message}`);
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ Tests complete!\n');
}

// Run tests
testPipelineGeneration().catch(console.error);
