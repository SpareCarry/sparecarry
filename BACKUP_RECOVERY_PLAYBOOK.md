# Backup & Recovery Playbook

**Date**: November 20, 2025  
**Status**: ✅ **BACKUP & RECOVERY SYSTEM COMPLETE**

---

## Overview

This playbook describes the backup and recovery procedures for SpareCarry. It covers database backups, storage backups, restoration procedures, and disaster recovery scenarios.

---

## 1. Backup System Architecture

### Components

- **Database Backups**: PostgreSQL dumps (Supabase)
- **Storage Backups**: Supabase storage buckets (avatars, item-images, documents)
- **Automation**: GitHub Actions nightly backups
- **Retention**: Configurable (default: 30 days)
- **Verification**: Automated integrity checks
- **Encryption**: Optional GPG encryption

### Backup Locations

- **Local**: `./backups/db/` and `./backups/storage/`
- **S3**: Configured S3 bucket (if enabled)
- **GitHub Artifacts**: Last 7 days (for quick access)

---

## 2. Backup Procedures

### Manual Database Backup

```bash
# Set environment variables
export PGHOST=your-db-host
export PGUSER=your-db-user
export PGPASSWORD=your-db-password
export PGDATABASE=your-db-name

# Run backup
./scripts/backup/backup_db.sh
```

**Or using Supabase connection string:**

```bash
export SUPABASE_DB_URL="postgresql://user:password@host:port/database"
./scripts/backup/backup_db.sh
```

### Manual Storage Backup

```bash
# Set environment variables
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-key
export BUCKETS_TO_BACKUP=avatars,item-images,documents

# Run backup
./scripts/backup/backup_storage.sh
```

### Automated Backups

**GitHub Actions:**

- Runs daily at 2 AM UTC
- Can be triggered manually via workflow dispatch
- Uploads to S3 (if configured)
- Creates GitHub artifacts

**Cron (Local):**

```bash
# Add to crontab
0 2 * * * /path/to/scripts/backup/backup_db.sh
0 3 * * * /path/to/scripts/backup/backup_storage.sh
0 4 * * * /path/to/scripts/backup/rotate_backups.sh
```

---

## 3. Recovery Procedures

### Database Restore

#### Prerequisites

1. **Backup file available**

   ```bash
   ./scripts/backup/restore_db.sh --list
   ```

2. **Database connection configured**
   ```bash
   export PGHOST=your-db-host
   export PGUSER=your-db-user
   export PGPASSWORD=your-db-password
   export PGDATABASE=your-db-name
   ```

#### Full Database Restore

```bash
# List available backups
./scripts/backup/restore_db.sh --list

# Restore specific backup
./scripts/backup/restore_db.sh --file 2025-11-20-020000.sql.gz

# Restore to different database
./scripts/backup/restore_db.sh --file backup.sql.gz --target restore_db
```

**⚠️ WARNING**: This will **OVERWRITE** the target database. Always confirm before proceeding.

#### Partial Restore (Specific Tables)

```bash
# Extract and restore specific tables
gunzip -c backup.sql.gz | \
  psql -d target_db -t -c "SELECT 'DROP TABLE IF EXISTS ' || tablename || ' CASCADE;' FROM pg_tables WHERE schemaname = 'public';" | \
  psql -d target_db

# Restore specific table
pg_restore -d target_db -t table_name backup.sql
```

### Storage Restore

#### Prerequisites

1. **Backup archive available**

   ```bash
   ./scripts/backup/restore_storage.sh --list
   ```

2. **Supabase service key configured**
   ```bash
   export SUPABASE_URL=https://your-project.supabase.co
   export SUPABASE_SERVICE_KEY=your-service-key
   ```

#### Full Storage Restore

```bash
# List available backups
./scripts/backup/restore_storage.sh --list

# Restore all buckets
./scripts/backup/restore_storage.sh --file 2025-11-20-020000.tar.gz

# Restore specific bucket
./scripts/backup/restore_storage.sh --file backup.tar.gz --bucket avatars
```

**⚠️ WARNING**: This will **OVERWRITE** existing files in storage buckets.

#### Partial Restore (Specific Files)

```bash
# Extract archive
tar -xzf backup.tar.gz -C /tmp/restore

# Upload specific files manually
curl -X POST \
  "https://your-project.supabase.co/storage/v1/object/bucket-name/file-path" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  --data-binary "@/tmp/restore/path/to/file"
```

---

## 4. Disaster Recovery Scenarios

### Scenario 1: Database Corruption

**Symptoms:**

