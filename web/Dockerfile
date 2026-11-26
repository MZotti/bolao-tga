# syntax=docker/dockerfile:1
#
# Imagem de produção do front: o build do Vite vai para DENTRO da imagem do Caddy,
# que serve os arquivos estáticos, encaminha /api para a API e cuida do HTTPS.
# O Caddyfile fica na raiz do repositório e é montado pelo docker-compose.yml.

# ---------- 1. Build do React/Vite ----------
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ---------- 2. Caddy servindo o build ----------
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
