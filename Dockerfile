# ---------- Base ----------
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- Deps ----------
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ---------- Builder ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# yêu cầu: next.config.mjs/js có:  export default { output: 'standalone' }
RUN npm run build

# ---------- Runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=4004
# OpenSSL legacy thường không cần với Node 22 => bỏ
# ENV NODE_OPTIONS=--openssl-legacy-provider

# user không chạy root
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 nextjs

# assets & server
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Nếu muốn dùng file .env trong repo ở runtime (KHÔNG khuyến nghị nhúng secret):
# - đảm bảo .dockerignore KHÔNG chặn .env
# - bỏ comment dòng dưới
# COPY ./.env ./.env
# hoặc tốt hơn: docker run --env-file .env ...

USER nextjs
EXPOSE 4004
CMD ["node", "server.js"]
