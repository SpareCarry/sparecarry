#!/bin/bash
# Backup Verification Script
# Verifies integrity of database and storage backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Parse arguments
BACKUP_FILE=""
VERIFY_TYPE="all"  # all, db, storage, checksum, integrity

while [[ $# -gt 0 ]]; do
  case $1 in
    --file|-f)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --type|-t)
      VERIFY_TYPE="$2"
      shift 2
      ;;
    --db)
      VERIFY_TYPE="db"
      shift
      ;;
    --storage)
      VERIFY_TYPE="storage"
      shift
      ;;
    --checksum)
      VERIFY_TYPE="checksum"
      shift
      ;;
    --integrity)
      VERIFY_TYPE="integrity"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -f, --file FILE     Specific backup file to verify"
      echo "  -t, --type TYPE     Verification type: all, db, storage, checksum, integrity"
      echo "  --db                Verify database backups only"
      echo "  --storage           Verify storage backups only"
      echo "  --checksum          Verify checksums only"
      echo "  --integrity         Verify integrity only"
      echo "  -h, --help          Show this help"
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

echo -e "${GREEN}🔍 Backup Verification${NC}"
echo ""

# Function to verify database backup
verify_db_backup() {
  local BACKUP_FILE="$1"
  
  echo -e "${YELLOW}🔍 Verifying database backup: $(basename "$BACKUP_FILE")${NC}"
  
  # Check file exists
  if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found${NC}"
    return 1
  fi
  
  # Verify checksum if available
  if [ -f "${BACKUP_FILE}.sha256" ]; then
    echo -e "${YELLOW}  Verifying checksum...${NC}"
    EXPECTED_CHECKSUM=$(cat "${BACKUP_FILE}.sha256")
    ACTUAL_CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
    
    if [ "$EXPECTED_CHECKSUM" = "$ACTUAL_CHECKSUM" ]; then
      echo -e "${GREEN}  ✅ Checksum verified${NC}"
    else
      echo -e "${RED}  ❌ Checksum mismatch!${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}  ⚠️  No checksum file found${NC}"
  fi
  
  # Verify integrity
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}  Verifying gzip integrity...${NC}"
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
      echo -e "${GREEN}  ✅ Gzip integrity verified${NC}"
    else
      echo -e "${RED}  ❌ Gzip integrity check failed${NC}"
      return 1
    fi
  elif [[ "$BACKUP_FILE" == *.gpg ]]; then
    echo -e "${YELLOW}  Verifying GPG encryption...${NC}"
    if gpg --verify "${BACKUP_FILE%.gpg}.meta" 2>/dev/null || echo "GPG encrypted"; then
      echo -e "${GREEN}  ✅ GPG encrypted backup${NC}"
    fi
  else
    # Try pg_restore --list for custom format
    echo -e "${YELLOW}  Verifying PostgreSQL format...${NC}"
    if pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1; then
      echo -e "${GREEN}  ✅ PostgreSQL format verified${NC}"
      # List contents
      TABLE_COUNT=$(pg_restore --list "$BACKUP_FILE" | grep -c "TABLE DATA" || echo "0")
      echo -e "${GREEN}  📊 Contains $TABLE_COUNT table data entries${NC}"
    else
      echo -e "${YELLOW}  ⚠️  Not a PostgreSQL custom format (may be plain SQL)${NC}"
    fi
  fi
  
  # Check metadata if available
  if [ -f "${BACKUP_FILE}.meta" ]; then
    echo -e "${YELLOW}  Reading metadata...${NC}"
    source "${BACKUP_FILE}.meta"
    echo -e "${GREEN}  📅 Backup date: ${BACKUP_DATE:-unknown}${NC}"
    echo -e "${GREEN}  💾 Size: ${BACKUP_SIZE:-unknown}${NC}"
    echo -e "${GREEN}  🗄️  Database: ${DATABASE:-unknown}${NC}"
  fi
  
  echo -e "${GREEN}✅ Database backup verification complete${NC}"
  return 0
}

