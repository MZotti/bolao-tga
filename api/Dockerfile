# syntax=docker/dockerfile:1
#
# Imagem de produção da API (NestJS + Prisma).
#
# Ao iniciar, o container aplica as migrations pendentes (prisma migrate deploy)
# e depois sobe a API. O seed é manual (ver DEPLOY.md), para que a senha do
# admin apareça só no seu terminal e não fique nos logs do Docker.

# ---------- 1. Build: instala tudo (inclusive devDependencies) e compila ----------
FROM node:24-alpine AS build
WORKDIR /app

# O Prisma precisa do OpenSSL
RUN apk add --no-cache openssl

# O prisma.config.ts exige DATABASE_URL até para gerar o client.
# Ninguém conecta neste endereço: é só um valor de mentira para o build.
ARG BUILD_DATABASE_URL="postgresql://build:build@localhost:5432/build"

# Dependências primeiro: enquanto package.json/yarn.lock/schema não mudarem,
# o Docker reaproveita esta camada e o build fica bem mais rápido
COPY package.json yarn.lock prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
RUN DATABASE_URL="$BUILD_DATABASE_URL" yarn install --frozen-lockfile

COPY . .
RUN yarn build

# ---------- 2. Runtime: só dependências de produção + código compilado ----------
FROM node:24-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache openssl

ARG BUILD_DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY package.json yarn.lock prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
# prisma (migrations) e tsx (seed) estão em "dependencies" de propósito
RUN DATABASE_URL="$BUILD_DATABASE_URL" yarn install --production --frozen-lockfile \
  && yarn cache clean

COPY --from=build /app/dist ./dist
# O seed (prisma/seed.ts) importa estes arquivos
COPY src/common ./src/common

COPY docker-entrypoint.sh ./
# Remove CRLF caso o arquivo tenha vindo de um checkout no Windows
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

ENV NODE_ENV=production \
    PORT=3000

# Roda sem privilégios de root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api > /dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
