# Environment Configuration Guide

This document explains all environment variables used in the DDE Pipeline Generator.

## Quick Start

The simplest way to configure the application:

1. Copy `.env.example` to `.env` in the project root
2. Add your `UPB_API_KEY`
3. Done! All other variables use sensible defaults.

## Location

The `.env` file should be placed in the **project root directory** (not in individual service folders).

```
dde-pipeline-generator/
├── .env                 ← Place your .env file here
├── .env.example         ← Template
├── start.ps1
├── dde-server/
├── dde-ui/
└── dde-validator/
```

The backend automatically loads the `.env` file from the root directory.

## Required Variables

### UPB_API_KEY
- **Description**: Your UPB AI Gateway API key
- **Required**: Yes
- **Where to get**: https://ai-gateway.uni-paderborn.de/
- **Example**: `UPB_API_KEY=sk-abc123...`
- **Important**: Keep this secret! Never commit to Git.

### UPB_BASE_URL
- **Description**: Base URL for the UPB AI Gateway
- **Required**: Yes
- **Default**: Should be `https://ai-gateway.uni-paderborn.de/v1/`
- **Example**: `UPB_BASE_URL=https://ai-gateway.uni-paderborn.de/v1/`
- **Note**: Always include the trailing `/v1/`

## Optional Variables

### UPB_MODEL
- **Description**: Which AI model to use for pipeline generation
- **Required**: No
- **Default**: `gwdg.qwen3-30b-a3b-instruct-2507x`
- **Options**:
  - `gwdg.qwen3-30b-a3b-instruct-2507x` - Faster, good quality (recommended)
  - `gwdg.llama-3.3-70b-instruct` - Slower, potentially higher quality
- **Example**: `UPB_MODEL=gwdg.llama-3.3-70b-instruct`

### RPM_LIMIT
- **Description**: Rate limit for AI API calls (requests per minute)
- **Required**: No
- **Default**: `10`
- **Range**: 1-60
- **Example**: `RPM_LIMIT=15`
- **Note**: Higher values may cause rate limit errors from the API

### PORT
- **Description**: Port for the backend server
- **Required**: No
- **Default**: `5050`
- **Example**: `PORT=5055`
- **When to change**: If port 5050 is already in use on your system

### VALIDATOR_URL
- **Description**: URL for the Python validator service
- **Required**: No
- **Default**: `http://localhost:5051`
- **Example**: `VALIDATOR_URL=http://localhost:5052`
- **When to change**: Only if you change the validator's port

### NODE_ENV
- **Description**: Node.js environment mode
- **Required**: No
- **Default**: `development`
- **Options**: `development`, `production`, `test`
- **Example**: `NODE_ENV=production`
- **Note**: Affects logging verbosity and error details

## Example .env Files

### Minimal Configuration (Recommended)
```env
# Just provide your API key - everything else uses defaults
UPB_API_KEY=sk-your-actual-api-key-here
UPB_BASE_URL=https://ai-gateway.uni-paderborn.de/v1/
```

### Full Configuration
```env
# Required
UPB_API_KEY=sk-your-actual-api-key-here
UPB_BASE_URL=https://ai-gateway.uni-paderborn.de/v1/

# Optional
UPB_MODEL=gwdg.llama-3.3-70b-instruct
RPM_LIMIT=15
PORT=5050
VALIDATOR_URL=http://localhost:5051
NODE_ENV=development
```

### Custom Ports
```env
# If default ports are in use
UPB_API_KEY=sk-your-api-key
UPB_BASE_URL=https://ai-gateway.uni-paderborn.de/v1/

PORT=5055
VALIDATOR_URL=http://localhost:5056
```

## Service-Specific Variables

### Frontend (.env in dde-ui/)
The frontend can optionally have its own `.env` file:

```env
# Optional - defaults to http://localhost:5050
VITE_API_URL=http://localhost:5050
```

**Note**: If you don't create this file, the frontend will use the default backend URL.

### Validator (.env.example in dde-validator/)
The validator service uses its own `.env` if needed:

```env
FLASK_ENV=development
FLASK_PORT=5051
```

**Note**: Usually not needed - defaults work fine.

## Security Best Practices

### Do NOT:
- ❌ Commit `.env` files to Git
- ❌ Share your API key publicly
- ❌ Use production API keys in development
- ❌ Store API keys in code

### Do:
- ✅ Use `.env.example` as a template (no secrets)
- ✅ Add `.env` to `.gitignore` (already done)
- ✅ Rotate API keys regularly
- ✅ Use different API keys for different environments

## Troubleshooting

### "API key invalid" error
1. Check your `.env` file exists in the project root
2. Verify `UPB_API_KEY` is set correctly (no spaces, quotes, or extra characters)
3. Make sure you're connected to University VPN
4. Test your API key at: https://ai-gateway.uni-paderborn.de/

### Backend can't find .env
1. Make sure `.env` is in the project root (not in `dde-server/`)
2. Check the file is named exactly `.env` (not `.env.txt`)
3. Restart the backend server after creating/editing `.env`

### Changes not taking effect
1. Restart all services after editing `.env`
2. Check for typos in variable names
3. Verify no extra spaces around `=` signs
4. Use PowerShell to stop and restart services

### Port conflicts
If you get "port already in use" errors:

```powershell
# Find what's using the port
netstat -ano | findstr :5050

# Kill the process
taskkill /PID <process_id> /F

# Or change the port in .env
PORT=5055
```

## Environment Variable Loading Order

The application loads environment variables in this order (later overrides earlier):

1. Default values in code
2. `.env` file in project root
3. `.env` file in service directory (dde-server/.env)
4. System environment variables

This means you can:
- Put shared config in root `.env`
- Override specific services with their own `.env`
- Override everything with system environment variables

## Validation

The server validates environment variables on startup:

```
✓ UPB_API_KEY found
✓ UPB_BASE_URL configured
ℹ Using model: gwdg.qwen3-30b-a3b-instruct-2507x
ℹ Rate limit: 10 requests/minute
```

If validation fails, you'll see an error message indicating what's wrong.

## Additional Resources

- [UPB AI Gateway Documentation](https://ai-gateway.uni-paderborn.de/)
- [Main README](../README.md)
- [Setup Guide](../SETUP.md)

---

**Need help?** Check the troubleshooting section in the main [README.md](../README.md)