# Function to verify storage backup
verify_storage_backup() {
  local BACKUP_FILE="$1"
  
  echo -e "${YELLOW}🔍 Verifying storage backup: $(basename "$BACKUP_FILE")${NC}"
  
  # Check file exists
  if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found${NC}"
    return 1
  fi
  
  # Verify checksum if available
  if [ -f "${BACKUP_FILE}.sha256" ]; then
    echo -e "${YELLOW}  Verifying checksum...${NC}"
    EXPECTED_CHECKSUM=$(cat "${BACKUP_FILE}.sha256")
    ACTUAL_CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
    
    if [ "$EXPECTED_CHECKSUM" = "$ACTUAL_CHECKSUM" ]; then
      echo -e "${GREEN}  ✅ Checksum verified${NC}"
    else
      echo -e "${RED}  ❌ Checksum mismatch!${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}  ⚠️  No checksum file found${NC}"
  fi
  
  # Verify tar integrity
  if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
    echo -e "${YELLOW}  Verifying tar.gz integrity...${NC}"
    if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
      echo -e "${GREEN}  ✅ Tar.gz integrity verified${NC}"
      
      # List contents
      FILE_COUNT=$(tar -tzf "$BACKUP_FILE" | wc -l)
      echo -e "${GREEN}  📦 Contains $FILE_COUNT files/directories${NC}"
      
      # Check for manifest
      if tar -tzf "$BACKUP_FILE" | grep -q "manifest.json"; then
        echo -e "${GREEN}  ✅ Manifest found${NC}"
        
        # Extract and read manifest
        TEMP_DIR=$(mktemp -d)
        trap "rm -rf $TEMP_DIR" EXIT
        tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR" manifest.json 2>/dev/null || true
        
        if [ -f "$TEMP_DIR/manifest.json" ]; then
          BUCKET_COUNT=$(jq 'length' "$TEMP_DIR/manifest.json" 2>/dev/null || echo "0")
          echo -e "${GREEN}  📋 Manifest contains $BUCKET_COUNT buckets${NC}"
        fi
      fi
    else
      echo -e "${RED}  ❌ Tar.gz integrity check failed${NC}"
      return 1
    fi
  fi
  
  echo -e "${GREEN}✅ Storage backup verification complete${NC}"
  return 0
}

# Verify specific file
if [ -n "$BACKUP_FILE" ]; then
  if [[ "$BACKUP_FILE" == *storage* ]] || [[ "$BACKUP_FILE" == *.tar.gz ]]; then
    verify_storage_backup "$BACKUP_FILE"
  else
    verify_db_backup "$BACKUP_FILE"
  fi
  exit $?
fi

# Verify all backups
VERIFIED=0
FAILED=0

case "$VERIFY_TYPE" in
  db|all)
    echo -e "${YELLOW}📂 Verifying database backups...${NC}"
    for BACKUP in "${BACKUP_DIR}/db"/*.sql.gz "${BACKUP_DIR}/db"/*.sql "${BACKUP_DIR}/db"/*.gpg; do
      if [ -f "$BACKUP" ]; then
        if verify_db_backup "$BACKUP"; then
          VERIFIED=$((VERIFIED + 1))
        else
          FAILED=$((FAILED + 1))
        fi
        echo ""
      fi
    done
    ;;
esac

case "$VERIFY_TYPE" in
  storage|all)
    echo -e "${YELLOW}📂 Verifying storage backups...${NC}"
    for BACKUP in "${BACKUP_DIR}/storage"/*.tar.gz; do
      if [ -f "$BACKUP" ]; then
        if verify_storage_backup "$BACKUP"; then
          VERIFIED=$((VERIFIED + 1))
        else
          FAILED=$((FAILED + 1))
        fi
        echo ""
      fi
    done
    ;;
esac

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Verification Summary${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Verified: ${GREEN}$VERIFIED${NC}"
if [ "$FAILED" -gt 0 ]; then
  echo -e "Failed: ${RED}$FAILED${NC}"
else
  echo -e "Failed: ${GREEN}$FAILED${NC}"
fi
echo ""

exit $([ "$FAILED" -eq 0 ] && echo 0 || echo 1)

