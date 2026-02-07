# DDE Pipeline Generator

AI-powered Apache Airflow DAG pipeline generation with intelligent validation, refinement, and auto-repair capabilities.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🚀 Features

- **AI-Powered Generation** - Generate DAG specifications from natural language
- **Iterative Refinement** - Refine both JSON specs and Python code with AI feedback
- **Python Validation** - Comprehensive syntax and structure validation
- **Export Package** - Download complete deployment bundles (ZIP with 9 files)
- **File Upload** - Attach requirements.txt, configs for better context
- **Real-time Monitoring** - Health checks and metrics tracking

## 📁 Project Structure

```
DDE CODE PROJECT/
├── dde-server/          # Node.js/Express backend
│   ├── src/            # Server source code
│   ├── docs/           # API documentation
│   └── tests/          # Test suite
├── dde-ui/             # React/Vite frontend
│   └── src/            # UI components
├── dde-validator/      # Python Flask validator
│   ├── validators/     # DAG validation logic
│   └── tests/          # Validation tests
└── docs/               # Project documentation
```

## 🛠️ Installation

### Prerequisites
- Node.js 20.x or higher
- Python 3.9 or higher
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/dde-pipeline-generator.git
cd dde-pipeline-generator
```

2. **Install Backend Dependencies**
```bash
cd dde-server
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../dde-ui
npm install
```

4. **Install Python Dependencies**
```bash
cd ../dde-validator
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

5. **Configure Environment**

Create `.env` files in each service directory:

**dde-server/.env:**
```env
NODE_ENV=development
PORT=5050
VALIDATOR_URL=http://localhost:5051
AI_SERVICE_URL=http://localhost:11434
AI_MODEL=qwen2.5-coder:32b-instruct-q4_K_M
LOG_LEVEL=debug
```

## 🚀 Running the Application

### Development Mode

Start all three services in separate terminals:

```bash
# Terminal 1: Python Validator
cd dde-validator
python app.py

# Terminal 2: Backend Server
cd dde-server
npm run dev

# Terminal 3: Frontend
cd dde-ui
npm run dev
```

Access the application at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5050
- **Validator**: http://localhost:5051
- **API Docs**: http://localhost:5050/api-docs

## 📖 Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [User Guide](docs/USER_GUIDE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [API Documentation](docs/API_GUIDE.md)

## 🧪 Testing

```bash
# Backend tests
cd dde-server
npm test

# Validator tests
cd dde-validator
python -m pytest
```

## 🔧 Tech Stack

**Backend:**
- Node.js + Express
- AI integration (Ollama/Claude)
- Winston logging
- Swagger/OpenAPI

**Frontend:**
- React 19
- Vite
- TailwindCSS
- Lucide React icons

**Validator:**
- Python Flask
- AST-based validation
- Apache Airflow compatibility

## 📦 Features

### Iterative Refinement Workflow
1. Generate specification → Review → Accept or Suggest Changes
2. Generate Python code → Review → Accept or Suggest Changes
3. Export complete package → Download ZIP bundle

### Export Package Contents
- `{dag_id}.py` - Airflow DAG code
- `requirements.txt` - Python dependencies
- `.env.example` - Environment template
- `README.md` - Deployment instructions
- `docker-compose.yml` - Container setup
- Kubernetes manifests
- Documentation files

## 🤝 Contributing

See [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for development setup and guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with ❤️ by the DDE Team

---

**Built with:** Node.js · Python · React · Express · Flask · Vite · TailwindCSS
