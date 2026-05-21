# Multi-stage build using Next.js `output: "standalone"`.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public
# No build-time env vars — the backend URL is consumed at runtime via the
# /api/:path* rewrite (see next.config.js → BACKEND_URL).
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["sh", "-c", "node server.js"]
