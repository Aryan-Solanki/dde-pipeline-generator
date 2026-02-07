# DDE Pipeline Generator

AI-powered Apache Airflow DAG pipeline generation with intelligent validation, refinement, and auto-repair capabilities.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚡ Quick Start (For Professors)

> **New here?** See [SETUP.md](SETUP.md) for a detailed step-by-step guide.

```powershell
# 1. Install dependencies
cd dde-server && npm install && cd ../dde-ui && npm install && cd ../dde-validator && pip install -r requirements.txt && cd ..

# 2. Configure API key
copy .env.example .env
# Edit .env and add your UPB_API_KEY

# 3. Run
.\start.ps1

# 4. Open browser
# http://localhost:5173
```

**That's it!** The application will start in 3 separate windows.

| What You Need | Where to Get It |
|---------------|----------------|
| 🔑 UPB AI Gateway API Key | https://ai-gateway.uni-paderborn.de/ |
| 📦 Node.js 20.x+ | https://nodejs.org/ |
| 🐍 Python 3.9+ | https://www.python.org/ |
| 🔒 University VPN | Required for off-campus access |

---

## 🚀 Detailed Setup

### 1. Prerequisites

```powershell
# Install all dependencies (run from project root)
cd dde-server
npm install

cd ../dde-ui
npm install

cd ../dde-validator
pip install -r requirements.txt

cd ..
```

### 2. Configure API Key (ONE FILE ONLY!)

Create a **single** `.env` file in the project root:

```powershell
copy .env.example .env
```

Edit the `.env` file and add your UPB AI Gateway API key:

```env
# Required - Just add your API key here!
UPB_API_KEY=sk-your-actual-api-key-here
UPB_BASE_URL=https://ai-gateway.uni-paderborn.de/v1/

# Optional (defaults work fine)
# UPB_MODEL=gwdg.qwen3-30b-a3b-instruct-2507x
# RPM_LIMIT=10
# PORT=5050
```

> **🔑 Get your API key:** https://ai-gateway.uni-paderborn.de/  
> **🔒 VPN Required:** Must be on University of Paderborn VPN when off-campus  
> **📂 One .env file:** All services read from the root .env - no need for service-specific .env files!

### 3. Run the Application

**Option A: Automatic Startup (Recommended)**
```powershell
.\start.ps1
```
This opens 3 terminal windows for each service and checks their health status.

**Option B: Manual Startup (3 separate terminals)**
```powershell
.\start.ps1
```

**Option B: Manual start (3 separate terminals)**
```powershell
# Terminal 1: Validator
cd dde-validator
python app.py

# Terminal 2: Backend
cd dde-server
npm run dev

# Terminal 3: Frontend
cd dde-ui
npm run dev
```

**Access the application:** http://localhost:5173

---

## 📖 What is DDE Pipeline Generator?

DDE Pipeline Generator helps you create Apache Airflow data pipelines using natural language. Just describe what you want your pipeline to do, and the AI will generate the DAG specification and Python code for you.

### ✨ Features

- **🤖 AI-Powered Generation** - Describe your pipeline in plain English
- **✅ Automatic Validation** - Python syntax and Airflow compatibility checks
- **🔄 Iterative Refinement** - Refine specifications and code with feedback
- **🐍 Code Generation** - Get production-ready Python DAG files
- **📦 Export Package** - Download complete deployment bundles (ZIP)
- **📁 File Upload** - Attach requirements.txt for better context
- **🔧 Auto-Repair** - Automatically fix validation errors

---

## 📁 Project Structure

```
dde-pipeline-generator/
├── dde-server/          # Node.js/Express backend API
│   ├── src/            # Server source code
│   │   ├── server.js       # Main server file
│   │   ├── upbClient.js    # UPB AI Gateway client
│   │   └── ...             # Other modules
│   └── package.json
│
├── dde-ui/             # React/TypeScript frontend
│   ├── src/
│   │   ├── features/chat/  # Pipeline generation UI
│   │   └── ...
│   └── package.json
│
├── dde-validator/      # Python Flask validator
│   ├── app.py          # Main validator service
│   ├── validators/     # Validation logic
│   └── requirements.txt
│
├── .env.example        # Environment configuration template
├── start.ps1           # Windows startup script
└── README.md           # This file
```

