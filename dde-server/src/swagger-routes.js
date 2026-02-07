/**
 * Swagger/OpenAPI Route Documentation
 * JSDoc annotations for all API endpoints
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Welcome message and API information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "DDE Server is running. Use /api/health to check status."
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     description: Returns server health status with optional detailed information
 *     tags: [Health]
 *     parameters:
 *       - in: query
 *         name: detailed
 *         schema:
 *           type: boolean
 *         description: Include detailed system information
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Kubernetes readiness probe
 *     description: Checks if the server is ready to accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ready:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Server is not ready
 */

/**
 * @swagger
 * /api/health/live:
 *   get:
 *     summary: Kubernetes liveness probe
 *     description: Checks if the server is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alive:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: integer
 *                   description: Uptime in seconds
 */

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Application metrics
 *     description: Returns real-time application metrics and statistics
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Metrics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsResponse'
 */

/**
 * @swagger
 * /api/pipeline/examples:
 *   get:
 *     summary: Get pipeline examples
 *     description: Returns example pipeline descriptions for inspiration
 *     tags: [Pipeline]
 *     responses:
 *       200:
 *         description: List of pipeline examples
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   examples:
 *                     type: array
 *                     items:
 *                       type: string
 */

/**
 * @swagger
 * /api/models:
 *   get:
 *     summary: List available AI models
 *     description: Returns list of available AI models for pipeline generation
 *     tags: [Models]
 *     responses:
 *       200:
 *         description: List of models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/pipeline/generate:
 *   post:
 *     summary: Generate pipeline specification
 *     description: Generate an Apache Airflow DAG specification from natural language description using AI
 *     tags: [Pipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PipelineGenerateRequest'
 *     responses:
 *       200:
 *         description: Pipeline generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 specification:
 *                   $ref: '#/components/schemas/DAGSpecification'
 *                 validation:
 *                   type: object
 *                   properties:
 *                     schema_validation:
 *                       $ref: '#/components/schemas/ValidationResult'
 *                     python_validation:
 *                       $ref: '#/components/schemas/ValidationResult'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                     model:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */

/**
 * @swagger
 * /api/pipeline/validate:
 *   post:
 *     summary: Validate DAG specification or code
 *     description: Validate a DAG specification or Python code using the Python validator service
 *     tags: [Pipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dag_code:
 *                 type: string
 *                 description: Python DAG code to validate
 *               dag_spec:
 *                 $ref: '#/components/schemas/DAGSpecification'
 *             oneOf:
 *               - required: [dag_code]
 *               - required: [dag_spec]
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResult'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       502:
 *         description: Validator service unavailable
 */

/**
 * @swagger
 * /api/pipeline/refine:
 *   post:
 *     summary: Refine pipeline with feedback
 *     description: Refine a pipeline specification based on user feedback and validation errors
 *     tags: [Pipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_spec, feedback]
 *             properties:
 *               current_spec:
 *                 $ref: '#/components/schemas/DAGSpecification'
 *               feedback:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 2000
 *                 example: "Add retry logic with 3 attempts"
 *               validation:
 *                 $ref: '#/components/schemas/ValidationResult'
 *     responses:
 *       200:
 *         description: Refined specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 specification:
 *                   $ref: '#/components/schemas/DAGSpecification'
 *                 validation:
 *                   type: object
 *                 metadata:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */

/**
 * @swagger
 * /api/pipeline/repair:
 *   post:
 *     summary: Auto-repair pipeline errors
 *     description: Automatically fix validation errors through iterative AI refinement (max 5 iterations)
 *     tags: [Pipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_spec]
 *             properties:
 *               current_spec:
 *                 $ref: '#/components/schemas/DAGSpecification'
 *               max_iterations:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 3
 *                 description: Maximum repair iterations
 *               validation:
 *                 $ref: '#/components/schemas/ValidationResult'
 *     responses:
 *       200:
 *         description: Repair result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 specification:
 *                   $ref: '#/components/schemas/DAGSpecification'
 *                 validation:
 *                   type: object
 *                 iterations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       iteration:
 *                         type: integer
 *                       errors:
 *                         type: integer
 *                       status:
 *                         type: string
 *                         enum: [improved, no_change, regressed]
 *                 metadata:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */

/**
 * @swagger
 * /api/pipeline/generate-code:
 *   post:
 *     summary: Generate Python DAG code
 *     description: Generate production-ready Python code from a DAG specification
 *     tags: [Pipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [specification]
 *             properties:
 *               specification:
 *                 $ref: '#/components/schemas/DAGSpecification'
 *     responses:
 *       200:
 *         description: Code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 code:
 *                   type: string
 *                   description: Generated Python code
 *                 filename:
 *                   type: string
 *                   example: "my_dag.py"
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     dag_id:
 *                       type: string
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *                     lines:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/pipeline/export:
 *   post:
 *     summary: Export complete pipeline package
 *     description: Generate and download a complete ZIP package containing DAG code, documentation, tests, deployment files, and configuration templates
 *     tags: [Pipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [specification]
 *             properties:
 *               specification:
 *                 $ref: '#/components/schemas/DAGSpecification'
 *               additionalPackages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Additional Python packages to include in requirements.txt
 *                 example: ["pandas==2.0.0", "boto3>=1.26.0"]
 *     responses:
 *       200:
 *         description: ZIP package generated successfully
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: application/zip
 *           Content-Disposition:
 *             schema:
 *               type: string
 *               example: attachment; filename="my_dag_pipeline.zip"
 *           X-Package-Files:
 *             schema:
 *               type: integer
 *               description: Number of files in the package
 *           X-Task-Count:
 *             schema:
 *               type: integer
 *               description: Number of tasks in the DAG
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *               description: |
 *                 ZIP archive containing:
 *                 - {dag_id}.py - Executable Python DAG file
 *                 - README.md - Complete pipeline documentation
 *                 - requirements.txt - Python dependencies
 *                 - DEPLOYMENT.md - Deployment instructions
 *                 - dag_specification.json - Original DAG spec
 *                 - docker-compose.yml - Local testing environment
 *                 - .env.example - Environment variable template
 *                 - test_dag.py - Automated test script
 *                 - .gitignore - Git ignore configuration
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a file
 *     description: Upload a file (Python, text, JSON, YAML)
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (max 5MB)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 file:
 *                   type: object
 *                   properties:
 *                     originalname:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     mimetype:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     path:
 *                       type: string
 *       400:
 *         description: Invalid file or file too large
 *       413:
 *         description: File size exceeds limit (5MB)
 */

/**
 * @swagger
 * /api/files/parse-requirements:
 *   post:
 *     summary: Parse requirements.txt content
 *     description: Parse Python requirements file content and extract packages
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 51200
 *                 description: Content of requirements.txt file
 *                 example: "apache-airflow==2.8.0\npandas>=1.5.0\nnumpy"
 *     responses:
 *       200:
 *         description: Requirements parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 packages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       version:
 *                         type: string
 *                       operator:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /api/files/{filename}:
 *   delete:
 *     summary: Delete uploaded file
 *     description: Delete a previously uploaded file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid filename or directory traversal attempt
 *       404:
 *         description: File not found
 */

// Export empty object to make this a module
export default {};
