FROM node:18-alpine

WORKDIR /app

# Copy monorepo structure
COPY package.json package-lock.json ./
COPY packages/ ./packages/

# Install dependencies (skip hooks)
RUN npm ci --ignore-scripts 2>&1 | grep -v "husky"

# Build Next.js from bookme-web workspace
WORKDIR /app/packages/bookme-web

# Build Next.js
RUN npm run build 2>&1

# Expose port
EXPOSE 3000

# Start app in production mode
ENV DOCKER_ENV=true
CMD ["npm", "run", "dev"]
