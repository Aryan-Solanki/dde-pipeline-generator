/**
 * Pipeline Specification Schema
 * Defines the structure for Airflow DAG JSON specifications
 */

/**
 * Valid Airflow operator types
 */
export const AIRFLOW_OPERATORS = [
    'BashOperator',
    'PythonOperator',
    'EmailOperator',
    'SimpleHttpOperator',
    'PostgresOperator',
    'MySqlOperator',
    'SqliteOperator',
    'MsSqlOperator',
    'OracleOperator',
    'S3FileTransformOperator',
    'S3ToRedshiftOperator',
    'RedshiftToS3Operator',
    'BigQueryOperator',
    'BigQueryCreateEmptyTableOperator',
    'GCSToGoogleDriveOperator',
    'SnowflakeOperator',
    'SparkSubmitOperator',
    'DatabricksSubmitRunOperator',
    'KubernetesPodOperator',
    'DockerOperator',
    'EmptyOperator',
    'BranchPythonOperator',
    'ShortCircuitOperator',
    'TriggerDagRunOperator',
    'ExternalTaskSensor',
    'HttpSensor',
    'S3KeySensor',
    'SqlSensor',
    'TimeDeltaSensor'
];

/**
 * JSON Schema for Pipeline Specification
 */
export const PIPELINE_SCHEMA = {
    type: 'object',
    required: ['dag_id', 'description', 'schedule', 'tasks'],
    properties: {
        dag_id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9_-]+$',
            description: 'Unique identifier for the DAG (lowercase, underscores, hyphens)'
        },
        description: {
            type: 'string',
            description: 'Human-readable description of the pipeline'
        },
        schedule: {
            type: 'string',
            description: 'Cron expression or preset (@daily, @hourly, etc.)',
            examples: ['@daily', '@hourly', '0 0 * * *', '*/15 * * * *', null]
        },
        start_date: {
            type: 'string',
            format: 'date',
            description: 'Start date for the DAG (YYYY-MM-DD)',
            default: '2024-01-01'
        },
        catchup: {
            type: 'boolean',
            description: 'Whether to backfill missing runs',
            default: false
        },
        tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags for categorizing the DAG',
            examples: [['etl', 'production'], ['data-ingestion'], ['analytics']]
        },
        default_args: {
            type: 'object',
            description: 'Default arguments for all tasks',
            properties: {
                owner: { type: 'string', default: 'airflow' },
                retries: { type: 'integer', default: 1 },
                retry_delay_minutes: { type: 'integer', default: 5 },
                email_on_failure: { type: 'boolean', default: false },
                email_on_retry: { type: 'boolean', default: false },
                depends_on_past: { type: 'boolean', default: false }
            }
        },
        tasks: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                required: ['task_id', 'operator_type'],
                properties: {
                    task_id: {
                        type: 'string',
                        pattern: '^[a-zA-Z0-9_]+$',
                        description: 'Unique task identifier'
                    },
                    operator_type: {
                        type: 'string',
                        enum: AIRFLOW_OPERATORS,
                        description: 'Airflow operator class name'
                    },
                    description: {
                        type: 'string',
                        description: 'Task description'
                    },
                    config: {
                        type: 'object',
                        description: 'Operator-specific configuration'
                    },
                    dependencies: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of upstream task_ids this task depends on'
                    },
                    trigger_rule: {
                        type: 'string',
                        enum: ['all_success', 'all_failed', 'all_done', 'one_success', 'one_failed', 'none_failed', 'none_skipped'],
                        default: 'all_success'
                    }
                }
            }
        },
        connections: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    conn_id: { type: 'string' },
                    conn_type: { type: 'string' },
                    description: { type: 'string' }
                }
            },
            description: 'Required Airflow connections'
        },
        variables: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    key: { type: 'string' },
                    description: { type: 'string' }
                }
            },
            description: 'Required Airflow variables'
        }
    }
};

/**
 * Validate pipeline specification against schema
 */
export function validatePipelineSpec(spec) {
    const errors = [];
    const warnings = [];

    // Required fields
    if (!spec.dag_id) errors.push('dag_id is required');
    if (!spec.description) errors.push('description is required');
    if (!spec.schedule) warnings.push('schedule is not set - DAG will not run automatically');
    if (!spec.tasks || spec.tasks.length === 0) errors.push('At least one task is required');

    // Validate dag_id format
    if (spec.dag_id && !/^[a-zA-Z0-9_-]+$/.test(spec.dag_id)) {
        errors.push('dag_id must contain only letters, numbers, underscores, and hyphens');
    }

    // Validate tasks
    if (spec.tasks) {
        const taskIds = new Set();
        
        spec.tasks.forEach((task, index) => {
            // Required task fields
            if (!task.task_id) errors.push(`Task ${index}: task_id is required`);
            if (!task.operator_type) errors.push(`Task ${index}: operator_type is required`);

            // Check task_id format
            if (task.task_id && !/^[a-zA-Z0-9_]+$/.test(task.task_id)) {
                errors.push(`Task ${task.task_id}: task_id must contain only letters, numbers, and underscores`);
            }

            // Check for duplicate task_ids
            if (task.task_id) {
                if (taskIds.has(task.task_id)) {
                    errors.push(`Duplicate task_id: ${task.task_id}`);
                }
                taskIds.add(task.task_id);
            }

            // Validate operator type
            if (task.operator_type && !AIRFLOW_OPERATORS.includes(task.operator_type)) {
                warnings.push(`Task ${task.task_id}: Unknown operator type '${task.operator_type}'`);
            }

            // Validate dependencies
            if (task.dependencies) {
                task.dependencies.forEach(dep => {
                    if (!taskIds.has(dep)) {
                        // Note: This might be a forward reference, which is valid
                        warnings.push(`Task ${task.task_id}: depends on '${dep}' which hasn't been defined yet`);
                    }
                });
            }
        });

        // Check for circular dependencies (simple check)
        spec.tasks.forEach(task => {
            if (task.dependencies && task.dependencies.includes(task.task_id)) {
                errors.push(`Task ${task.task_id}: cannot depend on itself`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Example pipeline specifications for reference
 */
export const EXAMPLE_PIPELINES = {
    simple_etl: {
        dag_id: 'simple_etl_pipeline',
        description: 'Simple ETL pipeline from PostgreSQL to S3',
        schedule: '@daily',
        start_date: '2024-01-01',
        catchup: false,
        tags: ['etl', 'example'],
        default_args: {
            owner: 'data_team',
            retries: 2,
            retry_delay_minutes: 5
        },
        tasks: [
            {
                task_id: 'extract_data',
                operator_type: 'PostgresOperator',
                description: 'Extract data from PostgreSQL',
                config: {
                    postgres_conn_id: 'postgres_default',
                    sql: 'SELECT * FROM source_table WHERE date = {{ ds }}'
                },
                dependencies: []
            },
            {
                task_id: 'transform_data',
                operator_type: 'PythonOperator',
                description: 'Transform extracted data',
                config: {
                    python_callable: 'transform_function'
                },
                dependencies: ['extract_data']
            },
            {
                task_id: 'load_to_s3',
                operator_type: 'S3FileTransformOperator',
                description: 'Load transformed data to S3',
                config: {
                    source_s3_key: 'temp/data.csv',
                    dest_s3_key: 'processed/{{ ds }}/data.csv',
                    transform_script: 'transform.py'
                },
                dependencies: ['transform_data']
            }
        ],
        connections: [
            { conn_id: 'postgres_default', conn_type: 'postgres', description: 'Source database' },
            { conn_id: 'aws_default', conn_type: 's3', description: 'S3 bucket' }
        ]
    }
};
