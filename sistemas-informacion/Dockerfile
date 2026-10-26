# syntax=docker/dockerfile:1

# ---------- Etapa 1: build ----------
# Node 24 (LTS) es coherente con @types/node ^24 y cumple el requisito de Vite 8.
FROM node:24-alpine AS build
WORKDIR /app

# Se copian primero los manifiestos para aprovechar la caché de capas:
# las dependencias solo se reinstalan si cambian package*.json.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Ejecuta "tsc -b && vite build" y genera /app/dist
RUN npm run build

# ---------- Etapa 2: runtime ----------
# nginx-unprivileged corre como usuario no root (uid 101) y escucha en 8080.
FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
