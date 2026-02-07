# Documentation Index

> Complete documentation for the DDE Pipeline Generator

## 📚 Documentation Overview

This directory contains comprehensive documentation for developers, users, administrators, and contributors.

## 📖 Table of Contents

### For Users

- **[User Guide](USER_GUIDE.md)** 
  - Getting started with DDE
  - Creating pipelines
  - Using features (refinement, repair, file uploads)
  - Best practices and troubleshooting
  - **Start here** if you're new to DDE

### For Developers

- **[API Guide](API_GUIDE.md)**
  - Complete API reference
  - Request/response examples
  - Error handling
  - Rate limiting
  - Code examples in JavaScript, Python, and cURL
  - Interactive docs at `/api-docs`

- **[Developer Guide](DEVELOPER_GUIDE.md)**
  - Development setup
  - Code structure
  - Adding features
  - Testing guidelines
  - Code style and conventions
  - Contributing workflow
  - **Essential for contributors**

### For System Administrators

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)**
  - Production deployment with Docker
  - Kubernetes orchestration
  - Configuration management
  - Security hardening
  - Monitoring and logging
  - Backup and recovery
  - Performance tuning
  - **Critical for production deployments**

### For Architects

- **[Architecture Guide](ARCHITECTURE.md)**
  - System design overview
  - Component architecture
  - Data flow diagrams
  - Technology stack
  - Design patterns
  - Security architecture
  - Scalability strategies
  - **Understand the system design**

### Feature Documentation

- **[Pipeline Generation](PIPELINE_GENERATION.md)**
  - Pipeline generation features
  - Supported operators
  - Examples and use cases
  - Advanced features

- **[Error Handling](../TASK-15-ERROR-HANDLING.md)**
  - Error handling implementation
  - Custom error classes
  - Monitoring and metrics
  - Health checks

- **[Prompt Filtering](PROMPT_FILTER.md)**
  - Prompt validation and filtering
  - Security measures
  - Customization options

## 🚀 Quick Start

### New Users
1. Read [User Guide](USER_GUIDE.md) - Getting Started
2. Try creating your first pipeline
3. Explore [API Guide](API_GUIDE.md) for automation

