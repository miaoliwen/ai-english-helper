FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

RUN mkdir -p /app/data

EXPOSE 3001
CMD ["node", "dist/app.js"]
