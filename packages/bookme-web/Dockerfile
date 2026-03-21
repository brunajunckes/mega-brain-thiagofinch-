FROM node:18-alpine

WORKDIR /app

# Copy package files (exclude pnpm-lock to force npm)
COPY package.json ./

# Install dependencies with npm
RUN npm install --legacy-peer-deps 2>&1 | tail -5

# Copy source
COPY src/ ./src/
COPY styles/ ./styles/
COPY next.config.js tsconfig.json next-env.d.ts ./

# Expose port
EXPOSE 3000

# Start app in dev mode
ENV DOCKER_ENV=true
CMD ["npx", "next", "dev", "--port", "3000"]
