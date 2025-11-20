#!/bin/bash
# Storage Backup Script
# Backs up Supabase storage buckets to S3 or backup bucket

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/storage}"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M%S")
BACKUP_PREFIX="${BACKUP_DIR}/${TIMESTAMP}"

# Supabase configuration
SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL}}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-${SUPABASE_SERVICE_ROLE_KEY}}"
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-}"

# S3/Backup configuration
BACKUP_BUCKET="${BACKUP_BUCKET:-}"
BACKUP_S3_REGION="${BACKUP_S3_REGION:-us-east-1}"
BACKUP_S3_ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:-}"
BACKUP_S3_SECRET_KEY="${BACKUP_S3_SECRET_KEY:-}"
BACKUP_S3_ENDPOINT="${BACKUP_S3_ENDPOINT:-}"

# Buckets to backup (comma-separated)
BUCKETS_TO_BACKUP="${BUCKETS_TO_BACKUP:-avatars,item-images,documents}"

# Use rclone if available, otherwise use Supabase API
USE_RCLONE="${USE_RCLONE:-false}"

echo -e "${GREEN}📦 Starting storage backup...${NC}"

# Validate required variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}❌ Error: Supabase configuration not set${NC}"
  echo "Set SUPABASE_URL and SUPABASE_SERVICE_KEY"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup bucket using Supabase API
backup_bucket_api() {
  local BUCKET_NAME="$1"
  local BACKUP_PATH="$2"
  
  echo -e "${YELLOW}📤 Backing up bucket: $BUCKET_NAME${NC}"
  
  # Create bucket backup directory
  mkdir -p "$BACKUP_PATH"
  
  # List all files in bucket
  FILES_JSON=$(curl -s -X POST \
    "${SUPABASE_URL}/storage/v1/bucket/${BUCKET_NAME}/list" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"limit": 1000, "offset": 0}' || echo "[]")
  
  # Check if we got valid JSON
  if ! echo "$FILES_JSON" | jq empty 2>/dev/null; then
    echo -e "${RED}❌ Error: Failed to list files in bucket $BUCKET_NAME${NC}"
    return 1
  fi
  
  # Download each file
  FILE_COUNT=0
  echo "$FILES_JSON" | jq -r '.[] | .name' | while read -r FILE_NAME; do
    if [ -n "$FILE_NAME" ]; then
      FILE_COUNT=$((FILE_COUNT + 1))
      FILE_PATH="${BACKUP_PATH}/${FILE_NAME}"
      FILE_DIR=$(dirname "$FILE_PATH")
      mkdir -p "$FILE_DIR"
      
      # Download file
      curl -s -X GET \
        "${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${FILE_NAME}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -o "$FILE_PATH" || {
        echo -e "${RED}⚠️  Failed to download: $FILE_NAME${NC}"
        continue
      }
      
      if [ $((FILE_COUNT % 10)) -eq 0 ]; then
        echo -e "${YELLOW}  Downloaded $FILE_COUNT files...${NC}"
      fi
    fi
  done
  
  echo -e "${GREEN}✅ Bucket $BUCKET_NAME backed up ($FILE_COUNT files)${NC}"
}

# Function to backup bucket using rclone
backup_bucket_rclone() {
  local BUCKET_NAME="$1"
  local BACKUP_PATH="$2"
  
  echo -e "${YELLOW}📤 Backing up bucket: $BUCKET_NAME using rclone${NC}"
  
  # Configure rclone remote if needed
  if ! rclone listremotes | grep -q "supabase:"; then
    echo -e "${YELLOW}📝 Configuring rclone Supabase remote...${NC}"
    # Note: This requires manual configuration or environment variables
    # rclone config create supabase s3 ...
  fi
  
  # Sync bucket to local
  rclone sync "supabase:${BUCKET_NAME}" "$BACKUP_PATH" \
    --progress \
    --stats-one-line || {
    echo -e "${RED}❌ Error: rclone sync failed for $BUCKET_NAME${NC}"
    return 1
  }
  
  echo -e "${GREEN}✅ Bucket $BUCKET_NAME backed up${NC}"
}

# Backup each bucket
IFS=',' read -ra BUCKET_ARRAY <<< "$BUCKETS_TO_BACKUP"
BACKUP_MANIFEST="${BACKUP_PREFIX}/manifest.json"
MANIFEST_ENTRIES="[]"

