/**
 * Swagger/OpenAPI Configuration for DDE Pipeline Generator
 * Provides interactive API documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DDE Pipeline Generator API',
            version: '1.0.0',
            description: `
# DDE Pipeline Generator API

A comprehensive API for generating, validating, refining, and managing Apache Airflow DAG pipelines using AI.

## Features

- **AI-Powered Generation**: Create DAG specifications from natural language descriptions
- **Validation**: Comprehensive validation using Python validator service
- **Refinement**: Manual and automatic refinement of pipeline specifications
- **Repair Loop**: Automated error fixing with iterative improvements
- **Code Generation**: Generate production-ready Python DAG code
- **File Management**: Upload and parse requirements files
- **Monitoring**: Real-time metrics and health checks
- **Security**: Input validation, sanitization, and security headers

## Authentication

Currently, the API does not require authentication. For production use, implement appropriate authentication mechanisms.

## Rate Limiting

API requests are rate-limited to prevent abuse:
- Default: 10 requests per minute
- Configure via RPM_LIMIT environment variable

## Error Handling

All errors follow a consistent format:
\`\`\`json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2026-02-06T17:00:00.000Z",
  "path": "/api/endpoint",
  "details": {} // Optional validation details
}
\`\`\`
            `,
            contact: {
                name: 'API Support',
                email: 'support@dde.dev'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5050',
                description: 'Development server'
            },
            {
                url: 'http://localhost:5050',
                description: 'Local server'
            }
        ],
        tags: [
            {
                name: 'Health',
                description: 'Health check and monitoring endpoints'
            },
            {
                name: 'Metrics',
                description: 'Application metrics and statistics'
            },
            {
                name: 'Pipeline',
                description: 'DAG pipeline generation, validation, and refinement'
            },
            {
                name: 'Files',
                description: 'File upload and management'
            },
            {
                name: 'Models',
                description: 'AI model information'
            }
        ],
        components: {
            schemas: {
                HealthResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['ok', 'degraded', 'error'],
                            description: 'Overall health status'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        uptime: {
                            type: 'integer',
                            description: 'Server uptime in seconds'
                        },
                        version: {
                            type: 'string',
                            example: '1.0.0'
                        },
                        environment: {
                            type: 'string',
                            example: 'development'
                        },
                        checks: {
                            type: 'object',
                            properties: {
                                memory: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string' },
                                        system: { type: 'object' },
                                        process: { type: 'object' }
                                    }
                                },
                                disk: { type: 'object' },
                                validator: { type: 'object' },
                                ai: { type: 'object' }
                            }
                        }
                    }
                },
                MetricsResponse: {
                    type: 'object',
                    properties: {
                        requests: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer' },
                                success: { type: 'integer' },
                                errors: { type: 'integer' },
                                byEndpoint: { type: 'object' }
                            }
                        },
                        pipeline: {
                            type: 'object',
                            properties: {
                                generated: { type: 'integer' },
                                validated: { type: 'integer' },
                                refined: { type: 'integer' },
                                repaired: { type: 'integer' },
                                codeGenerated: { type: 'integer' }
                            }
                        },
                        errors: {
                            type: 'object',
                            properties: {
                                total: { type: 'integer' },
                                byType: { type: 'object' }
                            }
                        },
                        uptime: {
                            type: 'object',
                            properties: {
                                ms: { type: 'integer' },
                                seconds: { type: 'integer' },
                                minutes: { type: 'integer' },
                                hours: { type: 'integer' }
                            }
                        }
                    }
                },
                PipelineGenerateRequest: {
                    type: 'object',
                    required: ['message'],
                    properties: {
                        message: {
                            type: 'string',
                            minLength: 10,
                            maxLength: 5000,
                            example: 'Create a daily ETL pipeline that extracts data from PostgreSQL, transforms it, and loads to S3',
                            description: 'Natural language description of the desired pipeline'
                        },
                        parameters: {
                            type: 'object',
                            properties: {
                                schedule: {
                                    type: 'string',
                                    example: '@daily',
                                    description: 'Schedule interval (@once, @hourly, @daily, @weekly, @monthly, or cron)'
                                },
                                dataSource: {
                                    type: 'string',
                                    example: 'PostgreSQL',
                                    description: 'Data source type'
                                },
                                dataTarget: {
                                    type: 'string',
                                    example: 'S3',
                                    description: 'Data destination'
                                },
                                tags: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    maxItems: 20,
                                    example: ['etl', 'production']
                                }
                            }
                        }
                    }
                },
                DAGSpecification: {
                    type: 'object',
                    required: ['dag_id', 'description', 'schedule_interval', 'tasks'],
                    properties: {
                        dag_id: {
                            type: 'string',
                            pattern: '^[a-z0-9_-]+$',
                            example: 'etl_postgresql_to_s3'
                        },
                        description: {
                            type: 'string',
                            example: 'ETL pipeline from PostgreSQL to S3'
                        },
                        schedule_interval: {
                            type: 'string',
                            example: '@daily'
                        },
                        start_date: {
                            type: 'string',
                            format: 'date',
                            example: '2026-01-01'
                        },
                        tags: {
                            type: 'array',
                            items: { type: 'string' }
                        },
                        tasks: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['task_id', 'operator'],
                                properties: {
                                    task_id: { type: 'string' },
                                    operator: { type: 'string' },
                                    dependencies: {
                                        type: 'array',
                                        items: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                },
                ValidationResult: {
                    type: 'object',
                    properties: {
                        valid: {
                            type: 'boolean',
                            description: 'Whether the DAG is valid'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string' },
                                    message: { type: 'string' },
                                    field: { type: 'string' },
                                    line: { type: 'integer' }
                                }
                            }
                        },
                        warnings: {
                            type: 'array',
                            items: { type: 'object' }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error message'
                        },
                        statusCode: {
                            type: 'integer',
                            description: 'HTTP status code'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time'
                        },
                        path: {
                            type: 'string',
                            description: 'Request path'
                        },
                        details: {
                            type: 'object',
                            description: 'Additional error details'
                        }
                    }
                }
            },
            responses: {
                BadRequest: {
                    description: 'Bad request - validation failed',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                ServerError: {
                    description: 'Internal server error',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                },
                ServiceUnavailable: {
                    description: 'Service unavailable (AI or validator service)',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/swagger-routes.js'] // Path to annotated routes
};

export const swaggerSpec = swaggerJsdoc(options);
