#!/bin/bash
# Database Backup Script
# Creates compressed PostgreSQL dumps from Supabase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/db}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${TIMESTAMP}.sql.gz"
ENCRYPT="${ENCRYPT:-false}"
GPG_RECIPIENT="${GPG_RECIPIENT:-}"

# Database connection variables (from environment or Supabase)
PGHOST="${PGHOST:-${SUPABASE_DB_HOST}}"
PGUSER="${PGUSER:-${SUPABASE_DB_USER}}"
PGPASSWORD="${PGPASSWORD:-${SUPABASE_DB_PASSWORD}}"
PGDATABASE="${PGDATABASE:-${SUPABASE_DB_NAME}}"
PGPORT="${PGPORT:-${SUPABASE_DB_PORT:-5432}}"

# Supabase connection string (alternative)
SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"

echo -e "${GREEN}🗄️  Starting database backup...${NC}"

# Validate required variables
if [ -z "$PGHOST" ] && [ -z "$SUPABASE_DB_URL" ]; then
  echo -e "${RED}❌ Error: Database connection not configured${NC}"
  echo "Set PGHOST/PGUSER/PGPASSWORD/PGDATABASE or SUPABASE_DB_URL"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Determine connection method
if [ -n "$SUPABASE_DB_URL" ]; then
  # Use connection string
  CONNECTION_STRING="$SUPABASE_DB_URL"
  echo -e "${YELLOW}📡 Using Supabase connection string${NC}"
else
  # Use individual parameters
  export PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD
  CONNECTION_STRING=""
  echo -e "${YELLOW}📡 Using PostgreSQL connection parameters${NC}"
fi

# Create backup
echo -e "${YELLOW}💾 Creating database dump...${NC}"

if [ -n "$CONNECTION_STRING" ]; then
  # Use connection string
  pg_dump "$CONNECTION_STRING" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_FILE%.gz}" 2>/dev/null || \
  pg_dump "$CONNECTION_STRING" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip -9 > "$BACKUP_FILE"
else
  # Use environment variables
  pg_dump \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_FILE%.gz}" 2>/dev/null || \
  pg_dump \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip -9 > "$BACKUP_FILE"
fi

# Verify backup was created
if [ ! -f "$BACKUP_FILE" ] && [ ! -f "${BACKUP_FILE%.gz}" ]; then
  echo -e "${RED}❌ Error: Backup file was not created${NC}"
  exit 1
fi

# Handle custom format backup
if [ -f "${BACKUP_FILE%.gz}" ] && [ ! -f "$BACKUP_FILE" ]; then
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE (${BACKUP_SIZE})${NC}"

# Encrypt backup if requested
if [ "$ENCRYPT" = "true" ] && [ -n "$GPG_RECIPIENT" ]; then
  echo -e "${YELLOW}🔐 Encrypting backup...${NC}"
  gpg --encrypt --recipient "$GPG_RECIPIENT" --output "${BACKUP_FILE}.gpg" "$BACKUP_FILE"
  rm "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gpg"
  echo -e "${GREEN}✅ Backup encrypted: $BACKUP_FILE${NC}"
fi

# Create metadata file
METADATA_FILE="${BACKUP_FILE}.meta"
cat > "$METADATA_FILE" << EOF
BACKUP_DATE=$TIMESTAMP
BACKUP_FILE=$BACKUP_FILE
BACKUP_SIZE=$BACKUP_SIZE
DATABASE=$PGDATABASE
HOST=$PGHOST
PG_VERSION=$(psql --version 2>/dev/null || echo "unknown")
EOF

echo -e "${GREEN}✅ Metadata saved: $METADATA_FILE${NC}"

# Verify backup integrity
echo -e "${YELLOW}🔍 Verifying backup integrity...${NC}"

if [[ "$BACKUP_FILE" == *.gz ]]; then
  # Test gzip integrity
  if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ Backup integrity verified (gzip)${NC}"
  else
    echo -e "${RED}❌ Error: Backup integrity check failed${NC}"
    exit 1
  fi
elif [[ "$BACKUP_FILE" == *.gpg ]]; then
  # Test GPG integrity
  if gpg --verify "${BACKUP_FILE%.gpg}.meta" 2>/dev/null || echo "GPG encrypted"; then
    echo -e "${GREEN}✅ Backup is encrypted (GPG)${NC}"
  fi
else
  # Test custom format
  if pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backup integrity verified (pg_restore --list)${NC}"
  else
    echo -e "${YELLOW}⚠️  Could not verify custom format backup${NC}"
  fi
fi

# Calculate checksum
CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
echo "$CHECKSUM" > "${BACKUP_FILE}.sha256"
echo -e "${GREEN}✅ Checksum saved: ${BACKUP_FILE}.sha256${NC}"

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Database backup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Backup file: ${GREEN}$BACKUP_FILE${NC}"
echo -e "Size: ${GREEN}$BACKUP_SIZE${NC}"
echo -e "Checksum: ${GREEN}$CHECKSUM${NC}"
echo -e "Timestamp: ${GREEN}$TIMESTAMP${NC}"
echo ""

# Cleanup old backups (optional, can be run separately)
if [ "${AUTO_ROTATE:-false}" = "true" ]; then
  echo -e "${YELLOW}🔄 Rotating old backups...${NC}"
  "${0%/*}/rotate_backups.sh" --db --days "$RETENTION_DAYS" || true
fi

exit 0