---

## ⚙️ Configuration

### Environment Variables

The project uses environment variables for configuration. All services read from the `.env` file in the root directory.

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `UPB_API_KEY` | Your UPB AI Gateway API key | `sk-abc123...` |
| `UPB_BASE_URL` | UPB AI Gateway base URL | `https://ai-gateway.uni-paderborn.de/v1/` |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UPB_MODEL` | `gwdg.qwen3-30b-a3b-instruct-2507x` | AI model to use |
| `RPM_LIMIT` | `10` | Rate limit (requests per minute) |
| `PORT` | `5050` | Backend server port |
| `VALIDATOR_URL` | `http://localhost:5051` | Validator service URL |
| `NODE_ENV` | `development` | Environment mode |

### Available AI Models

- `gwdg.qwen3-30b-a3b-instruct-2507x` (Default - Fast, good quality)
- `gwdg.llama-3.3-70b-instruct` (Slower, higher quality)

---

## 🎯 How to Use

1. **Start the application** (see Quick Start above)
2. **Open your browser** to http://localhost:5173
3. **Describe your pipeline** in natural language, for example:
   ```
   Create a daily ETL pipeline that:
   - Extracts data from PostgreSQL
   - Transforms it using pandas
   - Loads into a data warehouse
   ```
4. **Review the generated DAG** specification
5. **Refine if needed** by providing feedback
6. **Generate Python code** when satisfied
7. **Download the package** (ZIP with DAG file and dependencies)

---

## 🛠️ Development

### Running Tests

```powershell
# Backend tests
cd dde-server
npm test

# Validator tests
cd dde-validator
python -m pytest
```

### API Documentation

Once the backend is running, access the Swagger API documentation at:
- http://localhost:5050/api-docs

### Project Ports

| Service | Port | Health Check URL |
|---------|------|------------------|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 5050 | http://localhost:5050/api/health |
| Validator | 5051 | http://localhost:5051/health |

---

## 🔧 Troubleshooting

### PowerShell script execution policy (Windows)

If you see this error when running `.\start.ps1`:
```
.\start.ps1 cannot be loaded. The file is not digitally signed.
```

**Fix:** Open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run `.\start.ps1` again.

**Alternative:** Run with bypass:
```powershell
PowerShell -ExecutionPolicy Bypass -File .\start.ps1
```

### "Port already in use" error

Kill the process using the port:
```powershell
# Find process on port 5050
netstat -ano | findstr :5050

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

Or use different ports in `.env`:
```env
PORT=5055
```

### "Module not found" errors

Reinstall dependencies:
```powershell
# Backend
cd dde-server
rm -rf node_modules
npm install

# Frontend
cd dde-ui
rm -rf node_modules
npm install

# Validator
cd dde-validator
pip install -r requirements.txt --force-reinstall
```

### "API key invalid" errors

1. Check your `.env` file has the correct `UPB_API_KEY`
2. Verify you have VPN access to University of Paderborn network
3. Test API key at: https://ai-gateway.uni-paderborn.de/

### Frontend can't connect to backend

1. Verify backend is running: http://localhost:5050/api/health
2. Check browser console for CORS errors
3. Ensure ports match in configuration

---

## 📝 Requirements

### System Requirements
- **OS:** Windows 10/11, macOS 10.15+, or Linux
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 500MB for dependencies

### Network Requirements
- **VPN:** University of Paderborn VPN required for UPB AI Gateway access
- **Internet:** Stable connection for AI API calls

---

## 📚 Additional Documentation

- [Backend API Documentation](dde-server/README.md)
- [Frontend Documentation](dde-ui/README.md)
- [Validator Documentation](dde-validator/README.md)
- [Architecture Overview](docs/README.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work*

---

## 🙏 Acknowledgments

- University of Paderborn for providing AI Gateway access
- Apache Airflow community
- All contributors who helped with testing and feedback

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review existing [Issues](https://github.com/your-org/dde-pipeline-generator/issues)
3. Create a new issue with detailed information

---

**Made with ❤️ for Data Engineering**

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

Built with ❤️ by the Group 5 Team

---

**Built with:** Node.js · Python · React · Express · Flask · Vite · TailwindCSS
