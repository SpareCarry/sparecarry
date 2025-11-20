#!/bin/bash

# CI/CD Build Pipeline Script for Next.js → Static Export → Capacitor
# 
# This script ensures consistent builds across all environments:
# - GitHub Actions
# - Render/Vercel CI
# - Local development
# - Mobile build pipelines
#
# Usage:
#   bash scripts/ci-build.sh
#
# Exit codes:
#   0 = Success
#   1 = Failure (any step fails)

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}ℹ${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

# Track start time
START_TIME=$(date +%s)

# Print header
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Next.js → Static Export → Capacitor CI/CD Build Pipeline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Install dependencies
log_info "Step 1/5: Installing dependencies..."
if npm install --legacy-peer-deps; then
    log_success "Dependencies installed successfully"
else
    log_error "Failed to install dependencies"
    exit 1
fi
echo ""

# Step 2: Run linting
log_info "Step 2/5: Running linter..."
if npm run lint; then
    log_success "Linting passed"
else
    log_warn "Linting failed (non-blocking, continuing...)"
fi
echo ""

# Step 3: Build Next.js static export
log_info "Step 3/5: Building Next.js static export..."
if npm run build; then
    log_success "Next.js build completed"
else
    log_error "Next.js build failed"
    exit 1
fi
echo ""

# Step 4: Validate export
log_info "Step 4/5: Validating static export..."
if npm run validate:export; then
    log_success "Export validation passed"
else
    log_error "Export validation failed"
    exit 1
fi
echo ""

# Step 5: Sync Capacitor (optional, only if Capacitor is configured)
log_info "Step 5/5: Syncing Capacitor..."
if [ -d "ios" ] || [ -d "android" ]; then
    if npx cap sync; then
        log_success "Capacitor sync completed"
    else
        log_warn "Capacitor sync failed (non-blocking, continuing...)"
    fi
else
    log_info "Capacitor projects not found, skipping sync"
fi
echo ""

# Calculate build time
END_TIME=$(date +%s)
BUILD_TIME=$((END_TIME - START_TIME))

# Print summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Build pipeline completed successfully!"
echo ""
echo "📊 Build Summary:"
echo "   Build time: ${BUILD_TIME}s"
echo "   Output directory: out/"
echo "   Status: ✅ Ready for deployment"
echo ""
echo "📱 Next steps for mobile:"
echo "   iOS:     npx cap open ios"
echo "   Android: npx cap open android"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0

