#!/bin/bash
# Backup Rotation Script
# Deletes backups older than specified retention period

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DRY_RUN="${DRY_RUN:-false}"

# Parse arguments
BACKUP_TYPE="all"  # all, db, storage

while [[ $# -gt 0 ]]; do
  case $1 in
    --db)
      BACKUP_TYPE="db"
      shift
      ;;
    --storage)
      BACKUP_TYPE="storage"
      shift
      ;;
    --days|-d)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --db              Rotate database backups only"
      echo "  --storage         Rotate storage backups only"
      echo "  -d, --days DAYS   Retention period in days (default: 30)"
      echo "  --dry-run         Show what would be deleted without deleting"
      echo "  -h, --help        Show this help"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🔄 Backup Rotation${NC}"
echo -e "Retention: ${YELLOW}${RETENTION_DAYS} days${NC}"
echo -e "Type: ${YELLOW}${BACKUP_TYPE}${NC}"
if [ "$DRY_RUN" = "true" ]; then
  echo -e "Mode: ${YELLOW}DRY RUN (no files will be deleted)${NC}"
fi
echo ""

# Calculate cutoff date
CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%s 2>/dev/null || \
  date -v-${RETENTION_DAYS}d +%s 2>/dev/null || \
  echo "0")

if [ "$CUTOFF_DATE" = "0" ]; then
  echo -e "${RED}❌ Error: Unable to calculate cutoff date${NC}"
  exit 1
fi

# Function to delete old backups
rotate_backups() {
  local BACKUP_PATH="$1"
  local PATTERN="$2"
  local TYPE="$3"
  
  if [ ! -d "$BACKUP_PATH" ]; then
    echo -e "${YELLOW}⚠️  Backup directory not found: $BACKUP_PATH${NC}"
    return
  fi
  
  echo -e "${YELLOW}📂 Scanning: $BACKUP_PATH${NC}"
  
  DELETED_COUNT=0
  DELETED_SIZE=0
  KEPT_COUNT=0
  
  # Find and process backups
  find "$BACKUP_PATH" -type f -name "$PATTERN" | while read -r BACKUP_FILE; do
    # Get file modification time
    FILE_TIME=$(stat -c %Y "$BACKUP_FILE" 2>/dev/null || \
      stat -f %m "$BACKUP_FILE" 2>/dev/null || \
      echo "0")
    
    if [ "$FILE_TIME" = "0" ]; then
      continue
    fi
    
    # Check if file is older than cutoff
    if [ "$FILE_TIME" -lt "$CUTOFF_DATE" ]; then
      FILE_SIZE=$(stat -c %s "$BACKUP_FILE" 2>/dev/null || \
        stat -f %z "$BACKUP_FILE" 2>/dev/null || \
        echo "0")
      
      if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}  Would delete: $(basename "$BACKUP_FILE")${NC}"
      else
        rm -f "$BACKUP_FILE"
        # Also delete associated files
        rm -f "${BACKUP_FILE}.meta" "${BACKUP_FILE}.sha256" 2>/dev/null
        echo -e "${GREEN}  Deleted: $(basename "$BACKUP_FILE")${NC}"
      fi
      
      DELETED_COUNT=$((DELETED_COUNT + 1))
      DELETED_SIZE=$((DELETED_SIZE + FILE_SIZE))
    else
      KEPT_COUNT=$((KEPT_COUNT + 1))
    fi
  done
  
  # Summary
  if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}  Would delete: $DELETED_COUNT files${NC}"
  else
    echo -e "${GREEN}  Deleted: $DELETED_COUNT files${NC}"
  fi
  echo -e "${GREEN}  Kept: $KEPT_COUNT files${NC}"
  
  # Format deleted size
  if [ "$DELETED_SIZE" -gt 0 ]; then
    DELETED_SIZE_HR=$(numfmt --to=iec-i --suffix=B "$DELETED_SIZE" 2>/dev/null || \
      echo "${DELETED_SIZE} bytes")
    echo -e "${GREEN}  Freed: $DELETED_SIZE_HR${NC}"
  fi
}

# Rotate based on type
case "$BACKUP_TYPE" in
  db)
    rotate_backups "${BACKUP_DIR}/db" "*.sql.gz" "database"
    rotate_backups "${BACKUP_DIR}/db" "*.sql" "database"
    rotate_backups "${BACKUP_DIR}/db" "*.gpg" "database"
    ;;
  storage)
    rotate_backups "${BACKUP_DIR}/storage" "*.tar.gz" "storage"
    ;;
  all)
    rotate_backups "${BACKUP_DIR}/db" "*.sql.gz" "database"
    rotate_backups "${BACKUP_DIR}/db" "*.sql" "database"
    rotate_backups "${BACKUP_DIR}/db" "*.gpg" "database"
    rotate_backups "${BACKUP_DIR}/storage" "*.tar.gz" "storage"
    ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Backup rotation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit 0

