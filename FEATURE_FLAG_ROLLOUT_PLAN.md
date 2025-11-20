# Feature Flag Rollout Plan

This document describes the feature flag system and rollout strategy for SpareCarry.

## Overview

SpareCarry uses Unleash for feature flag management, allowing gradual rollouts and safe feature releases.

## Feature Flags

### Current Flags

1. **`enable_push_notifications`**
   - Default: `false`
   - Purpose: Enable push notifications system
   - Rollout: Staging → 10% → 50% → 100%

2. **`email_notifications`**
   - Default: `false`
   - Purpose: Enable email notifications
   - Rollout: Staging → 25% → 100%

3. **`dispute_refund_flow`**
   - Default: `false`
   - Purpose: Enable dispute and refund flow
   - Rollout: Staging → 5% → 25% → 100%

4. **`emergency_toggle_push`**
   - Default: `false`
   - Purpose: Emergency toggle for push notifications
   - Rollout: Admin only

### Beta Flags

5. **`notifications_v1`**
   - Default: `false`
   - Purpose: New notifications system
   - Rollout: Staging → Internal testing → 10% → 50% → 100%

6. **`new_match_flow`**
   - Default: `false`
   - Purpose: New match creation flow
   - Rollout: Staging → Internal testing → 25% → 100%

7. **`payment_ux_improvements`**
   - Default: `false`
   - Purpose: Payment UX improvements
   - Rollout: Staging → Internal testing → 50% → 100%

## Rollout Strategy

### Phase 1: Staging

1. Enable flag in staging environment
2. Test thoroughly
3. Monitor Sentry for errors
4. Collect feedback from internal testers

### Phase 2: Internal Testing

1. Enable flag for internal testers (TestFlight/Play Store)
2. Monitor metrics
3. Collect feedback
4. Fix issues

### Phase 3: Gradual Rollout

1. **10% Rollout**
   - Enable for 10% of users
   - Monitor error rates
   - Check performance metrics
   - Wait 24-48 hours

2. **25% Rollout**
   - Increase to 25% if no issues
   - Continue monitoring
   - Wait 24-48 hours

3. **50% Rollout**
   - Increase to 50% if stable
   - Monitor closely
   - Wait 24-48 hours

4. **100% Rollout**
   - Enable for all users
   - Monitor for 1 week
   - Remove flag if stable

## Usage

### Check Flag

```typescript
import { useFlag } from '@/app/providers/FeatureFlagProvider';

function MyComponent() {
  const enablePushNotifications = useFlag('enable_push_notifications', false);

  if (enablePushNotifications) {
    // New feature code
  } else {
    // Fallback code
  }
}
```

### Get Flag with Variant

```typescript
import { useFeatureFlag } from '@/app/providers/FeatureFlagProvider';

function MyComponent() {
  const flag = useFeatureFlag('payment_ux_improvements');

  if (flag?.enabled) {
    const variant = flag.variant; // 'control', 'variant-a', etc.
    // Use variant
  }
}
```

## Configuration

### Unleash Setup

1. Deploy Unleash server or use Unleash Cloud
2. Create staging and production environments
3. Configure API keys
4. Set environment variables:
   ```bash
   NEXT_PUBLIC_UNLEASH_URL=https://...
   NEXT_PUBLIC_UNLEASH_CLIENT_KEY=...
   ```

### Flag Configuration

1. Create flag in Unleash
2. Set default value (usually `false`)
3. Configure rollout strategy
4. Set up targeting rules (if needed)

## Monitoring

### Metrics to Monitor

1. **Error Rates**
   - Monitor Sentry for errors
   - Alert if error rate increases

2. **Performance**
   - Monitor API latency
   - Check page load times
   - Track mobile performance

3. **User Behavior**
   - Track feature usage
   - Monitor conversion rates
   - Check user feedback

### Alert Rules

Set up alerts for:
- Error rate > 1%
- API latency > 1s
- Feature usage drops > 20%

## Rollback Plan

### Immediate Rollback

1. Disable flag in Unleash
2. Monitor error rates
3. Check user feedback
4. Investigate root cause

### Gradual Rollback

1. Reduce rollout percentage
2. Monitor metrics
3. Fix issues
4. Resume rollout when stable

## Best Practices

1. **Always Have Fallback**
   - Default to safe behavior
   - Never break core functionality
   - Test fallback path

2. **Monitor Closely**
   - Watch metrics during rollout
   - Set up alerts
   - Review feedback regularly

3. **Gradual Rollout**
   - Start small (10%)
   - Increase gradually
   - Wait between phases

4. **Document Changes**
   - Document flag purpose
   - Note rollout dates
   - Track issues and fixes

5. **Clean Up**
   - Remove flags after 100% rollout
   - Clean up unused code
   - Update documentation

## Flag Lifecycle

1. **Created** - Flag created in Unleash
2. **Staging** - Enabled in staging
3. **Internal Testing** - Enabled for testers
4. **10% Rollout** - Enabled for 10% of users
5. **25% Rollout** - Enabled for 25% of users
6. **50% Rollout** - Enabled for 50% of users
7. **100% Rollout** - Enabled for all users
8. **Removed** - Flag removed, code cleaned up

## Example Rollout

### Notifications v1

**Week 1: Staging**
- Enable in staging
- Test all notification types
- Fix bugs

**Week 2: Internal Testing**
- Enable for TestFlight/Play Store testers
- Collect feedback
- Monitor metrics

**Week 3: 10% Rollout**
- Enable for 10% of users
- Monitor error rates
- Check performance

**Week 4: 25% Rollout**
- Increase to 25%
- Continue monitoring
- Fix any issues

**Week 5: 50% Rollout**
- Increase to 50%
- Monitor closely
- Collect feedback

**Week 6: 100% Rollout**
- Enable for all users
- Monitor for 1 week
- Remove flag if stable

## Next Steps

- [ ] Set up Unleash server
- [ ] Configure flags
- [ ] Create rollout schedule
- [ ] Set up monitoring
- [ ] Document flag usage

