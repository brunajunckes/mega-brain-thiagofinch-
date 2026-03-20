# BookMe Web UI — Deployment Guide

## Production Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors (`npm run lint`)
- [ ] Environment variables configured
- [ ] Database/storage initialized
- [ ] Security headers set
- [ ] Analytics configured

## Deployment Environments

### Development
```bash
npm run dev
# http://localhost:3000
```

### Staging
```
URL: staging.bookme.yourdomain.com
Node: 18+
Memory: 512MB
Storage: /var/lib/bookme
```

### Production
```
URL: bookme.yourdomain.com
Node: 18+
Memory: 2GB+
Storage: /var/lib/bookme
Database: Optional (file-based by default)
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  bookme-web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - BOOKME_DATA_DIR=/data/bookme
      - PROJECT_DATA_DIR=/data/projects
    volumes:
      - bookme-data:/data
    restart: unless-stopped

volumes:
  bookme-data:
```

### Deploy Docker Image

```bash
# Build
docker build -t bookme-web:latest .

# Run locally
docker run -p 3000:3000 bookme-web:latest

# Push to registry
docker push your-registry/bookme-web:latest

# Deploy to Kubernetes
kubectl apply -f k8s-deployment.yaml
```

## GitHub Actions CI/CD

Create `.github/workflows/bookme-deploy.yml`:

```yaml
name: BookMe Web Deploy

on:
  push:
    branches: [main]
    paths:
      - 'packages/bookme-web/**'
      - 'packages/bookme-engine/**'
      - 'packages/project-manager/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint --workspace=bookme-web
      - run: npm test --workspace=bookme-web

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build --workspace=bookme-web
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: packages/bookme-web/.next

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build --workspace=bookme-web
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          # Your deployment script
          ./scripts/deploy-bookme.sh
```

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd packages/bookme-web
vercel

# Production deployment
vercel --prod
```

Create `vercel.json`:

```json
{
  "name": "bookme-web",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "BOOKME_DATA_DIR": "@bookme-data-dir",
    "PROJECT_DATA_DIR": "@project-data-dir"
  }
}
```

## Railway.app Deployment

1. Connect GitHub repo
2. Select `packages/bookme-web` as root
3. Set environment variables:
   - `NODE_ENV=production`
   - `BOOKME_DATA_DIR=/var/lib/bookme`
   - `PROJECT_DATA_DIR=/var/lib/projects`
4. Set start command: `npm start`
5. Deploy

## Environment Variables

### Required
```
NODE_ENV=production
BOOKME_DATA_DIR=/var/lib/bookme
PROJECT_DATA_DIR=/var/lib/projects
```

### Optional
```
NEXT_PUBLIC_API_URL=https://api.bookme.yourdomain.com
LOG_LEVEL=info
ENABLE_ANALYTICS=true
SENTRY_DSN=https://...
```

## Post-Deployment

### 1. Initialize Data Directories

```bash
mkdir -p /var/lib/bookme /var/lib/projects
chmod 755 /var/lib/bookme /var/lib/projects
```

### 2. Health Check

```bash
curl https://bookme.yourdomain.com/api/health
# Should return: {"status": "ok"}
```

### 3. Setup Monitoring

```bash
# Sentry for error tracking
npm install @sentry/nextjs

# LogRocket for session replay
npm install logrocket

# Datadog for monitoring
npm install @datadog/browser-rum
```

### 4. Setup Backups

```bash
# Daily backup of data
0 2 * * * tar -czf /backups/bookme-$(date +%Y%m%d).tar.gz /var/lib/bookme
```

### 5. Setup SSL/TLS

```nginx
server {
    listen 443 ssl http2;
    server_name bookme.yourdomain.com;

    ssl_certificate /etc/ssl/certs/bookme.crt;
    ssl_certificate_key /etc/ssl/private/bookme.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Rollback Strategy

```bash
# Keep last 3 releases
ls -dt releases/*/ | tail -n +4 | xargs rm -rf

# Rollback to previous version
cd /var/lib/bookme
git checkout HEAD~1
npm install
npm run build
systemctl restart bookme
```

## Performance Monitoring

### Response Times
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s https://bookme.yourdomain.com/api/books
```

### Database Queries
```javascript
// In API routes
console.time('api-request');
// ... operation
console.timeEnd('api-request');
```

### Memory Usage
```bash
# Monitor Node process
ps aux | grep "node.*start" | grep -v grep
# or
pm2 monit
```

## Scaling Strategy

### Horizontal Scaling
- Deploy multiple instances behind load balancer
- Use shared file storage (NFS) for book data
- Use Redis for session caching (future)

### Vertical Scaling
- Increase Node memory: 1GB → 2GB → 4GB
- Use connection pooling (future)
- Optimize database queries (future)

## Troubleshooting

### High Memory Usage
```bash
# Check what's using memory
node --inspect=0.0.0.0:9229 ./node_modules/next/dist/bin/next start

# Analyze heap dump
kill -USR2 <pid>  # Generate heap dump
```

### Slow API Responses
```bash
# Enable debug logging
DEBUG=bookme-* npm start

# Check disk I/O
iostat -x 1
```

### Failed Deployments
```bash
# View application logs
journalctl -u bookme -f

# Rollback to last working version
./scripts/rollback.sh
```

## Security Checklist

- [ ] HTTPS enabled (no HTTP)
- [ ] Security headers set (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting configured
- [ ] Input validation on all APIs
- [ ] No sensitive data in logs
- [ ] Regular security updates
- [ ] Firewall rules configured
- [ ] Backup encryption enabled

## Production Support

For issues:
1. Check logs: `journalctl -u bookme -f`
2. Verify health: `curl /api/health`
3. Check disk space: `df -h /var/lib/bookme`
4. Restart service: `systemctl restart bookme`
5. Escalate if not resolved within 15 minutes

---

**Deployed:** Follow this guide to deploy BookMe Web UI to production
