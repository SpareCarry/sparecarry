#!/bin/bash

# Staging Database Migration Script
# 
# Runs migrations against STAGING Supabase project
# Applies schema and migrations in correct order
#
# Usage: ./scripts/migrate-staging-db.sh
# 
# Required environment variables:
#   STAGING_SUPABASE_URL
#   STAGING_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
#   SUPABASE_DB_PASSWORD (optional, for direct DB connection)

set -e  # Exit on first failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Staging Database Migration${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check for required environment variables
if [ -z "$STAGING_SUPABASE_URL" ] && [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}❌ Error: STAGING_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL not set${NC}"
  echo -e "   Set in .env.staging or export before running"
  exit 1
fi

if [ -z "$STAGING_SUPABASE_SERVICE_ROLE_KEY" ] && [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Error: STAGING_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY not set${NC}"
  echo -e "   Set in .env.staging or export before running"
  exit 1
fi

# Use staging vars if available, otherwise fall back to regular vars
SUPABASE_URL="${STAGING_SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${STAGING_SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_SERVICE_ROLE_KEY}"

echo -e "${BLUE}Supabase URL:${NC} ${SUPABASE_URL}"
echo -e "${BLUE}Service Key:${NC} ${SERVICE_KEY:0:20}...\n"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Supabase CLI not found. Using direct SQL execution.${NC}\n"
  USE_CLI=false
else
  echo -e "${GREEN}✅ Supabase CLI found${NC}\n"
  USE_CLI=true
fi

# Function to execute SQL via Supabase API
execute_sql() {
  local sql_file="$1"
  local description="$2"
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}${description}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  if [ "$USE_CLI" = true ]; then
    # Use Supabase CLI
    echo -e "${CYAN}Executing via Supabase CLI...${NC}"
    supabase db push --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@${SUPABASE_URL#https://}" --file "$sql_file" || {
      echo -e "${YELLOW}⚠️  CLI method failed, trying direct API...${NC}"
      USE_CLI=false
    }
  fi
  
  if [ "$USE_CLI" = false ]; then
    # Use direct API call via psql or HTTP
    # Extract project ref from URL
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\..*|\1|')
    
    if [ -z "$PROJECT_REF" ]; then
      echo -e "${RED}❌ Could not extract project reference from URL${NC}"
      exit 1
    fi
    
    # Use psql if available
    if command -v psql &> /dev/null && [ -n "$SUPABASE_DB_PASSWORD" ]; then
      echo -e "${CYAN}Executing via psql...${NC}"
      DB_HOST=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1.supabase.co|')
      PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$DB_HOST" -U postgres -d postgres -f "$sql_file" || {
        echo -e "${RED}❌ SQL execution failed${NC}"
        exit 1
      }
    else
      # Fallback: Use HTTP API (limited - only for simple queries)
      echo -e "${YELLOW}⚠️  Direct database access not available.${NC}"
      echo -e "${YELLOW}   Please run SQL manually in Supabase SQL Editor:${NC}"
      echo -e "${CYAN}   File: ${sql_file}${NC}\n"
      cat "$sql_file"
      echo -e "\n"
      read -p "Press Enter after running the SQL in Supabase Dashboard..."
    fi
  fi
  
  echo -e "${GREEN}✅ ${description} completed${NC}\n"
}

# Migration order
MIGRATIONS=(
  "supabase/schema.sql:Main Schema"
  "supabase/storage-setup.sql:Storage Setup"
  "supabase/realtime-setup.sql:Realtime Setup"
  "supabase/migrations/add-supporter-tier.sql:Supporter Tier Migration"
  "supabase/seed-meetup-locations.sql:Seed Meetup Locations"
)

# Execute migrations in order
for migration in "${MIGRATIONS[@]}"; do
  IFS=':' read -r file desc <<< "$migration"
  file_path="$PROJECT_ROOT/$file"
  
  if [ ! -f "$file_path" ]; then
    echo -e "${YELLOW}⚠️  Migration file not found: ${file_path}${NC}"
    echo -e "${YELLOW}   Skipping...${NC}\n"
    continue
  fi
  
  execute_sql "$file_path" "$desc"
done

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All migrations completed!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Verify tables in Supabase Dashboard"
echo -e "  2. Run seed script: pnpm db:seed:staging"
echo -e "  3. Verify RLS policies are enabled"
echo -e "  4. Test database connectivity\n"

