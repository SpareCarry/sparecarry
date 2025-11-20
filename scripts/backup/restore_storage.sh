#!/bin/bash
# Storage Restore Script
# Restores Supabase storage buckets from backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/storage}"

# Supabase configuration
SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL}}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-${SUPABASE_SERVICE_ROLE_KEY}}"

# Safety flags
FORCE="${FORCE:-false}"
SKIP_CONFIRM="${SKIP_CONFIRM:-false}"

echo -e "${GREEN}🔄 Storage Restore Script${NC}"
echo ""

# Parse arguments
BACKUP_FILE=""
BUCKET_NAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --file|-f)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --bucket|-b)
      BUCKET_NAME="$2"
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
      ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | grep -v ".sha256" || echo "No backups found"
      exit 0
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -f, --file FILE       Backup archive to restore"
      echo "  -b, --bucket BUCKET   Specific bucket to restore (optional)"
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
  ls -1t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | head -10 || {
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

# Verify checksum if available
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo -e "${YELLOW}🔍 Verifying checksum...${NC}"
  EXPECTED_CHECKSUM=$(cat "${BACKUP_FILE}.sha256")
  ACTUAL_CHECKSUM=$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)
  
  if [ "$EXPECTED_CHECKSUM" = "$ACTUAL_CHECKSUM" ]; then
    echo -e "${GREEN}✅ Checksum verified${NC}"
  else
    echo -e "${RED}❌ Error: Checksum mismatch!${NC}"
    exit 1
  fi
fi

# Extract archive
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo -e "${YELLOW}📦 Extracting archive...${NC}"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR" || {
  echo -e "${RED}❌ Error: Failed to extract archive${NC}"
  exit 1
}

# Find manifest
MANIFEST=$(find "$TEMP_DIR" -name "manifest.json" | head -1)
if [ -z "$MANIFEST" ]; then
  echo -e "${RED}❌ Error: Manifest not found in backup${NC}"
  exit 1
fi

# Read manifest
BUCKETS=$(jq -r '.[].bucket' "$MANIFEST")

# Safety confirmation
if [ "$FORCE" != "true" ] && [ "$SKIP_CONFIRM" != "true" ]; then
  echo ""
  echo -e "${RED}⚠️  WARNING: This will OVERWRITE storage buckets!${NC}"
  echo -e "${RED}Backup file: $BACKUP_FILE${NC}"
  echo -e "${RED}Buckets to restore:${NC}"
  echo "$BUCKETS" | while read -r BUCKET; do
    echo -e "  - ${RED}$BUCKET${NC}"
  done
  echo ""
  read -p "Type 'RESTORE' to confirm: " CONFIRM
  
  if [ "$CONFIRM" != "RESTORE" ]; then
    echo -e "${YELLOW}❌ Restore cancelled${NC}"
    exit 1
  fi
fi

# Function to restore bucket
restore_bucket() {
  local BUCKET="$1"
  local BACKUP_PATH="$2"
  
  echo -e "${YELLOW}📥 Restoring bucket: $BUCKET${NC}"
  
  # Find backup path
  BUCKET_BACKUP=$(find "$TEMP_DIR" -type d -name "$BUCKET" | head -1)
  if [ -z "$BUCKET_BACKUP" ]; then
    echo -e "${RED}❌ Error: Bucket backup not found: $BUCKET${NC}"
    return 1
  fi
  
  # Upload files
  FILE_COUNT=0
  find "$BUCKET_BACKUP" -type f | while read -r FILE_PATH; do
    RELATIVE_PATH="${FILE_PATH#$BUCKET_BACKUP/}"
    
    # Upload file
    curl -s -X POST \
      "${SUPABASE_URL}/storage/v1/object/${BUCKET}/${RELATIVE_PATH}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Content-Type: $(file --mime-type -b "$FILE_PATH")" \
      --data-binary "@$FILE_PATH" > /dev/null || {
      echo -e "${RED}⚠️  Failed to upload: $RELATIVE_PATH${NC}"
      continue
    }
    
    FILE_COUNT=$((FILE_COUNT + 1))
    if [ $((FILE_COUNT % 10)) -eq 0 ]; then
      echo -e "${YELLOW}  Uploaded $FILE_COUNT files...${NC}"
    fi
  done
  
  echo -e "${GREEN}✅ Bucket $BUCKET restored ($FILE_COUNT files)${NC}"
}

# Restore buckets
if [ -n "$BUCKET_NAME" ]; then
  # Restore specific bucket
  restore_bucket "$BUCKET_NAME" "$TEMP_DIR"
else
  # Restore all buckets
  echo "$BUCKETS" | while read -r BUCKET; do
    restore_bucket "$BUCKET" "$TEMP_DIR"
  done
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Storage restore complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit 0

