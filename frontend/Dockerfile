# Dockerfile para Frontend - The Brothers Barber Shop React + Vite
# Multi-stage build optimizado para producción

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies
FROM base AS dev-deps
COPY package*.json ./
RUN npm ci

# Development stage
FROM dev-deps AS development
COPY . .
EXPOSE 5173
USER node
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM dev-deps AS build
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine AS production
RUN apk add --no-cache curl

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S barbershop && \
    adduser -S barbershop -u 1001 -G barbershop

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]