#!/bin/bash

# Staging Database Rollback Script
# 
# Rolls back the last staging migration
# Detects last migration by timestamp and prompts for confirmation
#
# Usage: ./scripts/rollback-staging-db.sh
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
echo -e "${CYAN}Staging Database Rollback${NC}"
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

# Find migration files in order
MIGRATION_DIR="$PROJECT_ROOT/supabase/migrations"
SCHEMA_FILE="$PROJECT_ROOT/supabase/schema.sql"

if [ ! -d "$MIGRATION_DIR" ]; then
  echo -e "${YELLOW}⚠️  Migrations directory not found: ${MIGRATION_DIR}${NC}"
  echo -e "${YELLOW}   Only schema.sql rollback available${NC}\n"
  MIGRATIONS=()
else
  # Get all migration files sorted by name (timestamp)
  MIGRATIONS=($(ls -t "$MIGRATION_DIR"/*.sql 2>/dev/null | sort -r))
fi

if [ ${#MIGRATIONS[@]} -eq 0 ] && [ ! -f "$SCHEMA_FILE" ]; then
  echo -e "${RED}❌ No migrations found to rollback${NC}"
  exit 1
fi

# Determine last migration to rollback
LAST_MIGRATION=""
if [ ${#MIGRATIONS[@]} -gt 0 ]; then
  LAST_MIGRATION="${MIGRATIONS[0]}"
  echo -e "${BLUE}Last migration detected:${NC} $(basename "$LAST_MIGRATION")"
else
  echo -e "${YELLOW}⚠️  No migration files found, will rollback schema.sql only${NC}"
fi

# Show what will be rolled back
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Rollback Preview${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -n "$LAST_MIGRATION" ]; then
  echo -e "${BLUE}Migration to rollback:${NC}"
  echo -e "  $(basename "$LAST_MIGRATION")"
  echo -e "\n${BLUE}Migration content preview:${NC}"
  head -20 "$LAST_MIGRATION" | sed 's/^/  /'
  echo -e "\n${YELLOW}... (showing first 20 lines)${NC}\n"
fi

# Confirmation prompt
echo -e "${RED}⚠️  WARNING: This will rollback database changes!${NC}"
echo -e "${RED}   This action may cause data loss if not handled carefully.${NC}\n"
read -p "Are you sure you want to rollback? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo -e "${YELLOW}Rollback cancelled.${NC}"
  exit 0
fi

# Function to execute rollback SQL
execute_rollback() {
  local sql_file="$1"
  local description="$2"
  
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Rolling back: ${description}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  # Generate rollback SQL (reverse operations)
  # This is a simplified approach - in production, you'd want proper migration rollback scripts
  
  if [ "$USE_CLI" = true ]; then
    # Use Supabase CLI
    echo -e "${CYAN}Attempting rollback via Supabase CLI...${NC}"
    # Note: Supabase CLI doesn't have built-in rollback, so we'll use direct SQL
    USE_CLI=false
  fi
  
  if [ "$USE_CLI" = false ]; then
    # Extract project ref from URL
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\..*|\1|')
    
    if [ -z "$PROJECT_REF" ]; then
      echo -e "${RED}❌ Could not extract project reference from URL${NC}"
      exit 1
    fi
    
    # Use psql if available
    if command -v psql &> /dev/null && [ -n "$SUPABASE_DB_PASSWORD" ]; then
      echo -e "${CYAN}Executing rollback via psql...${NC}"
      DB_HOST=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1.supabase.co|')
      
      # Generate rollback SQL based on migration file
      ROLLBACK_SQL=$(generate_rollback_sql "$sql_file")
      
      if [ -n "$ROLLBACK_SQL" ]; then
        echo "$ROLLBACK_SQL" | PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$DB_HOST" -U postgres -d postgres || {
          echo -e "${RED}❌ Rollback SQL execution failed${NC}"
          exit 1
        }
      else
        echo -e "${YELLOW}⚠️  Could not generate rollback SQL automatically${NC}"
        echo -e "${YELLOW}   Please create a rollback script manually${NC}"
        exit 1
      fi
    else
      # Fallback: Manual instructions
      echo -e "${YELLOW}⚠️  Direct database access not available.${NC}"
      echo -e "${YELLOW}   Please run rollback SQL manually in Supabase SQL Editor:${NC}"
      echo -e "${CYAN}   File: ${sql_file}${NC}\n"
      generate_rollback_sql "$sql_file"
      echo -e "\n"
      read -p "Press Enter after running the rollback SQL in Supabase Dashboard..."
    fi
  fi
  
  echo -e "${GREEN}✅ Rollback completed: ${description}${NC}\n"
}

# Generate rollback SQL from migration file
generate_rollback_sql() {
  local migration_file="$1"
  local filename=$(basename "$migration_file")
  
  # Simple rollback generation based on common patterns
  # This is a basic implementation - production should have proper rollback scripts
  
  if [[ "$filename" == *"add-supporter-tier"* ]]; then
    cat <<EOF
-- Rollback: Remove supporter tier columns
ALTER TABLE public.users 
DROP COLUMN IF EXISTS supporter_status,
DROP COLUMN IF EXISTS supporter_purchased_at,
DROP COLUMN IF EXISTS supporter_expires_at;

DROP INDEX IF EXISTS idx_users_supporter_status;
EOF
  elif [[ "$filename" == *"add"* ]] && [[ "$filename" == *"table"* ]]; then
    # Try to extract table name from migration
    TABLE_NAME=$(grep -i "CREATE TABLE" "$migration_file" | head -1 | sed -E 's/.*CREATE TABLE.*IF NOT EXISTS.*\.([a-z_]+).*/\1/i')
    if [ -n "$TABLE_NAME" ]; then
      echo "-- Rollback: Drop table $TABLE_NAME"
      echo "DROP TABLE IF EXISTS public.$TABLE_NAME CASCADE;"
    fi
  else
    # Generic rollback - reverse common operations
    echo "-- Rollback for: $filename"
    echo "-- WARNING: This is an auto-generated rollback. Review carefully!"
    echo ""
    grep -i "CREATE TABLE" "$migration_file" | while read line; do
      TABLE_NAME=$(echo "$line" | sed -E 's/.*CREATE TABLE.*IF NOT EXISTS.*\.([a-z_]+).*/\1/i')
      if [ -n "$TABLE_NAME" ]; then
        echo "DROP TABLE IF EXISTS public.$TABLE_NAME CASCADE;"
      fi
    done
    grep -i "ALTER TABLE.*ADD COLUMN" "$migration_file" | while read line; do
      TABLE_NAME=$(echo "$line" | sed -E 's/.*ALTER TABLE.*\.([a-z_]+).*/\1/i')
      COLUMN_NAME=$(echo "$line" | sed -E 's/.*ADD COLUMN.*IF NOT EXISTS ([a-z_]+).*/\1/i')
      if [ -n "$TABLE_NAME" ] && [ -n "$COLUMN_NAME" ]; then
        echo "ALTER TABLE public.$TABLE_NAME DROP COLUMN IF EXISTS $COLUMN_NAME;"
      fi
    done
  fi
}

# Execute rollback
if [ -n "$LAST_MIGRATION" ]; then
  execute_rollback "$LAST_MIGRATION" "$(basename "$LAST_MIGRATION")"
else
  echo -e "${YELLOW}⚠️  No specific migration to rollback${NC}"
  echo -e "${YELLOW}   Schema rollback would require manual intervention${NC}"
  exit 1
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Rollback completed!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Verify database state in Supabase Dashboard"
echo -e "  2. Check data integrity"
echo -e "  3. Re-run migrations if needed: pnpm db:migrate:staging"
echo -e "  4. Re-seed data if needed: pnpm db:seed:staging\n"