- Database queries failing
- Data inconsistencies
- Application errors

**Recovery Steps:**

1. **Immediate Actions:**

   ```bash
   # Stop application (if possible)
   # Verify backup availability
   ./scripts/backup/verify_backup.sh --db
   ```

2. **Restore from Latest Backup:**

   ```bash
   # Find latest backup
   LATEST_BACKUP=$(ls -t backups/db/*.sql.gz | head -1)

   # Restore
   ./scripts/backup/restore_db.sh --file "$LATEST_BACKUP"
   ```

3. **Verify Restore:**

   ```bash
   # Test database connection
   psql -d restored_db -c "SELECT COUNT(*) FROM users;"

   # Run application tests
   ```

4. **Post-Restore:**
   - Verify data integrity
   - Check application functionality
   - Monitor for issues
   - Document incident

**RTO (Recovery Time Objective)**: 1-2 hours  
**RPO (Recovery Point Objective)**: Up to 24 hours (last nightly backup)

### Scenario 2: Storage Data Loss

**Symptoms:**

- Missing files in storage buckets
- Broken image links
- User upload failures

**Recovery Steps:**

1. **Immediate Actions:**

   ```bash
   # Verify backup availability
   ./scripts/backup/verify_backup.sh --storage
   ```

2. **Restore from Latest Backup:**

   ```bash
   # Find latest backup
   LATEST_BACKUP=$(ls -t backups/storage/*.tar.gz | head -1)

   # Restore
   ./scripts/backup/restore_storage.sh --file "$LATEST_BACKUP"
   ```

3. **Verify Restore:**
   ```bash
   # Check bucket contents
   curl -X GET \
     "https://your-project.supabase.co/storage/v1/bucket/bucket-name/list" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
   ```

**RTO**: 2-4 hours  
**RPO**: Up to 24 hours

### Scenario 3: Complete System Failure

**Symptoms:**

- Database unreachable
- Storage unreachable
- Application completely down

**Recovery Steps:**

1. **Assess Situation:**
   - Determine scope of failure
   - Check backup availability
   - Verify credentials

2. **Restore Database:**

   ```bash
   # Restore from S3 or local backup
   ./scripts/backup/restore_db.sh --file latest-backup.sql.gz
   ```

3. **Restore Storage:**

   ```bash
   # Restore from S3 or local backup
   ./scripts/backup/restore_storage.sh --file latest-backup.tar.gz
   ```

4. **Verify System:**
   - Test database connectivity
   - Test storage access
   - Run application health checks
   - Monitor for 24 hours

**RTO**: 4-8 hours  
**RPO**: Up to 24 hours

### Scenario 4: Accidental Data Deletion

**Symptoms:**

- Specific data missing
- User reports missing content
- Audit logs show deletion

**Recovery Steps:**

1. **Identify Affected Data:**
   - Check audit logs
   - Determine deletion time
   - Find appropriate backup

2. **Selective Restore:**

   ```bash
   # Restore to temporary database
   ./scripts/backup/restore_db.sh --file backup-before-deletion.sql.gz --target temp_restore

   # Extract specific data
   psql -d temp_restore -c "SELECT * FROM table WHERE condition;" > recovered_data.sql

   # Import to production
   psql -d production_db < recovered_data.sql
   ```

**RTO**: 2-4 hours  
**RPO**: Up to 24 hours

---

## 5. Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

### Current RTO/RPO

| Component       | RTO       | RPO      |
| --------------- | --------- | -------- |
| Database        | 1-2 hours | 24 hours |
| Storage         | 2-4 hours | 24 hours |
| Complete System | 4-8 hours | 24 hours |

### Improvement Recommendations

1. **Reduce RPO:**
   - Increase backup frequency (every 6 hours)
   - Implement continuous backup for critical data
   - Use database replication

2. **Reduce RTO:**
   - Pre-configure restore environments
   - Automate restore procedures
   - Maintain hot standby systems

---

## 6. Backup Verification

### Automated Verification

```bash
# Verify all backups
./scripts/backup/verify_backup.sh --type all

# Verify database backups only
./scripts/backup/verify_backup.sh --db

# Verify storage backups only
./scripts/backup/verify_backup.sh --storage

# Verify specific backup
./scripts/backup/verify_backup.sh --file backup.sql.gz
```

### Manual Verification

**Database Backup:**

```bash
# Test restore to temporary database
./scripts/backup/restore_db.sh --file backup.sql.gz --target test_restore

# Verify data
psql -d test_restore -c "SELECT COUNT(*) FROM users;"

# Cleanup
dropdb test_restore
```

