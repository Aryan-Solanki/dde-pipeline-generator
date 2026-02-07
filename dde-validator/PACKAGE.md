# DDE Validator - Package Definition

name: dde-validator
version: 1.0.0
description: Python validation service for Airflow DAG generation

## Structure

```
dde-validator/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── .env                        # Environment configuration
├── .env.example               # Example environment config
├── .gitignore                 # Git ignore rules
├── README.md                  # Documentation
├── test_service.py            # Service tests
├── venv/                      # Virtual environment (not in git)
├── validators/                # Validation modules
│   ├── __init__.py
│   ├── dag_validator.py       # DAG syntax/structure validation
│   └── environment_validator.py  # Environment compatibility validation
└── utils/                     # Utility modules
    ├── __init__.py
    └── parser.py              # File parsers (YAML, JSON, requirements.txt)
```

## Features Implemented

✅ Flask server with CORS
✅ Health check endpoint
✅ DAG validation endpoint (placeholder)
✅ Environment validation endpoint (placeholder)
✅ Structured logging
✅ Modular architecture
✅ Virtual environment setup

## Next Steps (Future Tasks)

- Task 6: Implement full DAG syntax validation
- Task 11: Implement requirements file parsing
- Task 12: Implement environment context validation
