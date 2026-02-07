# DDE Pipeline Generator

> AI-powered Apache Airflow DAG pipeline generation with intelligent validation, refinement, and auto-repair capabilities.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Overview

DDE Pipeline Generator is an intelligent pipeline generation system that leverages AI to help users create, validate, and deploy Apache Airflow DAG pipelines through natural language descriptions. The system combines the power of large language models with robust validation and iterative refinement to ensure production-ready pipelines.

### Key Features

- **🤖 AI-Powered Generation** - Generate DAG specifications from natural language descriptions
- **✅ Python Validation** - Dedicated Python service validates syntax and Airflow compatibility
- **🔄 Iterative Refinement** - Refine pipelines with user feedback and automatic repair loops
- **📁 File Processing** - Upload and parse requirements.txt, configuration files
- **🐍 Code Generation** - Convert DAG specifications to executable Python code
- **📊 Real-time Monitoring** - Health checks, metrics tracking, and error monitoring
- **🔒 Enterprise Security** - Input validation, rate limiting, security headers
- **📝 Comprehensive Logging** - Winston-based logging with multiple transports
- **🧪 Automated Testing** - Complete test suite with Mocha, Chai, and Supertest
- **📖 Interactive API Docs** - Swagger/OpenAPI documentation with live testing
- **🎨 Modern UI** - React-based interface with real-time updates

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

## ⚡ Quick Start

### Prerequisites

- Node.js 20.x or higher
- Python 3.9 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dde-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the Python validator**
   ```bash
   python validator.py
   ```

5. **Start the server**
   ```bash
   npm start
   ```

6. **Access the application**
   - Backend API: http://localhost:5050
   - API Documentation: http://localhost:5050/api-docs
   - Frontend UI: http://localhost:5173

## 🏗️ Architecture

### System Components

```
┌─────────────────┐
│   React UI      │  Port 5173
│   (Frontend)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │  Port 5050
│   (Backend)     │
└────┬───────┬────┘
     │       │
     ▼       ▼
┌─────────┐ ┌──────────────┐
│   AI    │ │   Python     │  Port 5051
│ Service │ │  Validator   │
└─────────┘ └──────────────┘
```

### Technology Stack

**Backend:**
- Node.js with Express
- Winston for logging
- Multer for file uploads
- Rate limiting and security middleware
- Swagger/OpenAPI documentation

**Validation Service:**
- Python 3.9+
- Flask web framework
- AST parsing and validation
- Airflow compatibility checks

**Frontend:**
- React 18 with TypeScript
- Vite build tool
- TailwindCSS for styling
- Server-Sent Events for real-time updates

## 📚 API Documentation

### Interactive Documentation

Access the full interactive API documentation at:
- **Swagger UI**: http://localhost:5050/api-docs
- **OpenAPI Spec**: http://localhost:5050/api-docs/swagger.json

### Core Endpoints

#### Health & Monitoring

- `GET /api/health` - Basic health check
- `GET /api/health?detailed=true` - Detailed health status
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/live` - Kubernetes liveness probe
- `GET /api/metrics` - Application metrics

#### Pipeline Operations

- `POST /api/pipeline/generate` - Generate DAG from description
- `POST /api/pipeline/validate` - Validate DAG specification
- `POST /api/pipeline/refine` - Refine with user feedback
- `POST /api/pipeline/repair` - Auto-repair validation errors
- `POST /api/pipeline/generate-code` - Generate Python code
- `GET /api/pipeline/examples` - Get example descriptions

#### File Management

- `POST /api/files/upload` - Upload files (max 5MB)
- `POST /api/files/parse-requirements` - Parse requirements.txt
- `DELETE /api/files/:filename` - Delete uploaded file

#### Models

- `GET /api/models` - List available AI models

### Example Usage

```javascript
// Generate a pipeline
const response = await fetch('http://localhost:5050/api/pipeline/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Create a daily ETL pipeline that reads from PostgreSQL and writes to S3',
    parameters: {
      schedule: '@daily',
      dataSource: 'PostgreSQL',
      dataTarget: 'S3'
    }
  })
});

const { dag, metadata } = await response.json();
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5050
NODE_ENV=development

# AI Service Configuration
AI_SERVICE_URL=http://localhost:11434
AI_MODEL=qwen2.5-coder:32b-instruct-q4_K_M
AI_TIMEOUT=60000