**Storage Backup:**

```bash
# Extract and verify
tar -xzf backup.tar.gz -C /tmp/test
ls -lh /tmp/test/

# Check manifest
cat /tmp/test/*/manifest.json | jq .
```

---

## 7. Backup Rotation

### Automatic Rotation

```bash
# Rotate backups older than 30 days
./scripts/backup/rotate_backups.sh --days 30

# Rotate database backups only
./scripts/backup/rotate_backups.sh --db --days 30

# Rotate storage backups only
./scripts/backup/rotate_backups.sh --storage --days 30

# Dry run (see what would be deleted)
./scripts/backup/rotate_backups.sh --days 30 --dry-run
```

### Retention Policy

- **Default**: 30 days
- **Production**: 90 days (recommended)
- **Compliance**: As required by regulations

---

## 8. Security Considerations

### Encryption

**Enable GPG Encryption:**

```bash
export ENCRYPT=true
export GPG_RECIPIENT=your-email@example.com
./scripts/backup/backup_db.sh
```

**Decrypt for Restore:**

```bash
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
./scripts/backup/restore_db.sh --file backup.sql.gz
```

### Access Control

- **Backup Credentials**: Minimal privileges (read-only for backups)
- **Restore Credentials**: Full privileges (only when restoring)
- **S3 Access**: IAM roles with least privilege
- **GPG Keys**: Securely stored, never committed

### Backup Storage Security

- **S3**: Server-side encryption enabled
- **Local**: Encrypted filesystem (if possible)
- **GitHub Artifacts**: Temporary (7 days), encrypted at rest

---

## 9. Monitoring and Alerts

### Backup Monitoring

**Check Backup Status:**

```bash
# List recent backups
ls -lht backups/db/ | head -10
ls -lht backups/storage/ | head -10

# Check backup age
find backups/db -name "*.sql.gz" -mtime +1
```

**GitHub Actions:**

- Monitor workflow runs
- Set up notifications for failures
- Review backup summaries

### Alerting

**Recommended Alerts:**

1. Backup failure (GitHub Actions)
2. Backup age > 25 hours
3. Backup size anomalies
4. Verification failures

---

## 10. Testing and Validation

### Regular Testing Schedule

- **Weekly**: Verify latest backup integrity
- **Monthly**: Test restore to staging environment
- **Quarterly**: Full disaster recovery drill

### Test Restore Procedure

```bash
# 1. Create test environment
createdb test_restore_env

# 2. Restore latest backup
./scripts/backup/restore_db.sh --file latest.sql.gz --target test_restore_env

# 3. Verify data
psql -d test_restore_env -c "SELECT COUNT(*) FROM users;"
psql -d test_restore_env -c "SELECT COUNT(*) FROM trips;"

# 4. Test application against restored database
# (Update connection string temporarily)

# 5. Cleanup
dropdb test_restore_env
```

---

## 11. Escalation and Contacts

### Escalation Path

1. **Level 1**: DevOps Engineer
   - Initial assessment
   - Basic restore attempts

2. **Level 2**: Senior Engineer / Tech Lead
   - Complex restore scenarios
   - Data recovery decisions

3. **Level 3**: CTO / Engineering Manager
   - Major incidents
   - Business impact decisions

### Emergency Contacts

- **On-Call Engineer**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Infrastructure Team**: [Contact Info]

---

## 12. Post-Incident Procedures

### After Successful Recovery

1. **Document Incident:**
   - Root cause analysis
   - Recovery steps taken
   - Timeline of events

2. **Verify System Health:**
   - Run full test suite
   - Monitor for 24-48 hours
   - Check application logs

3. **Update Procedures:**
   - Improve backup/restore scripts if needed
   - Update documentation
   - Train team on lessons learned

---

## 13. Troubleshooting

### Common Issues

**Backup Fails:**

```bash
# Check database connection
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT 1;"

# Check disk space
df -h backups/

# Check permissions
ls -la backups/
```

**Restore Fails:**

```bash
# Verify backup integrity
./scripts/backup/verify_backup.sh --file backup.sql.gz

# Check database connection
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "SELECT 1;"

# Check disk space
df -h
```

**Storage Backup Slow:**

- Reduce bucket size
- Backup buckets separately
- Use rclone for better performance

---

## 14. Summary

✅ **Backup & Recovery System Complete**

- Automated nightly backups
- Database and storage backups
- Verification and rotation
- Comprehensive recovery procedures
- Disaster recovery playbook

**Status**: Production-ready backup and recovery system.

---

**Last Updated**: November 20, 2025
