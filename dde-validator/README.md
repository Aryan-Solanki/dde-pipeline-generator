# DDE Validator Service

Python-based validation service for Airflow DAG generation and validation.

## Setup

### 1. Create Virtual Environment

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment

```powershell
Copy-Item .env.example .env
```

### 4. Run the Server

```powershell
python app.py
```

The server will start on `http://localhost:5051`

## API Endpoints

### Health Check
```
GET /health
```

### Validate DAG
```
POST /validate/dag
Content-Type: application/json

{
  "dag_code": "Python DAG code as string",
  "dag_spec": "JSON specification object"
}
```

### Validate Environment
```
POST /validate/environment
Content-Type: application/json

{
  "dag_spec": {},
  "environment": {}
}
```

## Development

- Framework: Flask
- Port: 5051 (configurable via .env)
- CORS: Enabled for local development
