# Developer Guide

> Guide to contributing, extending, and developing the DDE Pipeline Generator

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Structure](#code-structure)
- [Adding Features](#adding-features)
- [Testing](#testing)
- [Code Style](#code-style)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js**: 20.x or higher
- **Python**: 3.9 or higher
- **Git**: Latest version
- **Code Editor**: VS Code (recommended)

### Recommended VS Code Extensions

- ESLint
- Prettier
- Python
- GitLens
- REST Client
- Docker (if using containers)

## Development Setup

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/dde-pipeline-generator.git
cd dde-pipeline-generator

# Install backend dependencies
cd dde-server
npm install

# Install frontend dependencies
cd ../dde-ui
npm install

# Install Python dependencies
cd ../dde-server
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `.env` files:

**dde-server/.env:**
```env
NODE_ENV=development
PORT=5050
VALIDATOR_URL=http://localhost:5051
AI_SERVICE_URL=http://localhost:11434
AI_MODEL=qwen2.5-coder:32b-instruct-q4_K_M
LOG_LEVEL=debug
```

### 3. Start Development Servers

```bash
# Terminal 1: Python validator
cd dde-server
python validator.py

# Terminal 2: Backend server
cd dde-server
npm run dev

# Terminal 3: Frontend
cd dde-ui
npm run dev
```

### 4. Verify Setup

```bash
# Check backend
curl http://localhost:5050/api/health

# Check validator
curl http://localhost:5051/health

# Open frontend
# Navigate to http://localhost:5173
```

## Code Structure

### Backend Structure

```
dde-server/
├── src/
│   ├── server.js              # Main application
│   ├── upbClient.js           # AI service client
│   ├── sse.js                 # Server-Sent Events
│   ├── rateLimit.js           # Rate limiting config
│   ├── swagger.js             # OpenAPI specification
│   ├── swagger-routes.js      # Route documentation
│   ├── errors/
│   │   ├── customErrors.js    # Custom error classes
│   │   ├── errorHandler.js    # Error middleware
│   │   └── monitoring.js      # Metrics tracking
│   └── prompts/
│       ├── systemPrompt.js    # AI prompts
│       └── examples.js        # Example data
├── validator.py               # Python validator
├── logs/                      # Application logs
├── uploads/                   # Uploaded files
├── tests/                     # Test files
└── docs/                      # Documentation
```

### Frontend Structure

```
dde-ui/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component
│   ├── features/
│   │   └── chat/
│   │       ├── ChatPage.tsx           # Main page
│   │       ├── api.ts                 # API client
│   │       ├── types.ts               # Types
│   │       └── components/
│   │           ├── Composer.tsx       # Input
│   │           ├── MessageList.tsx    # Messages
│   │           ├── Sidebar.tsx        # Settings
│   │           └── ThreadItem.tsx     # Message item
│   └── shared/
│       ├── ui/               # Reusable components
│       └── lib/              # Utilities
└── public/                   # Static assets
```

## Adding Features

### Adding a New API Endpoint

**Step 1: Define the route in server.js**

```javascript
// Add after existing routes
app.post("/api/pipeline/analyze", async (req, res, next) => {
  try {
    const { dag } = req.body;
    
    // Validation
    if (!dag) {
      throw new ValidationError('DAG specification is required');
    }
    
    // Business logic
    const analysis = await analyzePipeline(dag);
    
    // Log success
    monitoring.incrementOperationCount('pipeline_analyzed');
    logger.info('Pipeline analyzed', { dag_id: dag.dag_id });
    
    // Response
    res.json({
      analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});
```

**Step 2: Add JSDoc documentation in swagger-routes.js**

```javascript
/**
 * @swagger
 * /api/pipeline/analyze:
 *   post:
 *     summary: Analyze a DAG pipeline
 *     tags: [Pipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dag
 *             properties:
 *               dag:
 *                 $ref: '#/components/schemas/DAGSpecification'
 *     responses:
 *       200:
 *         description: Pipeline analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysis:
 *                   type: object
 *                 timestamp:
 *                   type: string
 */
```

**Step 3: Add schema to swagger.js (if needed)**

```javascript
// In components.schemas
PipelineAnalysis: {
  type: 'object',
  properties: {
    complexity: {
      type: 'string',
      enum: ['low', 'medium', 'high']
    },
    estimatedRuntime: {
      type: 'number',
      description: 'Estimated runtime in seconds'
    },
    recommendations: {
      type: 'array',
      items: { type: 'string' }
    }
  }
}
```

**Step 4: Add tests**

```javascript
// tests/pipeline-analyze.test.js
const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/server');

describe('POST /api/pipeline/analyze', () => {
  it('should analyze a valid pipeline', async () => {
    const dag = {
      dag_id: 'test_pipeline',
      tasks: [...]
    };
    
    const res = await request(app)
      .post('/api/pipeline/analyze')
      .send({ dag })
      .expect(200);
    
    expect(res.body).to.have.property('analysis');
    expect(res.body.analysis).to.have.property('complexity');
  });
  
  it('should return error for missing DAG', async () => {
    const res = await request(app)
      .post('/api/pipeline/analyze')
      .send({})
      .expect(400);
    
    expect(res.body).to.have.property('error');
  });
});
```

### Adding a Custom Error Class

**Step 1: Create error class in errors/customErrors.js**

```javascript
export class RateLimitExceededError extends Error {
  constructor(message = 'Rate limit exceeded', details = {}) {
    super(message);
    this.name = 'RateLimitExceededError';
    this.statusCode = 429;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString(),
      details: this.details
    };
  }
}
```

**Step 2: Use in error handler**

```javascript
// errors/errorHandler.js
import { RateLimitExceededError } from './customErrors.js';

// In errorHandler middleware
if (error instanceof RateLimitExceededError) {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    details: error.details
  });
  
  return res.status(429).json(error.toJSON());
}
```

### Adding Frontend Components

**Step 1: Create component**

```typescript
// src/features/chat/components/PipelineVisualizer.tsx
import React from 'react';

interface Pipeline {
  dag_id: string;
  tasks: Task[];
}

interface PipelineVisualizerProps {
  pipeline: Pipeline;
}

export function PipelineVisualizer({ pipeline }: PipelineVisualizerProps) {
  return (
    <div className="pipeline-visualizer">
      <h3>{pipeline.dag_id}</h3>
      <div className="tasks">
        {pipeline.tasks.map(task => (
          <div key={task.task_id} className="task-node">
            {task.task_id}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Add types**

```typescript
// src/features/chat/types.ts
export interface Task {
  task_id: string;
  operator: string;
  [key: string]: any;
}

export interface Pipeline {
  dag_id: string;
  description?: string;
  schedule_interval?: string;
  tasks: Task[];
}
```

**Step 3: Use in parent component**

```typescript
// src/features/chat/ChatPage.tsx
import { PipelineVisualizer } from './components/PipelineVisualizer';

// In render
{currentPipeline && (
  <PipelineVisualizer pipeline={currentPipeline} />
)}
```

### Adding Middleware

**Step 1: Create middleware**

```javascript
// src/middleware/requestLogger.js
import logger from './logger.js';

export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  logger.http('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http('Response sent', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    });
  });
  
  next();
}
```

**Step 2: Register middleware**

```javascript
// src/server.js
import { requestLogger } from './middleware/requestLogger.js';

// Add before routes
app.use(requestLogger);
```

### Extending AI Prompts

**Step 1: Add prompt template**

```javascript
// src/prompts/systemPrompt.js
export const REPAIR_PROMPT = `You are repairing an Airflow DAG with validation errors.

Current DAG:
{dag}

Validation Errors:
{errors}

Fix the errors while preserving the original intent. Return only the corrected DAG JSON.`;
```

**Step 2: Use in route**

```javascript
const prompt = REPAIR_PROMPT
  .replace('{dag}', JSON.stringify(dag, null, 2))
  .replace('{errors}', errors.map(e => e.message).join('\n'));

const response = await aiClient.generate(prompt);
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/pipeline.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Writing Tests

**Unit Test Example:**

```javascript
// tests/unit/validation.test.js
import { expect } from 'chai';
import { validateMessage } from '../src/utils/validation.js';

describe('validateMessage', () => {
  it('should accept valid message', () => {
    const message = 'Create a daily ETL pipeline';
    expect(() => validateMessage(message)).to.not.throw();
  });
  
  it('should reject short message', () => {
    const message = 'too short';
    expect(() => validateMessage(message)).to.throw('Message must be between 10 and 5000 characters');
  });
  
  it('should reject empty message', () => {
    expect(() => validateMessage('')).to.throw();
    expect(() => validateMessage(null)).to.throw();
  });
});
```

**Integration Test Example:**

```javascript
// tests/integration/pipeline-api.test.js
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/server.js';

describe('Pipeline API Integration', () => {
  describe('POST /api/pipeline/generate', () => {
    it('should generate and validate pipeline', async () => {
      const res = await request(app)
        .post('/api/pipeline/generate')
        .send({
          message: 'Create a daily ETL pipeline from PostgreSQL to S3',
          parameters: { schedule: '@daily' }
        })
        .expect(200);
      
      expect(res.body).to.have.property('dag');
      expect(res.body).to.have.property('validation');
      expect(res.body.dag).to.have.property('dag_id');
      expect(res.body.validation.valid).to.be.true;
    });
  });
});
```

**End-to-End Test Example:**

```javascript
// tests/e2e/workflow.test.js
describe('Complete Pipeline Workflow', () => {
  it('should generate -> validate -> refine -> code', async () => {
    // 1. Generate
    const generateRes = await request(app)
      .post('/api/pipeline/generate')
      .send({ message: 'Create a daily ETL pipeline' });
    
    const { dag } = generateRes.body;
    
    // 2. Validate
    const validateRes = await request(app)
      .post('/api/pipeline/validate')
      .send({ dag });
    
    expect(validateRes.body.valid).to.be.true;
    
    // 3. Refine
    const refineRes = await request(app)
      .post('/api/pipeline/refine')
      .send({
        currentDag: dag,
        feedback: 'Change to @hourly'
      });
    
    expect(refineRes.body.dag.schedule_interval).to.equal('@hourly');
    
    // 4. Generate code
    const codeRes = await request(app)
      .post('/api/pipeline/generate-code')
      .send({ dag: refineRes.body.dag });
    
    expect(codeRes.body).to.have.property('code');
    expect(codeRes.body.code).to.include('from airflow import DAG');
  });
});
```

### Test Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All endpoints
- **E2E Tests**: Critical workflows
- **Error Cases**: All error paths

## Code Style

### JavaScript/TypeScript

**ESLint Configuration:**

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

**Naming Conventions:**

```javascript
// Variables and functions: camelCase
const userName = 'John';
function getUserData() {}

// Classes: PascalCase
class UserService {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Private properties: _prefix
class Example {
  _privateMethod() {}
}

// File names: kebab-case
// user-service.js
// pipeline-validator.js
```

**Code Organization:**

```javascript
// 1. Imports
import express from 'express';
import { ValidationError } from './errors/customErrors.js';

// 2. Constants
const PORT = process.env.PORT || 5050;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 3. Type definitions (if TypeScript)
interface User {
  id: string;
  name: string;
}

// 4. Helper functions
function validateInput(data) {
  // ...
}

// 5. Main logic
export function processRequest(req, res) {
  // ...
}

// 6. Exports
export default processRequest;
```

### Python

**Style Guide: PEP 8**

```python
# Variables and functions: snake_case
user_name = 'John'
def get_user_data():
    pass

# Classes: PascalCase
class UserService:
    pass

# Constants: UPPER_SNAKE_CASE
MAX_RETRIES = 3

# Private: _prefix
class Example:
    def _private_method(self):
        pass

# File names: snake_case
# user_service.py
# pipeline_validator.py
```

### Git Commit Messages

Follow Conventional Commits:

```bash
# Format
<type>(<scope>): <subject>

<body>

<footer>

# Types
feat: New feature
fix: Bug fix
docs: Documentation
style: Formatting
refactor: Code restructuring
test: Tests
chore: Maintenance

# Examples
feat(pipeline): add auto-repair functionality
fix(validator): handle missing task dependencies
docs(api): update endpoint documentation
test(integration): add e2e workflow tests
refactor(errors): consolidate error classes
```

## Contributing

### Contribution Workflow

1. **Fork** the repository
2. **Clone** your fork
   ```bash
   git clone https://github.com/your-username/dde-pipeline-generator.git
   ```

3. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make** your changes
   - Write code
   - Add tests
   - Update documentation

5. **Commit** with conventional commits
   ```bash
   git commit -m "feat(pipeline): add pipeline analysis endpoint"
   ```

6. **Push** to your fork
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create** a Pull Request
   - Describe changes
   - Reference issues
   - Include screenshots (if UI changes)

### Pull Request Guidelines

**Title:**
```
feat(scope): brief description
```

**Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

### Code Review Process

**Reviewers check:**
- Code quality and style
- Test coverage
- Documentation
- Performance implications
- Security considerations

**Author responsibilities:**
- Address feedback promptly
- Explain design decisions
- Update based on suggestions

## Troubleshooting

### Common Development Issues

**Issue: Port already in use**

```bash
# Find process using port
netstat -ano | findstr :5050

# Kill process
taskkill /PID <pid> /F

# Or use different port
PORT=5051 npm run dev
```

**Issue: Module not found**

```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Issue: Python imports fail**

```bash
# Verify Python path
python -c "import sys; print(sys.path)"

# Install in editable mode
pip install -e .
```

**Issue: Tests failing**

```bash
# Run single test
npm test -- --grep "specific test name"

# Verbose output
npm test -- --reporter spec

# Check test logs
cat logs/test.log
```

### Debugging

**Backend Debugging:**

```javascript
// Add debug logging
import debug from 'debug';
const log = debug('dde:pipeline');

log('Processing pipeline: %o', dag);

# Run with debugging
DEBUG=dde:* npm run dev
```

**VS Code launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "program": "${workspaceFolder}/src/server.js",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "dde:*"
      }
    }
  ]
}
```

**Frontend Debugging:**

```typescript
// Use React DevTools
console.log('State:', state);
console.trace('Function called from:');

// Performance profiling
console.time('operation');
// ... code ...
console.timeEnd('operation');
```

### Getting Help

1. **Check Documentation**: Read relevant guides
2. **Search Issues**: Look for similar problems
3. **Ask Questions**: Open a discussion
4. **Report Bugs**: Create detailed issue

**Bug Report Template:**

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows 10
- Node: v20.10.0
- Browser: Chrome 120

## Logs
```
Paste relevant logs
```
```

## Advanced Topics

### Performance Optimization

**Profiling:**

```javascript
import { performance } from 'perf_hooks';

const start = performance.now();
await expensiveOperation();
const duration = performance.now() - start;

logger.debug('Operation took', { duration });
```

**Caching:**

```javascript
const cache = new Map();

async function getCachedData(key) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}
```

### Adding Database Support

**1. Install dependencies:**
```bash
npm install pg sequelize
```

**2. Create models:**
```javascript
// models/Pipeline.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  return sequelize.define('Pipeline', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    dag_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    specification: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  });
};
```

**3. Database connection:**
```javascript
// db/connection.js
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres'
  }
);
```

## Resources

### Documentation
- [API Guide](API_GUIDE.md)
- [Architecture](ARCHITECTURE.md)
- [Deployment](DEPLOYMENT_GUIDE.md)

### External Resources
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [Airflow Docs](https://airflow.apache.org/)
- [OpenAPI Spec](https://swagger.io/specification/)

### Community
- GitHub Issues
- Discussions
- Contributing Guide

---

**Happy coding! 🚀**
