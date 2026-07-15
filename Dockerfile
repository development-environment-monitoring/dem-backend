FROM node:24-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package*.json ./
RUN npm ci

FROM base AS build

COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3026

CMD ["node", "dist/main.js"]
