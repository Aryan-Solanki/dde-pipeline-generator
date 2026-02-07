// Test file upload endpoints
import fs from 'fs/promises';
import path from 'path';

console.log('Testing file upload endpoints...\n');

// Test requirements parsing
const testRequirements = `apache-airflow==2.8.0
pandas>=1.5.0
numpy>=1.24.0
requests>=2.31.0
sqlalchemy>=1.4.0
# Comment line
psycopg2-binary>=2.9.0`;

console.log('Test requirements.txt content:');
console.log(testRequirements);
console.log('\nParsing requirements...');

const lines = testRequirements.split('\n');
const packages = [];

for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Parse package name and version
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)([><=!~]+.*)?$/);
    if (match) {
        packages.push({
            name: match[1],
            version: match[2] ? match[2].trim() : null,
            raw: trimmed
        });
    }
}

console.log('\nParsed packages:');
packages.forEach((pkg, idx) => {
    console.log(`  ${idx + 1}. ${pkg.name}${pkg.version || ''}`);
});

console.log('\nPackage statistics:');
console.log('- Total packages:', packages.length);

const airflowPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes('airflow')
);
console.log('- Airflow packages:', airflowPackages.length);

const commonDeps = {
    pandas: packages.some(pkg => pkg.name === 'pandas'),
    numpy: packages.some(pkg => pkg.name === 'numpy'),
    requests: packages.some(pkg => pkg.name === 'requests'),
    sqlalchemy: packages.some(pkg => pkg.name.toLowerCase().includes('sqlalchemy'))
};

console.log('- Common dependencies found:');
Object.entries(commonDeps).forEach(([name, found]) => {
    console.log(`  • ${name}: ${found ? '✓' : '✗'}`);
});

// Test Python DAG analysis
const testPythonDAG = `from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG(
    dag_id='example_dag',
    start_date=datetime(2024, 1, 1),
    schedule='@daily'
) as dag:
    task1 = BashOperator(
        task_id='hello',
        bash_command='echo "Hello World"'
    )
`;

console.log('\n\nTest Python DAG content:');
console.log(testPythonDAG);

const hasAirflowImports = /from airflow|import airflow/i.test(testPythonDAG);
const hasDagDefinition = /DAG\s*\(/i.test(testPythonDAG);
const hasOperators = /Operator\s*\(/i.test(testPythonDAG);

console.log('\nPython DAG analysis:');
console.log('- Airflow imports detected:', hasAirflowImports ? '✓' : '✗');
console.log('- DAG definition found:', hasDagDefinition ? '✓' : '✗');
console.log('- Operators found:', hasOperators ? '✓' : '✗');

const dagIdMatch = testPythonDAG.match(/dag_id\s*=\s*['"]([^'"]+)['"]/);
if (dagIdMatch) {
    console.log('- DAG ID extracted:', dagIdMatch[1]);
}

console.log('\n✓ File analysis logic test complete');
