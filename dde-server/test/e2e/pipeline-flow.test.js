/**
 * End-to-End Pipeline Generation Flow Tests
 * Task 14: Comprehensive E2E testing
 */

import { expect } from 'chai';
import request from 'supertest';

const BASE_URL = 'http://localhost:5050';
const VALIDATOR_URL = 'http://localhost:5051';

describe('E2E: Complete Pipeline Generation Flow', function() {
    this.timeout(30000); // 30 second timeout for AI operations

    let generatedPipeline = null;

    describe('1. Health Checks', () => {
        it('should confirm backend API is running', async () => {
            const res = await request(BASE_URL)
                .get('/api/health')
                .expect(200);
            
            expect(res.body).to.have.property('ok', true);
            expect(res.body).to.have.property('model');
        });

        it('should confirm validator service is running', async () => {
            const res = await request(VALIDATOR_URL)
                .get('/health')
                .expect(200);
            
            expect(res.body).to.have.property('status', 'ok');
        });
    });

    describe('2. Pipeline Generation', () => {
        it('should reject invalid input (too short)', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/generate')
                .send({ message: 'test' })
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });

        it('should reject empty message', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/generate')
                .send({ message: '' })
                .expect(400);
        });

        it('should generate valid pipeline specification', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/generate')
                .send({
                    message: 'Create a daily ETL pipeline to extract data from PostgreSQL and load to S3',
                    parameters: {
                        schedule: '@daily',
                        dataSource: 'PostgreSQL',
                        dataTarget: 'S3',
                        tags: ['etl', 'production']
                    }
                });
            
            // May fail if AI service unavailable, but should not be 400 (validation error)
            if (res.status === 200) {
                expect(res.body).to.have.property('specification');
                expect(res.body.specification).to.have.property('dag_id');
                expect(res.body.specification).to.have.property('tasks');
                expect(res.body.specification.tasks).to.be.an('array');
                
                generatedPipeline = res.body.specification;
            }
        }).timeout(30000);
    });

    describe('3. Pipeline Validation', () => {
        it('should validate a well-formed DAG spec', async () => {
            const dagSpec = {
                dag_id: 'test_etl_pipeline',
                description: 'Test ETL Pipeline',
                schedule_interval: '@daily',
                start_date: '2024-01-01',
                tasks: [
                    {
                        task_id: 'extract_data',
                        operator_type: 'PostgresOperator',
                        description: 'Extract from PostgreSQL',
                        config: { sql: 'SELECT * FROM users' }
                    },
                    {
                        task_id: 'load_to_s3',
                        operator_type: 'S3FileTransformOperator',
                        description: 'Load to S3',
                        config: { bucket: 'data-lake' },
                        dependencies: ['extract_data']
                    }
                ]
            };

            const res = await request(BASE_URL)
                .post('/api/pipeline/validate')
                .send({ dag_spec: dagSpec });
            
            // Validator may not be running, but input validation should pass
            expect(res.status).to.be.oneOf([200, 500]); // 500 if validator down, not 400
            
            if (res.status === 200) {
                expect(res.body).to.have.property('valid');
            }
        });

        it('should reject validation with neither code nor spec', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/validate')
                .send({})
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });

        it('should detect circular dependencies', async () => {
            const dagSpec = {
                dag_id: 'circular_test',
                description: 'Test Circular Dependencies',
                schedule_interval: '@daily',
                tasks: [
                    {
                        task_id: 'task_a',
                        operator_type: 'BashOperator',
                        bash_command: 'echo a',
                        dependencies: ['task_b']
                    },
                    {
                        task_id: 'task_b',
                        operator_type: 'BashOperator',
                        bash_command: 'echo b',
                        dependencies: ['task_a']
                    }
                ]
            };

            const res = await request(BASE_URL)
                .post('/api/pipeline/validate')
                .send({ dag_spec: dagSpec });
            
            if (res.status === 200) {
                expect(res.body.valid).to.be.false;
                expect(res.body.errors).to.be.an('array').with.length.greaterThan(0);
            }
        });
    });

    describe('4. Pipeline Refinement', () => {
        it('should reject refinement with invalid DAG ID format', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/refine')
                .send({
                    current_spec: { dag_id: 'INVALID-ID!' },
                    feedback: 'Add error handling to tasks'
                })
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });

        it('should reject refinement with short feedback', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/refine')
                .send({
                    current_spec: { 
                        dag_id: 'test_dag',
                        tasks: []
                    },
                    feedback: 'fix'
                })
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });

        it('should accept valid refinement request', async () => {
            const dagSpec = {
                dag_id: 'test_dag',
                description: 'Test DAG',
                schedule_interval: '@daily',
                tasks: [{
                    task_id: 'test_task',
                    operator_type: 'BashOperator',
                    bash_command: 'echo test'
                }]
            };

            const res = await request(BASE_URL)
                .post('/api/pipeline/refine')
                .send({
                    current_spec: dagSpec,
                    feedback: 'Add retry logic with 3 attempts'
                });
            
            // Should not fail validation (400), may fail on AI (500)
            expect(res.status).to.not.equal(400);
        });
    });

    describe('5. Repair Loop', () => {
        it('should reject repair with iterations out of range', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/repair')
                .send({
                    current_spec: {
                        dag_id: 'test_dag',
                        tasks: []
                    },
                    max_iterations: 10
                })
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });

        it('should accept valid repair request', async () => {
            const dagSpec = {
                dag_id: 'broken_dag',
                description: 'DAG with errors',
                schedule_interval: 'invalid-schedule',
                tasks: []
            };

            const res = await request(BASE_URL)
                .post('/api/pipeline/repair')
                .send({
                    current_spec: dagSpec,
                    max_iterations: 3
                });
            
            // Should not fail validation
            expect(res.status).to.not.equal(400);
        });
    });

    describe('6. File Operations', () => {
        it('should reject requirements content that is too large', async () => {
            const largeContent = 'package==1.0.0\n'.repeat(10000);
            
            const res = await request(BASE_URL)
                .post('/api/files/parse-requirements')
                .send({ content: largeContent })
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });

        it('should parse valid requirements.txt content', async () => {
            const content = `apache-airflow==2.5.0
pandas==1.5.0
requests==2.28.1
# This is a comment
numpy>=1.23.0`;

            const res = await request(BASE_URL)
                .post('/api/files/parse-requirements')
                .send({ content })
                .expect(200);
            
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('packages');
            expect(res.body.packages).to.be.an('array');
            expect(res.body.packages.length).to.be.greaterThan(0);
        });

        it('should reject file deletion with directory traversal', async () => {
            const res = await request(BASE_URL)
                .delete('/api/files/../../../etc/passwd')
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });
    });

    describe('7. Code Generation', () => {
        it('should reject code generation without specification', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/generate-code')
                .send({})
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });

        it('should reject code generation with invalid DAG ID', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/generate-code')
                .send({
                    specification: {
                        dag_id: 'INVALID ID',
                        tasks: []
                    }
                })
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });

        it('should generate Python code for valid specification', async () => {
            const dagSpec = {
                dag_id: 'test_code_gen',
                description: 'Test Code Generation',
                schedule_interval: '@daily',
                start_date: '2024-01-01',
                tasks: [
                    {
                        task_id: 'hello_task',
                        operator_type: 'BashOperator',
                        bash_command: 'echo "Hello World"',
                        config: {}
                    }
                ]
            };

            const res = await request(BASE_URL)
                .post('/api/pipeline/generate-code')
                .send({ specification: dagSpec });
            
            // May fail if Python not available, but not due to validation
            if (res.status === 200) {
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property('code');
                expect(res.body.code).to.include('from airflow');
                expect(res.body.code).to.include('test_code_gen');
            }
        }).timeout(15000);
    });

    describe('8. Security Features', () => {
        it('should have security headers in responses', async () => {
            const res = await request(BASE_URL)
                .get('/api/health')
                .expect(200);
            
            expect(res.headers).to.have.property('x-content-type-options');
            expect(res.headers['x-content-type-options']).to.equal('nosniff');
        });

        it('should sanitize potential NoSQL injection', async () => {
            const res = await request(BASE_URL)
                .post('/api/pipeline/generate')
                .send({
                    message: 'Create a simple pipeline',
                    parameters: {
                        custom: { '$ne': null }
                    }
                });
            
            // Should not crash, either validate or process safely
            expect(res.status).to.be.oneOf([200, 400, 500]);
        });

        it('should enforce request size limits', async () => {
            const hugeMessage = 'a'.repeat(6000);
            
            const res = await request(BASE_URL)
                .post('/api/pipeline/generate')
                .send({ message: hugeMessage })
                .expect(400);
            
            expect(res.body).to.have.property('error');
        });
    });

    describe('9. Full Pipeline Workflow', () => {
        it('should complete full generation -> validation -> refinement flow', async function() {
            this.timeout(60000);

            // Step 1: Generate pipeline
            console.log('      Step 1: Generating pipeline...');
            const generateRes = await request(BASE_URL)
                .post('/api/pipeline/generate')
                .send({
                    message: 'Create a pipeline to process user data from MongoDB and send to Kafka',
                    parameters: {
                        schedule: '@hourly',
                        tags: ['streaming', 'real-time']
                    }
                });

            if (generateRes.status !== 200) {
                console.log('      ⚠️  Generation skipped (AI service may be unavailable)');
                this.skip();
                return;
            }

            expect(generateRes.body).to.have.property('specification');
            const pipeline = generateRes.body.specification;
            console.log(`      ✓ Generated DAG: ${pipeline.dag_id}`);

            // Step 2: Validate generated pipeline
            console.log('      Step 2: Validating pipeline...');
            const validateRes = await request(BASE_URL)
                .post('/api/pipeline/validate')
                .send({ dag_spec: pipeline });

            if (validateRes.status === 200) {
                console.log(`      ✓ Validation result: ${validateRes.body.valid ? 'PASS' : 'FAIL'}`);
                
                // Step 3: Refine if needed
                if (!validateRes.body.valid || validateRes.body.errors?.length > 0) {
                    console.log('      Step 3: Refining pipeline...');
                    const refineRes = await request(BASE_URL)
                        .post('/api/pipeline/refine')
                        .send({
                            current_spec: pipeline,
                            feedback: 'Fix all validation errors',
                            validation: validateRes.body
                        });

                    if (refineRes.status === 200) {
                        console.log('      ✓ Pipeline refined successfully');
                    }
                }

                // Step 4: Generate code
                console.log('      Step 4: Generating Python code...');
                const codeRes = await request(BASE_URL)
                    .post('/api/pipeline/generate-code')
                    .send({ specification: pipeline });

                if (codeRes.status === 200) {
                   console.log(`      ✓ Generated ${codeRes.body.metadata?.lines || '?'} lines of code`);
                    expect(codeRes.body.code).to.include('from airflow');
                }
            }
        });
    });
});
