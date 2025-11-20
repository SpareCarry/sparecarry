# Error Logging & Sentry Integration Guide

**Date**: November 20, 2025  
**Status**: ✅ **ENHANCED ERROR LOGGING SYSTEM COMPLETE**

---

## Overview

This guide explains how to enable and configure Sentry for error logging in SpareCarry, with step-by-step instructions for production deployment with minimal risk.

---

## 1. Prerequisites

### Requirements

- Sentry account (free tier available)
- SpareCarry application deployed
- Access to environment variables

### Sentry Account Setup

1. **Sign up**: https://sentry.io/signup/
2. **Create organization** (if needed)
3. **Create project**:
   - Platform: Next.js
   - Name: SpareCarry

---

## 2. Initial Setup (Development/Staging)

### Step 1: Install Sentry SDK

Sentry is already integrated via `@sentry/nextjs`. If not installed:

```bash
pnpm add @sentry/nextjs
```

### Step 2: Get Sentry DSN

1. Go to Sentry project settings
2. Navigate to "Client Keys (DSN)"
3. Copy the DSN (format: `https://<key>@<host>/<project-id>`)

### Step 3: Configure Environment Variables

**Development (.env.local):**
```env
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
NODE_ENV=development
```

**Staging:**
```env
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
NODE_ENV=production
VERCEL_ENV=preview
```

### Step 4: Test Integration

**Run health check:**
```bash
export NEXT_PUBLIC_SENTRY_DSN=your-dsn
node scripts/sentry-healthcheck.js
```

**Expected output:**
```
🔍 Sentry Health Check

✓ Sentry DSN format is valid
  Mode: DRY-RUN

✓ Dry-run mode: Validating Sentry DSN format...
  Host: sentry.io
  Project ID: your-project-id
  Protocol: https
✓ Sentry host is reachable (200)

✅ Sentry DSN is valid and host is reachable
```

**Test error endpoint (staging only):**
```bash
curl https://staging.sparecarry.com/api/health/error-test?type=sentry
```

Check Sentry dashboard to verify error was captured.

---

## 3. Production Deployment (Step-by-Step)

### Phase 1: Preparation (Week 1)

#### 1.1 Create Production Project

1. Create a separate Sentry project for production
2. Copy production DSN
3. **Do not enable yet**

#### 1.2 Configure Sampling

Set up sampling to control volume:

```env
# Sample 10% of errors in production
LOG_SAMPLING_RATE=0.1
```

#### 1.3 Set Up Alerts

1. Go to Sentry → Alerts
2. Create alert rules:
   - Error rate spike (> 10 errors/minute)
   - Critical errors (level: error)
   - New issues

#### 1.4 Test in Staging

Run full test suite in staging:

```bash
# Health check
node scripts/sentry-healthcheck.js

# Error test endpoint
curl https://staging.sparecarry.com/api/health/error-test?type=generic
curl https://staging.sparecarry.com/api/health/error-test?type=sentry

# Verify in Sentry dashboard
```

### Phase 2: Soft Launch (Week 2)

#### 2.1 Enable for 10% of Users

Use feature flags or environment variables:

```env
# Enable for subset of users
NEXT_PUBLIC_SENTRY_ENABLED=true
SENTRY_SAMPLE_RATE=0.1  # 10% of users
```

#### 2.2 Monitor for 48 Hours

- Check Sentry dashboard daily
- Verify error capture
- Check for false positives
- Monitor performance impact

#### 2.3 Adjust Sampling

Based on volume:

```env
# If too many errors, reduce sampling
LOG_SAMPLING_RATE=0.05  # 5%

# If too few, increase sampling
LOG_SAMPLING_RATE=0.2   # 20%
```

### Phase 3: Full Rollout (Week 3)

#### 3.1 Enable for All Users

```env
NEXT_PUBLIC_SENTRY_DSN=your-production-dsn
LOG_SAMPLING_RATE=0.1
```

#### 3.2 Monitor Closely

- First 24 hours: Check every 4 hours
- First week: Check daily
- Ongoing: Weekly reviews

#### 3.3 Set Up Dashboards

Create Sentry dashboards for:
- Error trends
- Top errors
- Performance metrics
- User impact

---

## 4. Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id

# Optional
LOG_SAMPLING_RATE=0.1              # Sample rate (0.0-1.0)
SENTRY_ENVIRONMENT=production       # Environment name
SENTRY_TRACES_SAMPLE_RATE=0.1      # Performance tracing sample rate
SENTRY_DEBUG=false                 # Enable debug logging
```

### Sampling Configuration

**Error Logs:**
- Always sent (not sampled)
- Critical for debugging

**Info/Warning Logs:**
- Sampled in production
- Default: 10% (configurable via `LOG_SAMPLING_RATE`)

**Performance Traces:**
- Sampled separately
- Default: 10% (configurable via `SENTRY_TRACES_SAMPLE_RATE`)

---

## 5. PII Redaction

### Automatic Redaction

The logger automatically redacts:

- **Passwords**: `password`, `token`, `secret`, `key`, etc.
- **Email addresses**: `user@example.com` → `us***@example.com`
- **Credit card numbers**: Detected via Luhn algorithm
- **Phone numbers**: `***-***-1234`
- **SSN**: Fully redacted
- **API keys**: All variations

### Manual Redaction

```typescript
import { logger } from '@/lib/logger';

