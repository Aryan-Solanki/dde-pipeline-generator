# Deployment Guide

> Production deployment instructions for the DDE Pipeline Generator

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Configuration](#configuration)
- [Security](#security)
- [Monitoring](#monitoring)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 4 cores
- RAM: 8 GB
- Disk: 50 GB SSD
- OS: Linux (Ubuntu 20.04+, RHEL 8+)

**Recommended:**
- CPU: 8 cores
- RAM: 16 GB
- Disk: 100 GB NVMe SSD
- OS: Ubuntu 22.04 LTS

### Software Requirements

- Docker 24.0+ or Kubernetes 1.28+
- Node.js 20.x
- Python 3.9+
- Git
- nginx (for reverse proxy)

### Network Requirements

- Ports: 5050 (backend), 5051 (validator), 5173 (frontend)
- Outbound: Access to AI service (Ollama or API)
- Inbound: HTTPS (443) for production

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/dde-pipeline-generator.git
cd dde-pipeline-generator
```

### 2. Environment Variables

Create `.env` files for each service:

**dde-server/.env:**
```env
# Server
NODE_ENV=production
PORT=5050
HOST=0.0.0.0

# AI Service
AI_SERVICE_URL=http://ollama:11434
AI_MODEL=qwen2.5-coder:32b-instruct-q4_K_M
AI_TIMEOUT=120000

# Python Validator
VALIDATOR_URL=http://validator:5051
VALIDATOR_TIMEOUT=30000

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_GENERATE_MAX=10
RATE_LIMIT_REFINE_MAX=20

# CORS
CORS_ORIGIN=https://dde.example.com

# File Upload
MAX_FILE_SIZE_MB=5
UPLOAD_DIR=/app/uploads

# Logging
LOG_LEVEL=info
LOG_DIR=/app/logs

# Database (if applicable)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dde_pipeline
DB_USER=dde_user
DB_PASSWORD=<strong-password>
```

**validator/.env:**
```env
FLASK_ENV=production
PORT=5051
HOST=0.0.0.0
LOG_LEVEL=INFO
```

### 3. SSL/TLS Certificates

```bash
# Generate self-signed cert (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/dde.key \
  -out /etc/ssl/certs/dde.crt

# Production: Use Let's Encrypt
certbot certonly --standalone -d dde.example.com
```

## Docker Deployment

### Build Docker Images

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Create directories
RUN mkdir -p /app/logs /app/uploads

# Expose port
EXPOSE 5050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5050/api/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "src/server.js"]
```

**Validator Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY validator.py .

# Expose port
EXPOSE 5051

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5051/health')"

# Start validator
CMD ["python", "validator.py"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./dde-server
    dockerfile: Dockerfile
    container_name: dde-backend
    restart: unless-stopped
    ports:
      - "5050:5050"
    environment:
      - NODE_ENV=production
      - VALIDATOR_URL=http://validator:5051
      - AI_SERVICE_URL=http://ollama:11434
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      - validator
      - ollama
    networks:
      - dde-network

  validator:
    build:
      context: ./dde-server
    dockerfile: Dockerfile.validator
    container_name: dde-validator
    restart: unless-stopped
    ports:
      - "5051:5051"
    environment:
      - FLASK_ENV=production
    networks:
      - dde-network

  frontend:
    build:
      context: ./dde-ui
    dockerfile: Dockerfile
    container_name: dde-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - dde-network

  ollama:
    image: ollama/ollama:latest
    container_name: dde-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    networks:
      - dde-network
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  ollama-data:

networks:
  dde-network:
    driver: bridge
```

### Deploy with Docker Compose

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
docker-compose ps

# Stop services
docker-compose down
```

## Kubernetes Deployment

### Create Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dde
```

### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dde-config
  namespace: dde
data:
  NODE_ENV: "production"
  PORT: "5050"
  VALIDATOR_URL: "http://dde-validator:5051"
  AI_SERVICE_URL: "http://dde-ollama:11434"
  LOG_LEVEL: "info"
```

### Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: dde-secrets
  namespace: dde
type: Opaque
stringData:
  DB_PASSWORD: <base64-encoded-password>
  AI_API_KEY: <base64-encoded-key>
```

### Backend Deployment

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dde-backend
  namespace: dde
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dde-backend
  template:
    metadata:
      labels:
        app: dde-backend
    spec:
      containers:
      - name: backend
        image: dde/backend:latest
        ports:
        - containerPort: 5050
        envFrom:
        - configMapRef:
            name: dde-config
        - secretRef:
            name: dde-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 5050
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 5050
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: logs
          mountPath: /app/logs
        - name: uploads
          mountPath: /app/uploads
      volumes:
      - name: logs
        persistentVolumeClaim:
          claimName: dde-logs-pvc
      - name: uploads
        persistentVolumeClaim:
          claimName: dde-uploads-pvc
```

### Backend Service

```yaml
# backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: dde-backend
  namespace: dde
spec:
  selector:
    app: dde-backend
  ports:
  - protocol: TCP
    port: 5050
    targetPort: 5050
  type: ClusterIP
```

### Validator Deployment

```yaml
# validator-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dde-validator
  namespace: dde
spec:
  replicas: 2
  selector:
    matchLabels:
      app: dde-validator
  template:
    metadata:
      labels:
        app: dde-validator
    spec:
      containers:
      - name: validator
        image: dde/validator:latest
        ports:
        - containerPort: 5051
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5051
          initialDelaySeconds: 10
          periodSeconds: 10
```

### Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dde-ingress
  namespace: dde
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - dde.example.com
    secretName: dde-tls
rules:
  - host: dde.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: dde-backend
            port:
              number: 5050
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dde-frontend
            port:
              number: 80
```

### Deploy to Kubernetes

```bash
# Apply configurations
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f validator-deployment.yaml
kubectl apply -f ingress.yaml

# Check status
kubectl get pods -n dde
kubectl get services -n dde
kubectl get ingress -n dde

# View logs
kubectl logs -f deployment/dde-backend -n dde

# Scale deployment
kubectl scale deployment dde-backend --replicas=5 -n dde
```

## Configuration

### Nginx Reverse Proxy

**nginx.conf:**
```nginx
upstream backend {
    server localhost:5050;
}

upstream frontend {
    server localhost:5173;
}

server {
    listen 80;
    server_name dde.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dde.example.com;

    ssl_certificate /etc/ssl/certs/dde.crt;
    ssl_certificate_key /etc/ssl/private/dde.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment-Specific Configs

**Production:**
- `NODE_ENV=production`
- `LOG_LEVEL=warn`
- Enable rate limiting
- Use secure secrets
- Enable SSL/TLS

**Staging:**
- `NODE_ENV=staging`
- `LOG_LEVEL=info`
- Less strict rate limits
- Test data

**Development:**
- `NODE_ENV=development`
- `LOG_LEVEL=debug`
- No rate limits
- Mock data enabled

## Security

### 1. SSL/TLS Configuration

```bash
# Use Let's Encrypt for production
certbot certonly --standalone \
  -d dde.example.com \
  --email admin@example.com \
  --agree-tos

# Auto-renewal
certbot renew --dry-run
```

### 2. Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Deny direct access to services
sudo ufw deny 5050/tcp
sudo ufw deny 5051/tcp
sudo ufw deny 11434/tcp
```

### 3. Application Security

- **Input Validation**: All inputs validated
- **Rate Limiting**: Enforced on all endpoints
- **CORS**: Configured for specific origins
- **Headers**: Security headers via Helmet.js
- **Secrets**: Stored in environment variables
- **Updates**: Regular dependency updates

### 4. Database Security (if applicable)

```bash
# PostgreSQL
- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular backups
- Encrypted at rest
```

## Monitoring

### 1. Application Monitoring

**Health Checks:**
```bash
# Liveness
curl http://localhost:5050/api/health/live

# Readiness
curl http://localhost:5050/api/health/ready

# Detailed
curl http://localhost:5050/api/health?detailed=true
```

**Metrics:**
```bash
# Application metrics
curl http://localhost:5050/api/metrics
```

### 2. Log Monitoring

```bash
# Tail logs
tail -f /app/logs/combined.log
tail -f /app/logs/error.log

# Search logs
grep "ERROR" /app/logs/combined.log
grep "ValidationError" /app/logs/error.log
```

### 3. System Monitoring

**Prometheus metrics.yaml:**
```yaml
scrape_configs:
  - job_name: 'dde-backend'
    static_configs:
      - targets: ['localhost:5050']
    metrics_path: '/api/metrics'
```

**Grafana Dashboard:**
- Request rate and latency
- Error rate
- Pipeline operations
- System resources (CPU, memory)

### 4. Alerting

**Alert Rules:**
- Error rate > 5%
- Response time > 5s
- CPU > 80%
- Memory > 90%
- Disk > 85%
- Service down

## Backup and Recovery

### 1. Backup Strategy

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/dde"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /app/uploads

# Backup logs
tar -czf "$BACKUP_DIR/logs_$DATE.tar.gz" /app/logs

# Backup database (if applicable)
pg_dump -U dde_user dde_db > "$BACKUP_DIR/database_$DATE.sql"

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

**Cron Schedule:**
```cron
# Daily backup at 2 AM
0 2 * * * /opt/dde/backup.sh
```

### 2. Recovery Procedure

```bash
# Restore uploads
tar -xzf uploads_backup.tar.gz -C /app/

# Restore database
psql -U dde_user dde_db < database_backup.sql

# Restart services
docker-compose restart
# or
kubectl rollout restart deployment/dde-backend -n dde
```

## Troubleshooting

### Common Issues

**1. Service Not Starting**

```bash
# Check logs
docker-compose logs backend
kubectl logs deployment/dde-backend -n dde

# Check environment variables
docker exec dde-backend env

# Check port availability
netstat -tlnp | grep 5050
```

**2. High Memory Usage**

```bash
# Check container stats
docker stats

# Restart services
docker-compose restart backend

# Scale down if needed
kubectl scale deployment dde-backend --replicas=2 -n dde
```

**3. Slow Response Times**

```bash
# Check metrics
curl http://localhost:5050/api/metrics

# Check AI service
curl http://localhost:11434/api/tags

# Review logs for timeouts
grep "timeout" /app/logs/error.log
```

**4. Validation Service Down**

```bash
# Check validator health
curl http://localhost:5051/health

# Restart validator
docker-compose restart validator

# Check validator logs
docker-compose logs validator
```

### Performance Tuning

**Node.js:**
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" node src/server.js
```

**nginx:**
```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 10M;
```

**Docker:**
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
```

## Maintenance

### Regular Tasks

**Daily:**
- Check health endpoints
- Review error logs
- Monitor disk space

**Weekly:**
- Update dependencies
- Review metrics
- Performance analysis

**Monthly:**
- Security updates
- Backup verification
- Capacity planning

### Updates

```bash
# Update dependencies
npm audit fix
pip install --upgrade -r requirements.txt

# Rebuild images
docker-compose build --no-cache

# Rolling update (Kubernetes)
kubectl set image deployment/dde-backend \
  backend=dde/backend:v1.1.0 -n dde
```

## Support

For deployment issues:
- Check logs first
- Review health endpoints
- Consult documentation
- Open GitHub issue

---

**Deployment Checklist:**
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules applied
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Health checks verified
- [ ] Load testing completed
- [ ] Documentation updated
