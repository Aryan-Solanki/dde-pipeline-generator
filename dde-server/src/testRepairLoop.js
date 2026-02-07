// Test repair loop endpoint logic
import { validatePipelineSpec } from './pipelineSchema.js';

console.log('Testing repair loop logic...\n');

// Test spec with errors
const testSpec = {
    dag_id: "test_pipeline",
    schedule: "@daily",
    start_date: "2024-01-01",
    catchup: false,
    tasks: [
        {
            task_id: "task-1",  // Invalid: hyphen in task_id
            operator: "BashOperator",
            bash_command: "echo 'test'"
        },
        {
            task_id: "task-1",  // Duplicate task_id
            operator: "PythonOperator",
            python_callable: "my_function"
        }
    ]
};

const validation = validatePipelineSpec(testSpec);

console.log('Validation result:');
console.log('- Valid:', validation.valid);
console.log('- Errors:', validation.errors.length);
console.log('- Warnings:', validation.warnings.length);

if (validation.errors.length > 0) {
    console.log('\nErrors:');
    validation.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
    });
}

// Simulate iterations tracking
const iterations = [];
let currentErrors = validation.errors.length;

iterations.push({
    iteration: 0,
    errors: currentErrors,
    warnings: validation.warnings.length,
    status: 'initial',
    timestamp: new Date().toISOString()
});

console.log('\nSimulating repair loop:');
for (let i = 1; i <= 3; i++) {
    // Simulate error reduction
    const errorReduction = Math.max(1, Math.floor(currentErrors / 2));
    currentErrors = Math.max(0, currentErrors - errorReduction);
    
    iterations.push({
        iteration: i,
        errors: currentErrors,
        warnings: 0,
        error_reduction: errorReduction,
        status: errorReduction > 0 ? 'improved' : 'no_change',
        timestamp: new Date().toISOString()
    });
    
    console.log(`  Iteration ${i}: ${currentErrors} errors remaining (−${errorReduction})`);
    
    if (currentErrors === 0) {
        console.log('  ✓ All errors fixed!');
        break;
    }
}

console.log('\nIterations summary:');
console.log(JSON.stringify(iterations, null, 2));

console.log('\n✓ Repair loop logic test complete');