// Context is automatically sanitized
logger.error('Payment failed', error, {
  userId: '123',           // ✅ Safe
  email: 'user@example.com', // ✅ Auto-redacted
  cardNumber: '4111111111111111', // ✅ Auto-redacted
  amount: 100,            // ✅ Safe
});
```

### Redaction Rules

**Sensitive Keys:**
- `password`, `token`, `jwt`, `secret`, `key`
- `authorization`, `cookie`, `session`
- `access_token`, `refresh_token`, `api_key`

**Pattern-Based:**
- Email: `email`, `user_email`, `contact_email`
- Phone: `phone`, `phone_number`, `mobile`
- SSN: `ssn`, `social_security_number`

---

## 6. Health Checks

### Automated Health Check

**CI Integration:**
- Runs automatically in CI
- Validates Sentry DSN format
- Tests connectivity
- Fails build if Sentry misconfigured

**Manual Check:**
```bash
node scripts/sentry-healthcheck.js
```

### Error Test Endpoint

**Staging Only:**
```bash
# Test generic error
curl https://staging.sparecarry.com/api/health/error-test?type=generic

# Test Sentry capture
curl https://staging.sparecarry.com/api/health/error-test?type=sentry

# Test database error
curl https://staging.sparecarry.com/api/health/error-test?type=database

# Test validation error
curl https://staging.sparecarry.com/api/health/error-test?type=validation
```

**Verify in Sentry:**
1. Go to Sentry dashboard
2. Check "Issues" tab
3. Look for test errors
4. Verify error details are captured

---

## 7. Monitoring and Alerts

### Sentry Alerts

**Recommended Alerts:**

1. **Error Rate Spike**
   - Condition: > 10 errors/minute
   - Action: Email/Slack notification

2. **Critical Errors**
   - Condition: Error level = "error"
   - Action: Immediate notification

3. **New Issues**
   - Condition: New error type
   - Action: Daily digest

4. **Performance Degradation**
   - Condition: p95 > 1s
   - Action: Weekly report

### Dashboard Setup

**Key Metrics:**
- Error rate over time
- Top errors by count
- Affected users
- Performance impact

**Create Dashboard:**
1. Go to Sentry → Dashboards
2. Add widgets:
   - Error count
   - Error rate
   - Top errors
   - Performance metrics

---

## 8. Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
logger.error('Payment failed', error, { userId });
logger.warn('Rate limit approaching', null, { remaining: 5 });
logger.info('User logged in', null, { userId });

// ❌ Bad
logger.error('User logged in', null, { userId }); // Use info
logger.info('Payment failed', error); // Use error
```

### 2. Provide Context

```typescript
// ✅ Good
logger.error('Payment failed', error, {
  userId: user.id,
  amount: 100,
  paymentMethod: 'card',
  transactionId: transaction.id,
});

// ❌ Bad
logger.error('Payment failed', error); // No context
```

### 3. Don't Log Sensitive Data

```typescript
// ❌ Bad
logger.error('Login failed', error, {
  password: userPassword, // Never!
  creditCard: cardNumber, // Never!
});

// ✅ Good
logger.error('Login failed', error, {
  email: userEmail, // ✅ Auto-redacted
  userId: user.id,  // ✅ Safe
});
```

### 4. Use Sampling in Production

```env
# Sample 10% of non-error logs
LOG_SAMPLING_RATE=0.1
```

### 5. Monitor Error Volume

- Check Sentry dashboard weekly
- Adjust sampling if needed
- Remove noisy errors

---

## 9. Troubleshooting

### Sentry Not Capturing Errors

**Check:**
1. DSN is set correctly
2. Sentry is initialized
3. Errors are being logged
4. Network connectivity

**Debug:**
```bash
# Health check
node scripts/sentry-healthcheck.js

# Test endpoint
curl https://staging.sparecarry.com/api/health/error-test?type=sentry

# Check Sentry dashboard
```

### Too Many Errors

**Solutions:**
1. Reduce sampling rate
2. Filter out noisy errors
3. Adjust alert thresholds
4. Fix root causes

### Performance Impact

**Monitor:**
- Response times
- Error capture latency
- Sentry quota usage

**Optimize:**
- Reduce sampling
- Filter low-priority errors
- Use async error capture

---

## 10. Security Considerations

### DSN Security

- **Client DSN**: Safe to expose (public key only)
- **Server DSN**: Keep secret (full access)
- **Never commit DSNs** to version control

### PII Protection

- Automatic redaction enabled
- Manual review of logged data
- Regular audits of error logs

### Access Control

- Limit Sentry access to team members
- Use role-based permissions
- Enable 2FA for Sentry accounts

---

## 11. Rollback Plan

### If Issues Occur

1. **Disable Sentry:**
   ```env
   # Remove or comment out
   # NEXT_PUBLIC_SENTRY_DSN=...
   ```

2. **Redeploy:**
   - Remove DSN from environment
   - Redeploy application
   - Verify errors stop being sent

3. **Investigate:**
   - Check Sentry dashboard
   - Review error logs
   - Fix issues

4. **Re-enable:**
   - After fixes
   - Gradual rollout
   - Monitor closely

---

## 12. Summary

✅ **Enhanced Error Logging System Complete**

- PII redaction (email, credit cards, tokens)
- Sampling configuration
- Sentry health checks
- CI integration
- Error test endpoint
- Comprehensive documentation

**Status**: Production-ready error logging with Sentry.

---

**Last Updated**: November 20, 2025

