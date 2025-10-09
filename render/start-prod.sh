#!/bin/bash
# start-prod.sh - Production startup script for Render deployment
# Optimized for The Brothers Barber Shop backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Production startup sequence
log_info "🚀 Starting The Brothers Barber Shop backend in production..."

# Validate environment
log_info "Validating environment variables..."
if [ -z "$MONGODB_URI" ]; then
    log_error "MONGODB_URI is not set"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    log_error "JWT_SECRET is not set"
    exit 1
fi

log_success "Environment validation passed"

# Set production defaults
export NODE_ENV=production
export PORT=${PORT:-5000}
export LOG_LEVEL=${LOG_LEVEL:-info}

# Database connection test
log_info "Testing database connection..."
timeout 10 node -e "
import mongoose from 'mongoose';
mongoose.connect('$MONGODB_URI', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000
}).then(() => {
  console.log('✅ Database connection successful');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
});
" || {
    log_error "Database connection test failed"
    exit 1
}

# Run database migrations if available
if [ -f "scripts/migrate.js" ]; then
    log_info "Running database migrations..."
    node scripts/migrate.js
    log_success "Migrations completed"
else
    log_info "No migrations found, skipping..."
fi

# Optimize Node.js for production
export NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size"

# Set memory limits
export UV_THREADPOOL_SIZE=4

# Health check before starting
log_info "Performing pre-startup health checks..."

# Check disk space
available_space=$(df / | tail -1 | awk '{print $4}')
if [ "$available_space" -lt 1000000 ]; then  # Less than 1GB
    log_warning "Low disk space available: ${available_space}KB"
fi

# Check memory
if [ -f /proc/meminfo ]; then
    available_mem=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
    if [ "$available_mem" -lt 256000 ]; then  # Less than 256MB
        log_warning "Low memory available: ${available_mem}KB"
    fi
fi

log_success "Health checks completed"

# Create necessary directories
log_info "Setting up directories..."
mkdir -p logs
mkdir -p uploads/temp
chmod 755 logs uploads

# Start the application with PM2-like behavior
log_info "Starting application server on port $PORT..."

# Trap signals for graceful shutdown
trap 'log_info "Received shutdown signal, gracefully shutting down..."; kill -TERM $PID; wait $PID' TERM INT

# Start Node.js application
node src/index.js &
PID=$!

log_success "🎉 The Brothers Barber Shop backend started successfully!"
log_info "🌐 Server running on port: $PORT"
log_info "📊 Environment: $NODE_ENV"
log_info "🗄️  Database: Connected"
log_info "📝 Logs: ./logs/"

# Wait for the process
wait $PID