#!/bin/bash
# Database Restore Script
# Restores a PostgreSQL dump to target database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/db}"

# Database connection variables
PGHOST="${PGHOST:-${SUPABASE_DB_HOST}}"
PGUSER="${PGUSER:-${SUPABASE_DB_USER}}"
PGPASSWORD="${PGPASSWORD:-${SUPABASE_DB_PASSWORD}}"
PGDATABASE="${PGDATABASE:-${SUPABASE_DB_NAME}}"
PGPORT="${PGPORT:-${SUPABASE_DB_PORT:-5432}}"
SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"

# Safety flags
FORCE="${FORCE:-false}"
SKIP_CONFIRM="${SKIP_CONFIRM:-false}"

echo -e "${GREEN}🔄 Database Restore Script${NC}"
echo ""

# Parse arguments
BACKUP_FILE=""
TARGET_DB=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --file|-f)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --target|-t)
      TARGET_DB="$2"
      shift 2
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --skip-confirm)
      SKIP_CONFIRM=true
      shift
      ;;
    --list|-l)
      echo -e "${YELLOW}📋 Available backups:${NC}"
      ls -lh "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.sql 2>/dev/null | grep -v ".meta\|.sha256" || echo "No backups found"
      exit 0
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -f, --file FILE       Backup file to restore"
      echo "  -t, --target DB       Target database name (default: from PGDATABASE)"
      echo "  --force               Skip safety checks (DANGEROUS)"
      echo "  --skip-confirm        Skip confirmation prompts"
      echo "  -l, --list            List available backups"
      echo "  -h, --help            Show this help"
      exit 0
      ;;
    *)
      if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE="$1"
      fi
      shift
      ;;
  esac
done

# List backups if no file specified
if [ -z "$BACKUP_FILE" ]; then
  echo -e "${YELLOW}📋 Available backups:${NC}"
  ls -1t "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.sql 2>/dev/null | head -10 || {
    echo -e "${RED}❌ No backups found in $BACKUP_DIR${NC}"
    exit 1
  }
  echo ""
  read -p "Enter backup file name: " BACKUP_FILE
fi

# Resolve full path
if [[ "$BACKUP_FILE" != /* ]]; then
  BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

# Check if encrypted
DECRYPTED_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gpg ]]; then
  echo -e "${YELLOW}🔓 Backup is encrypted. Decrypting...${NC}"
  DECRYPTED_FILE="${BACKUP_FILE%.gpg}"
  gpg --decrypt "$BACKUP_FILE" > "$DECRYPTED_FILE" || {
    echo -e "${RED}❌ Error: Failed to decrypt backup${NC}"
    exit 1
  }
  trap "rm -f $DECRYPTED_FILE" EXIT
fi

# Verify backup integrity
echo -e "${YELLOW}🔍 Verifying backup integrity...${NC}"

if [[ "$DECRYPTED_FILE" == *.gz ]]; then
  if ! gzip -t "$DECRYPTED_FILE" 2>/dev/null; then
    echo -e "${RED}❌ Error: Backup file is corrupted (gzip test failed)${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Backup integrity verified${NC}"
elif [[ "$DECRYPTED_FILE" == *.sql ]]; then
  # Check if it's a custom format
  if pg_restore --list "$DECRYPTED_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backup integrity verified (custom format)${NC}"
  else
    echo -e "${YELLOW}⚠️  Assuming plain SQL format${NC}"
  fi
fi

# Verify checksum if available
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo -e "${YELLOW}🔍 Verifying checksum...${NC}"
  EXPECTED_CHECKSUM=$(cat "${BACKUP_FILE}.sha256")
  ACTUAL_CHECKSUM=$(sha256sum "$DECRYPTED_FILE" | cut -d' ' -f1)
  
  if [ "$EXPECTED_CHECKSUM" = "$ACTUAL_CHECKSUM" ]; then
    echo -e "${GREEN}✅ Checksum verified${NC}"
  else
    echo -e "${RED}❌ Error: Checksum mismatch!${NC}"
    echo "Expected: $EXPECTED_CHECKSUM"
    echo "Actual:   $ACTUAL_CHECKSUM"
    exit 1
  fi
fi

# Determine target database
if [ -z "$TARGET_DB" ]; then
  TARGET_DB="$PGDATABASE"
fi

if [ -z "$TARGET_DB" ]; then
  echo -e "${RED}❌ Error: Target database not specified${NC}"
  echo "Set PGDATABASE or use --target option"
  exit 1
fi

# Validate database connection
echo -e "${YELLOW}🔌 Testing database connection...${NC}"

if [ -n "$SUPABASE_DB_URL" ]; then
  if psql "$SUPABASE_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    CONNECTION_STRING="$SUPABASE_DB_URL"
  else
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    exit 1
  fi
else
  export PGHOST PGPORT PGUSER PGPASSWORD
  if psql -d "$TARGET_DB" -c "SELECT 1;" > /dev/null 2>&1; then
    CONNECTION_STRING=""
  else
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Database connection successful${NC}"

# Safety confirmation
if [ "$FORCE" != "true" ] && [ "$SKIP_CONFIRM" != "true" ]; then
  echo ""
  echo -e "${RED}⚠️  WARNING: This will OVERWRITE the target database!${NC}"
  echo -e "${RED}Target database: $TARGET_DB${NC}"
  echo -e "${RED}Backup file: $BACKUP_FILE${NC}"
  echo ""
  read -p "Type 'RESTORE' to confirm: " CONFIRM
  
  if [ "$CONFIRM" != "RESTORE" ]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 1
  fi
fi

# Perform restore
echo ""
echo -e "${YELLOW}🔄 Restoring database...${NC}"

if [[ "$DECRYPTED_FILE" == *.gz ]]; then
  # Gzipped SQL
  if [ -n "$CONNECTION_STRING" ]; then
    gunzip -c "$DECRYPTED_FILE" | psql "$CONNECTION_STRING" || {
      echo -e "${RED}❌ Error: Restore failed${NC}"
      exit 1
    }
  else
    gunzip -c "$DECRYPTED_FILE" | psql -d "$TARGET_DB" || {
      echo -e "${RED}❌ Error: Restore failed${NC}"
      exit 1
    }
  fi
elif pg_restore --list "$DECRYPTED_FILE" > /dev/null 2>&1; then
  # Custom format
  if [ -n "$CONNECTION_STRING" ]; then
    pg_restore --clean --if-exists --no-owner --no-acl -d "$CONNECTION_STRING" "$DECRYPTED_FILE" || {
      echo -e "${RED}❌ Error: Restore failed${NC}"
      exit 1
    }
  else
    pg_restore --clean --if-exists --no-owner --no-acl -d "$TARGET_DB" "$DECRYPTED_FILE" || {
      echo -e "${RED}❌ Error: Restore failed${NC}"
      exit 1
    }
  fi
else
  # Plain SQL
  if [ -n "$CONNECTION_STRING" ]; then
    psql "$CONNECTION_STRING" < "$DECRYPTED_FILE" || {
      echo -e "${RED}❌ Error: Restore failed${NC}"
      exit 1
    }
  else
    psql -d "$TARGET_DB" < "$DECRYPTED_FILE" || {
      echo -e "${RED}❌ Error: Restore failed${NC}"
      exit 1
    }
  fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Database restore complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Restored to: ${GREEN}$TARGET_DB${NC}"
echo -e "From backup: ${GREEN}$BACKUP_FILE${NC}"
echo ""

exit 0

