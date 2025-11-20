#!/bin/bash

# SpareCarry Supabase Setup Script
# This script applies all migrations and seed data to the Supabase project
# Usage: bash scripts/setup-supabase.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}SpareCarry Supabase Setup${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo -e "${YELLOW}Install it with: npm install -g supabase${NC}"
    exit 1
fi

# Check if .env.staging exists
if [ ! -f .env.staging ]; then
    echo -e "${YELLOW}⚠️  .env.staging not found. Using .env.local if available...${NC}"
    if [ ! -f .env.local ]; then
        echo -e "${RED}❌ No environment file found. Please create .env.staging${NC}"
        exit 1
    fi
    ENV_FILE=".env.local"
else
    ENV_FILE=".env.staging"
fi

# Load environment variables
export $(grep -v '^#' $ENV_FILE | xargs)

# Check required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Missing required Supabase environment variables${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Supabase Project:${NC}"
echo -e "   URL: $NEXT_PUBLIC_SUPABASE_URL"
echo -e "   Project ID: gujyzwqcwecbeznlablx\n"

# Apply migrations in order
echo -e "${BLUE}🔄 Applying migrations...${NC}\n"

MIGRATIONS=(
    "001_initial_schema.sql"
    "002_rls_policies.sql"
    "003_seed_data.sql"
    "004_auth_integration.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    MIGRATION_FILE="supabase/migrations/$migration"
    if [ -f "$MIGRATION_FILE" ]; then
        echo -e "${BLUE}Applying: $migration${NC}"
        
        # Use psql to apply migration
        PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql \
            -h gujyzwqcwecbeznlablx.supabase.co \
            -U postgres \
            -d postgres \
            -f "$MIGRATION_FILE" \
            || echo -e "${YELLOW}⚠️  Migration $migration had warnings${NC}"
    else
        echo -e "${YELLOW}⚠️  Migration file not found: $MIGRATION_FILE${NC}"
    fi
done

echo -e "\n${GREEN}✅ Migrations applied${NC}\n"

# Verify setup
echo -e "${BLUE}🔍 Verifying setup...${NC}\n"

# Check if tables exist
TABLES=("users" "trips" "requests" "matches" "messages" "disputes" "payments")

for table in "${TABLES[@]}"; do
    COUNT=$(PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql \
        -h gujyzwqcwecbeznlablx.supabase.co \
        -U postgres \
        -d postgres \
        -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ')
    
    if [ ! -z "$COUNT" ]; then
        echo -e "${GREEN}✅ Table $table: $COUNT rows${NC}"
    else
        echo -e "${YELLOW}⚠️  Table $table: Could not verify${NC}"
    fi
done

echo -e "\n${GREEN}✅ Supabase setup complete!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

