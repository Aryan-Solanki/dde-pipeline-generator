# Render.com Deployment Guide

This guide walks you through deploying the DDE Pipeline Generator to Render.com.

## Prerequisites

- GitHub account with your code pushed
- Render.com account (free tier available)
- AI service URL (Ollama or compatible LLM service)

## Deployment Steps

### 1. Create Render Account

1. Go to [https://render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended for easy integration)

### 2. Connect Your Repository

1. From Render Dashboard, click "New +"
2. Select "Blueprint"
3. Click "Connect Account" to link your GitHub
4. Select repository: `dde-pipeline-generator`
5. Click "Apply"

Render will automatically detect the `render.yaml` file and create all three services.

### 3. Configure Environment Variables

After services are created, you need to set some environment variables manually:

#### Backend Service (dde-backend)

Navigate to **dde-backend** → **Environment**:

| Variable | Value | Description |
|----------|-------|-------------|
| `AI_SERVICE_URL` | Your AI service URL | e.g., `https://your-ollama-instance.com` or `http://localhost:11434` |
| `CORS_ORIGIN` | Auto-set from frontend | Automatically configured |
| `VALIDATOR_URL` | Auto-set from validator | Automatically configured |
| `PORT` | `5050` | Already set in render.yaml |
| `NODE_ENV` | `production` | Already set in render.yaml |
| `MAX_FILE_SIZE_MB` | `5` | Already set in render.yaml |

**Important**: You MUST set `AI_SERVICE_URL` for the backend to work.

#### Validator Service (dde-validator)

Navigate to **dde-validator** → **Environment**:

| Variable | Value | Description |
|----------|-------|-------------|
| `FLASK_ENV` | `production` | Already set in render.yaml |
| `PORT` | `5051` | Already set in render.yaml |

No manual configuration needed.

#### Frontend Service (dde-frontend)

Navigate to **dde-frontend** → **Environment**:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_API_URL` | Auto-set from backend | Automatically configured |

No manual configuration needed.

### 4. Deploy Services

Render will automatically deploy all three services. You can monitor the deployment:

1. Go to **Dashboard** → Services
2. Click on each service to see build logs
3. Wait for all services to show **"Live"** status

**Expected deployment times:**
- Backend: ~2-3 minutes
- Validator: ~3-5 minutes  
- Frontend: ~2-4 minutes

### 5. Access Your Application

Once all services are live:

1. Go to **dde-frontend** service page
2. Copy the URL (e.g., `https://dde-frontend.onrender.com`)
3. Open in your browser

Your DDE Pipeline Generator is now live! 🎉

## Service URLs

After deployment, you'll have three URLs:

- **Frontend**: `https://dde-frontend.onrender.com`
- **Backend**: `https://dde-backend.onrender.com`
- **Validator**: `https://dde-validator.onrender.com`

## Testing the Deployment

1. Open the frontend URL
2. Try generating a simple pipeline:
   ```
   Create a daily pipeline that fetches data from PostgreSQL
   ```
3. Verify the pipeline is generated successfully

## Free Tier Limitations

Render's free tier includes:

- ✅ 750 hours/month per service (enough for 3 services 24/7)
- ✅ Auto-sleep after 15 minutes of inactivity
- ✅ SSL/HTTPS included
- ⚠️ Services wake up on first request (10-30 second delay)
- ⚠️ 100GB bandwidth/month
- ⚠️ Shared resources (slower performance)

## Upgrading to Paid Plans

For production use, consider upgrading:

- **Starter Plan**: $7/month per service
  - No auto-sleep
  - Dedicated resources
  - Faster performance
  - Priority support

## Auto-Deployments

Render automatically deploys on every push to `main` branch:

1. Make changes to your code
2. Commit and push to GitHub
3. Render detects changes and redeploys automatically

To disable auto-deploy:
- Go to service → **Settings** → Auto-Deploy: Off

## Custom Domains

To use your own domain:

1. Go to service → **Settings** → Custom Domain
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records as instructed
4. Render provides free SSL certificate

## Monitoring & Logs

### View Logs

- Dashboard → Service → **Logs** tab
- Real-time streaming logs
- Filter by service

### Metrics

- Dashboard → Service → **Metrics** tab
- CPU, Memory, Request stats
- Response times

### Health Checks

Render automatically monitors:
- Backend: `GET /api/health`
- Validator: `GET /health`
- Frontend: Root path `/`

## Environment Variables Update

To update environment variables:

1. Go to service → **Environment**
2. Edit variable → **Save Changes**
3. Service auto-redeploys with new values

## Troubleshooting

### Service Won't Start

**Check build logs:**
- Dashboard → Service → **Logs**
- Look for errors during `npm install` or `pip install`

**Common issues:**
- Missing `AI_SERVICE_URL` in backend
- Port conflicts (ensure using `$PORT` variable)
- Build command errors (check package.json scripts)

### Services Can't Communicate

**Verify environment variables:**
- `VALIDATOR_URL` in backend should be validator's URL
- `CORS_ORIGIN` in backend should be frontend's URL
- `VITE_API_URL` in frontend should be backend's URL

**Check service URLs:**
- Use the full Render URLs (e.g., `https://dde-backend.onrender.com`)
- Don't use localhost or relative paths

### Frontend Build Fails

**Check TypeScript errors:**
- Build logs will show TypeScript compilation errors
- Fix errors locally first
- Push fixes to GitHub

**Clear build cache:**
- Settings → Clear build cache & deploy

### Slow First Request

This is normal for free tier:
- Services sleep after 15 minutes
- First request wakes service (10-30 seconds)
- Upgrade to paid plan to disable sleep

### Database Connection Issues

If using external database:
- Ensure connection string is correct
- Check firewall allows Render IPs
- Use environment variables for credentials

## Cost Optimization

### Free Tier Usage

Stay within free tier:
- Use for development/testing
- Accept auto-sleep behavior
- Monitor bandwidth usage

### Minimize Builds

- Avoid unnecessary commits to `main`
- Use feature branches
- Merge only when ready

### Resource Usage

- Optimize bundle size (frontend)
- Use efficient queries (backend)
- Cache responses where possible

## Security Best Practices

### Environment Variables

- ✅ Store all secrets in Render environment variables
- ✅ Never commit `.env` files
- ✅ Use different secrets for production

### CORS Configuration

- ✅ Set specific origins (already configured via `CORS_ORIGIN`)
- ❌ Don't use wildcard `*` in production

### HTTPS

- ✅ Always use HTTPS URLs (Render provides free SSL)
- ✅ Frontend should only call HTTPS backend

## Backup & Recovery

### Database Backups

If using Render PostgreSQL:
- Settings → Backups → Configure schedule

### Code Backups

- GitHub is your source of truth
- Tag releases for easy rollback
- Use `git tag v1.0.0` for versions

## Support Resources

- **Render Docs**: https://render.com/docs
- **Status Page**: https://status.render.com
- **Community**: https://community.render.com
- **Support**: support@render.com (paid plans)

## Next Steps

After deployment:

1. ✅ Test all features thoroughly
2. ✅ Monitor logs for errors
3. ✅ Set up custom domain (optional)
4. ✅ Configure monitoring/alerts
5. ✅ Document your deployment for team

## Alternative: Manual Service Creation

If you prefer not to use the Blueprint:

### Create Backend

1. Dashboard → New + → Web Service
2. Connect repository
3. Settings:
   - **Name**: dde-backend
   - **Root Directory**: dde-server
   - **Runtime**: Node
   - **Build**: `npm install`
   - **Start**: `node src/server.js`
4. Add environment variables (see above)

### Create Validator

1. Dashboard → New + → Web Service
2. Connect repository
3. Settings:
   - **Name**: dde-validator
   - **Root Directory**: dde-validator
   - **Runtime**: Python
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `gunicorn --bind 0.0.0.0:$PORT app:app`
4. Add environment variables (see above)

### Create Frontend

1. Dashboard → New + → Static Site
2. Connect repository
3. Settings:
   - **Name**: dde-frontend
   - **Root Directory**: dde-ui
   - **Build**: `npm install && npm run build`
   - **Publish**: `dist`
4. Add environment variables (see above)

## Summary

You've successfully deployed DDE Pipeline Generator to Render! 🚀

**Your services:**
- ✅ **Frontend**: User interface
- ✅ **Backend**: API and business logic
- ✅ **Validator**: Pipeline validation service

**Key features:**
- ✅ Auto-deploy on push to `main`
- ✅ Free SSL/HTTPS
- ✅ Health monitoring
- ✅ Easy scaling

**Remember:**
- Set `AI_SERVICE_URL` in backend environment variables
- Services auto-sleep on free tier (first request takes longer)
- Upgrade to paid for production workloads

Need help? Check the [troubleshooting section](#troubleshooting) or Render documentation.
