FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3026
ENV DB_PATH=/app/data/dem.sqlite

RUN mkdir -p /app/data

EXPOSE 3026

CMD ["node", "dist/main.js"]