### New Developers
1. Review [Architecture Guide](ARCHITECTURE.md)
2. Follow [Developer Guide](DEVELOPER_GUIDE.md) - Development Setup
3. Read [Contributing](DEVELOPER_GUIDE.md#contributing) guidelines

### System Administrators
1. Study [Architecture Guide](ARCHITECTURE.md)
2. Follow [Deployment Guide](DEPLOYMENT_GUIDE.md)
3. Configure monitoring from [Deployment Guide](DEPLOYMENT_GUIDE.md#monitoring)

## 🔍 Finding Information

### By Topic

**Installation & Setup**
- Local: [User Guide - Getting Started](USER_GUIDE.md#getting-started)
- Development: [Developer Guide - Development Setup](DEVELOPER_GUIDE.md#development-setup)
- Production: [Deployment Guide](DEPLOYMENT_GUIDE.md)

**Using the System**
- Creating pipelines: [User Guide - Creating Pipelines](USER_GUIDE.md#creating-your-first-pipeline)
- API usage: [API Guide - Pipeline Operations](API_GUIDE.md#pipeline-operations)
- File uploads: [User Guide - File Uploads](USER_GUIDE.md#file-uploads)

**Development**
- Adding endpoints: [Developer Guide - Adding Features](DEVELOPER_GUIDE.md#adding-a-new-api-endpoint)
- Testing: [Developer Guide - Testing](DEVELOPER_GUIDE.md#testing)
- Code style: [Developer Guide - Code Style](DEVELOPER_GUIDE.md#code-style)

**Operations**
- Deployment: [Deployment Guide - Docker](DEPLOYMENT_GUIDE.md#docker-deployment)
- Monitoring: [Deployment Guide - Monitoring](DEPLOYMENT_GUIDE.md#monitoring)
- Troubleshooting: [Deployment Guide - Troubleshooting](DEPLOYMENT_GUIDE.md#troubleshooting)

**Architecture**
- System design: [Architecture Guide - System Overview](ARCHITECTURE.md#system-overview)
- Components: [Architecture Guide - Components](ARCHITECTURE.md#components)
- Data flow: [Architecture Guide - Data Flow](ARCHITECTURE.md#data-flow)

## 📊 Documentation by Use Case

### "I want to..."

**...create my first pipeline**
- → [User Guide - Creating Your First Pipeline](USER_GUIDE.md#creating-your-first-pipeline)

**...use the API programmatically**
- → [API Guide - Code Examples](API_GUIDE.md#code-examples)

**...deploy to production**
- → [Deployment Guide](DEPLOYMENT_GUIDE.md)
- → [Architecture Guide - Security](ARCHITECTURE.md#security-architecture)

**...contribute code**
- → [Developer Guide - Contributing](DEVELOPER_GUIDE.md#contributing)
- → [Developer Guide - Code Style](DEVELOPER_GUIDE.md#code-style)

**...understand the architecture**
- → [Architecture Guide](ARCHITECTURE.md)

**...add a new feature**
- → [Developer Guide - Adding Features](DEVELOPER_GUIDE.md#adding-features)

**...troubleshoot issues**
- → [User Guide - Troubleshooting](USER_GUIDE.md#troubleshooting)
- → [Developer Guide - Troubleshooting](DEVELOPER_GUIDE.md#troubleshooting)
- → [Deployment Guide - Troubleshooting](DEPLOYMENT_GUIDE.md#troubleshooting)

**...configure monitoring**
- → [Deployment Guide - Monitoring](DEPLOYMENT_GUIDE.md#monitoring)
- → [Error Handling Documentation](../TASK-15-ERROR-HANDLING.md)

**...optimize performance**
- → [Architecture Guide - Performance](ARCHITECTURE.md#performance)
- → [Deployment Guide - Performance Tuning](DEPLOYMENT_GUIDE.md#performance-tuning)

## 🎯 Documentation Standards

Our documentation follows these principles:

1. **Clear Structure**: Organized by audience and use case
2. **Code Examples**: Practical, runnable examples
3. **Complete Coverage**: All features documented
4. **Up-to-date**: Updated with each release
5. **Accessible**: Multiple entry points for different users

## 📝 Additional Resources

### Interactive Documentation
- **Swagger UI**: http://localhost:5050/api-docs
- **OpenAPI Spec**: http://localhost:5050/api-docs/swagger.json

### Code Repository
- **GitHub**: https://github.com/your-org/dde-pipeline-generator
- **Issues**: https://github.com/your-org/dde-pipeline-generator/issues
- **Discussions**: https://github.com/your-org/dde-pipeline-generator/discussions

### External Documentation
- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## 🔄 Keeping Documentation Updated

### For Contributors

When adding features, update:
1. Relevant user-facing documentation
2. API examples if adding endpoints
3. Architecture diagrams if changing structure
4. Deployment guide if affecting operations

### Documentation Checklist

- [ ] User guide updated for new features
- [ ] API guide includes new endpoints
- [ ] Swagger annotations added
- [ ] Architecture diagrams updated
- [ ] Code examples provided
- [ ] Deployment steps verified
- [ ] Tests documented

## 📧 Feedback

Found an issue with documentation?
- Open a GitHub issue
- Submit a pull request with corrections
- Start a discussion for clarification

---

## Document Versions

| Document | Last Updated | Version |
|----------|--------------|---------|
| [User Guide](USER_GUIDE.md) | 2026-02-06 | 1.0.0 |
| [API Guide](API_GUIDE.md) | 2026-02-06 | 1.0.0 |
| [Developer Guide](DEVELOPER_GUIDE.md) | 2026-02-06 | 1.0.0 |
| [Deployment Guide](DEPLOYMENT_GUIDE.md) | 2026-02-06 | 1.0.0 |
| [Architecture Guide](ARCHITECTURE.md) | 2026-02-06 | 1.0.0 |

---

**Start Reading**: New users should begin with the [User Guide](USER_GUIDE.md) ✨
