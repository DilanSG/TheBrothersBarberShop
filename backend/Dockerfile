# Dockerfile Multi-stage para Backend - The Brothers Barber Shop
# Optimizado para producción con Node.js 20 Alpine

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5000
USER node
CMD ["dumb-init", "node", "src/index.js"]

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build 2>/dev/null || echo "No build script found, skipping..."

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV PORT=5000

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S barbershop && \
    adduser -S barbershop -u 1001 -G barbershop

# Set ownership
RUN chown -R barbershop:barbershop /app
USER barbershop

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 5000
CMD ["dumb-init", "node", "src/index.js"]