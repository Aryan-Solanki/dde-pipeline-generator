# Quick Setup Guide for Professors

This is a simplified guide for getting the DDE Pipeline Generator running quickly.

## Prerequisites (5 minutes)

1. **Download and install Node.js**  
   Visit https://nodejs.org/ and download the LTS version (20.x or higher)

2. **Download and install Python**  
   Visit https://www.python.org/downloads/ and download version 3.9 or higher

3. **Get your UPB AI Gateway API Key**  
   Visit https://ai-gateway.uni-paderborn.de/ and generate an API key

4. **Connect to University VPN** (if off-campus)  
   The UPB AI Gateway requires VPN access

## Installation (5 minutes)

1. **Extract the project files** to a folder, e.g., `C:\DDE Pipeline Generator`

2. **Open PowerShell** in the project folder  
   Right-click in the folder → "Open in Terminal" or "Open PowerShell window here"

3. **Run these commands** one by one:

```powershell
# Install backend dependencies
cd dde-server
npm install

# Install frontend dependencies
cd ..\dde-ui
npm install

# Install validator dependencies
cd ..\dde-validator
pip install -r requirements.txt

# Go back to project root
cd ..
```

## Configuration (2 minutes) - ONE FILE ONLY!

1. **Create the main .env file** (in project root):
```powershell
copy .env.example .env
```

2. **Edit the .env file**:
   - Open `.env` in Notepad or any text editor
   - Find the line: `UPB_API_KEY=your_api_key_here`
   - Replace `your_api_key_here` with your actual API key
   - Save and close

Example:
```env
UPB_API_KEY=sk-1234567890abcdef
UPB_BASE_URL=https://ai-gateway.uni-paderborn.de/v1/
```

**Important:** You only need ONE .env file in the project root. All services (backend, frontend, validator) will automatically read from this single file. No need to create .env files in individual service folders!

## Running the Application (1 minute)

Open **3 separate PowerShell windows** and run each service:

**Window 1: Validator Service**
```powershell
cd dde-validator
python app.py
```

**Window 2: Backend API**
```powershell
cd dde-server
npm run dev
```

**Window 3: Frontend UI**
```powershell
cd dde-ui
npm run dev
```

## Using the Application

1. **Open your web browser**

2. **Navigate to**: http://localhost:5173

3. **Start creating pipelines!**

## Troubleshooting

### "Port already in use"
If you see this error, close any existing instances of the services and try again. Or run:
```powershell
# Find what's using port 5050
netstat -ano | findstr :5050

# Kill the process (replace 1234 with actual PID)
taskkill /PID 1234 /F
```

### "API key invalid"
- Make sure you're connected to the university VPN
- Verify your API key is correct in the `.env` file
- Check the API key hasn't expired at https://ai-gateway.uni-paderborn.de/

### "Module not found"
Reinstall dependencies:
```powershell
cd dde-server
npm install

cd ..\dde-ui
npm install

cd ..\dde-validator
pip install -r requirements.txt
```

### Services won't start
1. Make sure Node.js and Python are installed
2. Restart PowerShell with administrator privileges
3. Check Windows Firewall isn't blocking the ports

## Stopping the Application

Press `Ctrl+C` in each PowerShell window, then type `y` to confirm

## Summary

1. Install Node.js and Python ✓
2. Run installation commands ✓
3. Copy and edit .env file with your API key ✓
4. Start all 3 services in separate terminals ✓
5. Open http://localhost:5173 ✓

**Total time: ~15 minutes**

---

For detailed documentation, see [README.md](README.md)
