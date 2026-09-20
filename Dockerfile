FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 UPLOAD_DIR=/app/uploads
RUN addgroup -S -g 1001 portal && adduser -S -u 1001 -G portal portal
COPY --from=builder --chown=portal:portal /app/.next/standalone ./
COPY --from=builder --chown=portal:portal /app/.next/static ./.next/static
COPY --from=builder --chown=portal:portal /app/public ./public
COPY --from=builder --chown=portal:portal /app/scripts ./scripts
RUN mkdir -p uploads && chown portal:portal uploads
USER portal
EXPOSE 3000
CMD ["node", "server.js"]
