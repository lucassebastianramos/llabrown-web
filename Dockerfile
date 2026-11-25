# -------------------------------------------------------------
# Dockerfile para Producción · La Libertad Avanza Almirante Brown
# Compatible con x86_64 y ARM64 (Oracle Cloud)
# -------------------------------------------------------------

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# 1. Dependencias
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --prefer-offline

# 2. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=768"

RUN npm run build

# 3. Runner de Producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario seguro sin privilegios de root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar assets estáticos y standalone con permisos de escritura en /app/public/uploads
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