# Python Validator
VALIDATOR_URL=http://localhost:5051
VALIDATOR_TIMEOUT=10000

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_GENERATE_MAX=10
RATE_LIMIT_REFINE_MAX=20

# File Upload
MAX_FILE_SIZE_MB=5
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

### Rate Limiting

The API implements rate limiting to prevent abuse:

- **Global**: 100 requests per 15 minutes
- **Generate**: 10 requests per 15 minutes
- **Refine**: 20 requests per 15 minutes
- **Repair**: 10 requests per 15 minutes

## 🛠️ Development

### Project Structure

```
dde-server/
├── src/
│   ├── server.js           # Main Express application
│   ├── upbClient.js        # AI service client
│   ├── sse.js              # Server-Sent Events handling
│   ├── rateLimit.js        # Rate limiting middleware
│   ├── swagger.js          # OpenAPI specification
│   ├── swagger-routes.js   # API route documentation
│   ├── errors/
│   │   ├── customErrors.js # Custom error classes
│   │   ├── errorHandler.js # Error handling middleware
│   │   └── monitoring.js   # Monitoring and metrics
│   └── prompts/
│       ├── systemPrompt.js # AI system prompts
│       └── examples.js     # Example pipelines
├── validator.py            # Python validation service
├── logs/                   # Application logs
├── uploads/                # Uploaded files
├── tests/                  # Test suite
└── docs/                   # Documentation

dde-ui/
├── src/
│   ├── features/
│   │   └── chat/          # Chat interface components
│   └── shared/
│       └── ui/            # Reusable UI components
└── public/                # Static assets
```

### Running in Development Mode

```bash
# Terminal 1: Start Python validator
python validator.py

# Terminal 2: Start backend server
npm run dev

# Terminal 3: Start frontend
cd ../dde-ui
npm run dev
```

### Code Style

The project uses:
- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting
- Conventional commits for commit messages

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Categories

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - API endpoint testing
3. **End-to-End Tests** - Complete workflow testing
4. **Error Handling Tests** - Error scenarios and recovery

### Test Files

- `test-error-handling.js` - Error handling and monitoring
- `test-api-docs.js` - API documentation verification
- `test-end-to-end.js` - Full system integration tests

### Example Test

```bash
# Test error handling
node test-error-handling.js

# Test API documentation
node test-api-docs.js

# Test specific endpoint
npm test -- --grep "pipeline generation"
```

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd dde-ui
npm run build

# The build output will be in dde-ui/dist
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production AI service URL
3. Set up proper logging levels
4. Enable security features
5. Configure database connections (if applicable)

### Health Checks

The application provides Kubernetes-compatible health probes:

- **Liveness**: `GET /api/health/live`
- **Readiness**: `GET /api/health/ready`

### Monitoring

Monitor application health and performance:

```bash
# Check system metrics
curl http://localhost:5050/api/metrics

# Detailed health check
curl http://localhost:5050/api/health?detailed=true
```

## 📖 Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[User Guide](docs/USER_GUIDE.md)** - How to use DDE Pipeline Generator
- **[API Guide](docs/API_GUIDE.md)** - Detailed API reference and examples
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and components
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Contributing and extending
- **[Pipeline Generation](docs/PIPELINE_GENERATION.md)** - Pipeline features and examples

## 🔐 Security

- Input validation and sanitization
- Rate limiting on all endpoints
- Helmet.js security headers
- CORS configuration
- File upload restrictions (size, type)
- Error message sanitization
- Request logging and monitoring

## 📊 Monitoring & Logging

### Log Files

- `logs/error.log` - Error messages only
- `logs/combined.log` - All log levels
- `logs/http.log` - HTTP request/response logs

### Log Levels

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `http` - HTTP requests
- `debug` - Debugging information

### Metrics

The `/api/metrics` endpoint provides:
- Total requests and success rate
- Pipeline operations count
- Error tracking by type
- System uptime

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Apache Airflow for the DAG framework
- Ollama for AI model inference
- The open-source community

## 📞 Support

For issues, questions, or contributions:
- GitHub Issues: [Create an issue](issues)
- Documentation: [docs/](docs/)
- API Docs: http://localhost:5050/api-docs

---

**Built with ❤️ by the DDE Team**
