# -------------------------------------------------------------
# Dockerfile · Sistema de Fiscalización Electoral (Almirante Brown)
# Sirve SPA React/Vite (/fiscalizacion) + Express/Prisma API (/api)
# -------------------------------------------------------------

# 1. Build Frontend Vite SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --prefer-offline --maxsockets=5
COPY index.html vite.config.ts tailwind.config.ts postcss.config.js tsconfig.json tsconfig.app.json tsconfig.node.json components.json ./
COPY public ./public
COPY src ./src
ENV VITE_API_URL=/fiscalizacion-api
ENV NODE_OPTIONS=--max-old-space-size=768
RUN npm run build

# 2. Build Backend Express + Prisma
FROM node:20-alpine AS api-builder
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app/api
COPY api/package.json api/package-lock.json ./
RUN npm ci --no-audit --no-fund --prefer-offline --maxsockets=5
COPY api/prisma ./prisma
RUN npx prisma generate
COPY api/tsconfig.json ./
COPY api/src ./src
RUN npm run build

# 3. Production Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app/api

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=frontend-builder /app/dist /app/dist
COPY --from=api-builder /app/api/node_modules ./node_modules
COPY --from=api-builder /app/api/dist ./dist
COPY --from=api-builder /app/api/prisma ./prisma
COPY --from=api-builder /app/api/package.json ./package.json
COPY api/data ./data

RUN mkdir -p /app/api/uploads

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
