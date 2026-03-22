FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3010

ENV PORT=3010
ENV NODE_ENV=production

CMD ["npx", "next", "dev", "--port", "3010"]
