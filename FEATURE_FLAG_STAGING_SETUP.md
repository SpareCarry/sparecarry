# Feature Flag Staging Setup

Guide for setting up `FF_STAGING_ONLY` feature flag and gradual rollout.

## Overview

The `FF_STAGING_ONLY` flag allows features to be enabled only in staging environment, making it safe to test new features before production release.

## Setup in Unleash

### 1. Create Flag

1. Log in to Unleash dashboard
2. Go to "Feature flags"
3. Click "Create feature flag"
4. Configure:
   - **Name**: `FF_STAGING_ONLY`
   - **Description**: "Enable features only in staging environment"
   - **Type**: Release toggle
   - **Default**: `false` (off by default)

### 2. Configure Environments

#### Staging Environment

- **Default**: `true` (enabled)
- **Strategy**: Default (100% enabled)

#### Production Environment

- **Default**: `false` (disabled)
- **Strategy**: Default (0% enabled)

### 3. Add Variants (Optional)

If you need multiple variants:

- `control` - Feature disabled
- `variant-a` - Feature enabled with variant A
- `variant-b` - Feature enabled with variant B

## Usage in Code

### Basic Usage

```typescript
import { useFlag } from '@/app/providers/FeatureFlagProvider';

function MyComponent() {
  const stagingOnly = useFlag('FF_STAGING_ONLY', false);

  if (stagingOnly) {
    return <StagingOnlyFeature />;
  }

  return <StandardFeature />;
}
```

### With Variant

```typescript
import { useFeatureFlag } from '@/app/providers/FeatureFlagProvider';

function MyComponent() {
  const flag = useFeatureFlag('FF_STAGING_ONLY');

  if (flag?.enabled) {
    switch (flag.variant) {
      case 'variant-a':
        return <VariantA />;
      case 'variant-b':
        return <VariantB />;
      default:
        return <DefaultVariant />;
    }
  }

  return <StandardFeature />;
}
```

### Server-Side Usage

```typescript
import { isFeatureEnabled } from "@/lib/flags/unleashClient";

export async function GET(request: Request) {
  const stagingOnly = isFeatureEnabled("FF_STAGING_ONLY", false);

  if (stagingOnly) {
    // Staging-only logic
  }

  // Standard logic
}
```

## Gradual Rollout Strategy

### Phase 1: Staging Only (Week 1)

- **Target**: Staging environment only
- **Percentage**: 100% in staging, 0% in production
- **Actions**:
  - Enable flag in staging
  - Test thoroughly
  - Monitor Sentry for errors
  - Collect feedback

### Phase 2: Internal Testing (Week 2)

- **Target**: Internal testers in staging
- **Percentage**: 100% in staging
- **Actions**:
  - Deploy to TestFlight/Play Store Internal Testing
  - Test on real devices
  - Collect feedback
  - Fix issues

### Phase 3: 10% Rollout (Week 3)

- **Target**: 10% of staging users
- **Strategy**: Gradual rollout
- **Actions**:
  - Configure gradual rollout in Unleash
  - Start with 10%
  - Monitor error rates
  - Check performance metrics

### Phase 4: 25% Rollout (Week 4)

- **Target**: 25% of staging users
- **Actions**:
  - Increase to 25%
  - Continue monitoring
  - Fix any issues
  - Collect feedback

### Phase 5: 50% Rollout (Week 5)

- **Target**: 50% of staging users
- **Actions**:
  - Increase to 50%
  - Monitor closely
  - Collect feedback
  - Prepare for 100%

### Phase 6: 100% Rollout (Week 6)

- **Target**: 100% of staging users
- **Actions**:
  - Enable for all staging users
  - Monitor for 1 week
  - Collect feedback
  - Prepare for production

### Phase 7: Production (After Staging Validation)

- **Target**: Production environment
- **Actions**:
  - Enable in production (if validated in staging)
  - Start with 10% gradual rollout
  - Follow same gradual rollout strategy

## Monitoring

### Metrics to Track

1. **Error Rates**
   - Monitor Sentry for errors
   - Alert if error rate increases > 1%

2. **Performance**
   - Track API latency
   - Monitor page load times
   - Check mobile performance

3. **User Behavior**
   - Track feature usage
   - Monitor conversion rates
   - Check user feedback

### Alert Rules

Set up alerts for:

- Error rate > 1%
- API latency > 1s
- Feature usage drops > 20%
- User complaints increase

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

## Example: New Match Flow

```typescript
// Feature flag usage
const newMatchFlow = useFlag('FF_STAGING_ONLY', false);

if (newMatchFlow) {
  return <NewMatchFlowComponent />;
}

return <LegacyMatchFlowComponent />;
```

## Troubleshooting

### Flag Not Working

1. Check Unleash configuration
2. Verify environment variables
3. Check network requests
4. Review Unleash dashboard

### Flag Not Updating

1. Check refresh interval (default: 30s)
2. Clear cache
3. Restart app
4. Check Unleash server status

## Next Steps

- [ ] Set up Unleash server
- [ ] Create `FF_STAGING_ONLY` flag
- [ ] Configure environments
- [ ] Test flag in staging
- [ ] Plan gradual rollout
- [ ] Set up monitoring
- [ ] Document flag usage