for BUCKET in "${BUCKET_ARRAY[@]}"; do
  BUCKET=$(echo "$BUCKET" | xargs) # Trim whitespace
  if [ -z "$BUCKET" ]; then
    continue
  fi
  
  BUCKET_BACKUP_PATH="${BACKUP_PREFIX}/${BUCKET}"
  
  if [ "$USE_RCLONE" = "true" ] && command -v rclone &> /dev/null; then
    backup_bucket_rclone "$BUCKET" "$BUCKET_BACKUP_PATH"
  else
    backup_bucket_api "$BUCKET" "$BUCKET_BACKUP_PATH"
  fi
  
  # Count files
  FILE_COUNT=$(find "$BUCKET_BACKUP_PATH" -type f 2>/dev/null | wc -l)
  TOTAL_SIZE=$(du -sh "$BUCKET_BACKUP_PATH" 2>/dev/null | cut -f1)
  
  # Add to manifest
  MANIFEST_ENTRIES=$(echo "$MANIFEST_ENTRIES" | jq --arg bucket "$BUCKET" \
    --arg path "$BUCKET_BACKUP_PATH" \
    --arg count "$FILE_COUNT" \
    --arg size "$TOTAL_SIZE" \
    '. += [{"bucket": $bucket, "path": $path, "file_count": $count, "size": $size}]')
done

# Save manifest
echo "$MANIFEST_ENTRIES" | jq . > "$BACKUP_MANIFEST"
echo -e "${GREEN}✅ Manifest saved: $BACKUP_MANIFEST${NC}"

# Create archive
echo -e "${YELLOW}📦 Creating archive...${NC}"
ARCHIVE_FILE="${BACKUP_PREFIX}.tar.gz"
tar -czf "$ARCHIVE_FILE" -C "$BACKUP_DIR" "$(basename "$BACKUP_PREFIX")" || {
  echo -e "${RED}❌ Error: Failed to create archive${NC}"
  exit 1
}

ARCHIVE_SIZE=$(du -h "$ARCHIVE_FILE" | cut -f1)
echo -e "${GREEN}✅ Archive created: $ARCHIVE_FILE (${ARCHIVE_SIZE})${NC}"

# Calculate checksum
CHECKSUM=$(sha256sum "$ARCHIVE_FILE" | cut -d' ' -f1)
echo "$CHECKSUM" > "${ARCHIVE_FILE}.sha256"
echo -e "${GREEN}✅ Checksum saved: ${ARCHIVE_FILE}.sha256${NC}"

# Upload to S3 if configured
if [ -n "$BACKUP_BUCKET" ]; then
  echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
  
  if command -v aws &> /dev/null; then
    # Use AWS CLI
    aws s3 cp "$ARCHIVE_FILE" "s3://${BACKUP_BUCKET}/storage/${TIMESTAMP}.tar.gz" \
      --region "$BACKUP_S3_REGION" \
      ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"} || {
      echo -e "${RED}❌ Error: Failed to upload to S3${NC}"
      exit 1
    }
    
    # Upload checksum
    aws s3 cp "${ARCHIVE_FILE}.sha256" "s3://${BACKUP_BUCKET}/storage/${TIMESTAMP}.tar.gz.sha256" \
      --region "$BACKUP_S3_REGION" \
      ${BACKUP_S3_ENDPOINT:+--endpoint-url "$BACKUP_S3_ENDPOINT"}
    
    echo -e "${GREEN}✅ Uploaded to S3: s3://${BACKUP_BUCKET}/storage/${TIMESTAMP}.tar.gz${NC}"
  elif command -v rclone &> /dev/null; then
    # Use rclone
    rclone copy "$ARCHIVE_FILE" "s3:${BACKUP_BUCKET}/storage/" \
      --s3-region "$BACKUP_S3_REGION" \
      ${BACKUP_S3_ACCESS_KEY:+--s3-access-key-id "$BACKUP_S3_ACCESS_KEY"} \
      ${BACKUP_S3_SECRET_KEY:+--s3-secret-access-key "$BACKUP_S3_SECRET_KEY"} \
      ${BACKUP_S3_ENDPOINT:+--s3-endpoint "$BACKUP_S3_ENDPOINT"} || {
      echo -e "${RED}❌ Error: Failed to upload to S3${NC}"
      exit 1
    }
    echo -e "${GREEN}✅ Uploaded to S3 via rclone${NC}"
  else
    echo -e "${YELLOW}⚠️  AWS CLI or rclone not found. Skipping S3 upload.${NC}"
  fi
fi

# Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Storage backup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Archive: ${GREEN}$ARCHIVE_FILE${NC}"
echo -e "Size: ${GREEN}$ARCHIVE_SIZE${NC}"
echo -e "Checksum: ${GREEN}$CHECKSUM${NC}"
echo -e "Timestamp: ${GREEN}$TIMESTAMP${NC}"
echo ""

exit 0

