/**
 * Test script for prompt filter
 */

import { isPipelineRelated, getPipelineExamples } from './promptFilter.js';

console.log('Testing Prompt Filter Module\n');
console.log('='.repeat(60));

const testCases = [
    // Should PASS (pipeline-related)
    {
        prompt: "Create a daily ETL pipeline from PostgreSQL to BigQuery",
        expected: true
    },
    {
        prompt: "Generate an Airflow DAG to process CSV files from S3",
        expected: true
    },
    {
        prompt: "Build a workflow that runs every hour to fetch API data",
        expected: true
    },
    {
        prompt: "I need a pipeline to move data from MySQL to Snowflake",
        expected: true
    },
    {
        prompt: "Create a task that executes a Python script daily",
        expected: true
    },
    
    // Should FAIL (not pipeline-related)
    {
        prompt: "Hello, how are you?",
        expected: false
    },
    {
        prompt: "Tell me a joke",
        expected: false
    },
    {
        prompt: "What's the weather like?",
        expected: false
    },
    {
        prompt: "Thanks for your help",
        expected: false
    },
    
    // Edge cases
    {
        prompt: "Help me automate my data processing workflow",
        expected: true
    },
    {
        prompt: "How do I schedule a batch job?",
        expected: true
    }
];

console.log('\n📝 Running test cases...\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    const result = isPipelineRelated(test.prompt);
    const success = result.isPipelineRelated === test.expected;
    
    const status = success ? '✅ PASS' : '❌ FAIL';
    const emoji = result.isPipelineRelated ? '🟢' : '🔴';
    
    console.log(`${status} Test ${index + 1}: ${emoji}`);
    console.log(`   Prompt: "${test.prompt}"`);
    console.log(`   Result: ${result.isPipelineRelated} (confidence: ${result.confidence.toFixed(2)})`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Reason: ${result.reason}`);
    console.log();
    
    if (success) passed++;
    else failed++;
});

console.log('='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

// Show examples
console.log('='.repeat(60));
console.log('\n💡 Pipeline Examples:\n');
const examples = getPipelineExamples();
examples.examples.forEach((ex, i) => {
    console.log(`${i + 1}. ${ex}`);
});

console.log('\n' + '='.repeat(60));
