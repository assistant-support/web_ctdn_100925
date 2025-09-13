# -------- Base image --------
FROM node:20-alpine AS base

# -------- Install deps (with lockfile detection) --------
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

# -------- Build (standalone) --------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# YÊU CẦU: next.config.js phải có: module.exports = { output: 'standalone' }
RUN npm run build

# -------- Runtime (copy standalone bundle) --------
FROM base AS runner
WORKDIR /app

# Tùy chọn: cần cho một số project cũ dùng OpenSSL legacy
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV NODE_ENV=production

# !!! Biến môi trường (bake sẵn theo yêu cầu) !!!
# Khớp port 4004 bạn expose
ENV NEXTAUTH_URL="http://localhost:4004"
ENV NEXTAUTH_SECRET="AIzaSyCQYlefMrueYu1JPWKeEdSOPpSmb9Rceg8"
ENV AUTH_URL="http://localhost:4004" 
ENV AUTH_SECRET="AIzaSyCQYlefMrueYu1JPWKeEdSOPpSmb9Rceg8" 

ENV MONGODB_URI="mongodb+srv://web_ctdn_100925:GD2zc4BuaC3IffxU@ctdn100925.llu9goc.mongodb.net/data?retryWrites=true&w=majority&appName=ctdn100925"

# Google Service Account
ENV GOOGLE_PROJECT_ID="systemair-441909"
ENV GOOGLE_CLIENT_EMAIL="air-900@systemair-441909.iam.gserviceaccount.com"
# Nếu code của bạn cần NEWLINE thực sự, hãy nhớ replace: key = key.replace(/\\n/g, '\n')
ENV GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCaj27QQCgs37NH\nK5nVYClObEX6FudN11ikJoGb2d+spYaIT/9vAjj91Q7n/8uXlYNVWKS6po3LIqeH\nl1AT7yIlvaE+dztMq6zzRlsP8YvoGOWziE/wlPJF7icBfE1YtWih/MvIoQaBvp6I\nkpw5jUrxhlAd2DKxH4OnV6HsIoNIoBb3yKTPfhxfROuR/0uPT6V/y9TYWURo3rfF\nOC/lHwhIzlE2Z4G0BHRJVRylSbpMbPgpKfU7EQirq1pP9daxdz0WcrqBYC3h62ub\nJ6ycVwT8j4th3GNh1s5CXCqa2krpTmxUEbTCAbcgoMD/UWlbgq/evS4CF3suQJpT\njsHQjLJbAgMBAAECggEACBIBOUKAVod/tvGh4LBat8uTg9F6VmguKrQQBHFF6p/h\n/HAg6Ez3aNmdI6QJn2qhJu2v/EcCFF9E3CGcfs33vHzAVKCpKgG00CcWTijQo1fZ\ndpxhgDBmzhv3UW6KI12ljv/CLEGsM04evQbavW6RQTdAK67ERtdcanp66/eJX1tX\n0cljnVAlkzFi1Ctl89Ikc/arq6iEbIKczmlDC3QE3qEcqZhC68/9z0whdoe2nSje\nqR5oGwg1uHUrECelzoK0gkmUvdszRpSlWF1I0TqqXJuIZKdPzKRzbxk8nXXYQn6M\nOgPa7zYbbpCHwgY5GFrRkDB3mfDmH65FV2y/vPNBYQKBgQDHDIkcyijExPy+TU1z\nyWVdw5lpeOOANAkpKq9NUUMA+s0+KoRMSnYy8V4RnD5OmFbXdm6YjLdVBMLw727K\nxa4VDUFRPLLXiAQ/8YKs1/5jrIzanF5G7iKrbEkp2zm24+jhqQmUmTyNhVReq9u8\neov0MmQVVeRiYJ4XEz9MI9JAYwKBgQDGyEvYUHXkmB2IkeG2UQ4E2NcHZu1OhzKF\nsxE6zMkArEQoPVe5Xynjb3W25j6nosTlv6tC1rlm/x4C8BwSMXhvVJhF2bP8S9g2\nzwCguEQDXjt4pmTKnPrmkrHrv+RghsHz9WMGC6p7ZglUhPw/6X+kQdD1LqGC/XvV\nkKZNTL9bqQKBgDtN6tQfD0KBBmSUl4z15jOngV/BWtbpqgkP5Kb+nR3/m4L4G+63\nCLxo2YQZrx6vmMAdUxo0YrL79jDexX24pAM1rc5MbWR16/45MJvaxrpfwJ+pkxVD\nAiVc3/eOj4WEJfCF8orJlRb9MIP8ZD2lrWkWUmdg7ei5rKBnZaaDzbLNAoGBALql\nl5Gk+w2JRzHUyHrH4MHsWPs6SdhSWb3wRV1Qq+tV1Slzb8s+77X+EimKR4pf60FO\nlyBLPgrXwPZBPhpXGR5v8AqmP7nF/V55P72pRzNiZ7UBh+I3Q978HtOdenKoFbVb\n0375tTnotRoHRFM+i/tPUUTmZAD6wivlhkFOrt8BAoGBAKIZLPRr35ulqvKXwVOz\nDur/3sgr/dB9PMoG4UIGnujJgltVcL8FU1zhzVRP0k6kINX0xO8I6JYVD1DL1P7u\nBHRpVHkCDgwvjcZthoVXu9oZDUa7qlCGghxEJv+BUiIHvNM8/o9SwL1XXCP5kBc4\n50SEJBVXwva69G/ZdU1PIkAW\n-----END PRIVATE KEY-----\n"

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copy assets & standalone bundle
COPY --from=builder /app/public ./public
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Quan trọng: đổ nội dung standalone ra root => sẽ có /app/server.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 4004
ENV PORT=4004
ENV HOSTNAME="0.0.0.0"

# Entry
CMD ["node", "server.js"]
