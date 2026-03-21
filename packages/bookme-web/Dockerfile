FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN npm install --legacy-peer-deps 2>&1 | tail -5

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Start app in dev mode
ENV DOCKER_ENV=true
CMD ["npx", "next", "dev", "--port", "3000"]
