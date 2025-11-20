# Telemetry Overview

This document describes the telemetry and monitoring system for SpareCarry.

## Overview

SpareCarry uses a comprehensive telemetry system to track:
- User events (signup, login, matches, etc.)
- Performance metrics (TTFB, FCP, LCP, etc.)
- API request latency
- Errors and exceptions
- Mobile app performance (cold start, warm start, etc.)

## Architecture

### Components

1. **Telemetry Client** (`lib/telemetry/client.ts`)
   - Unified client for web and mobile
   - Sends events to Sentry and analytics services
   - Handles user context and session tracking

2. **Performance Telemetry** (`lib/telemetry/performance.ts`)
   - Web performance metrics (TTFB, FCP, LCP, FID, CLS)
   - Mobile performance metrics (cold start, warm start)
   - API latency tracking

3. **Event Definitions** (`lib/telemetry/events.ts`)
   - Type-safe event definitions
   - Event metadata schemas
   - Performance metric types

4. **Sentry Integration** (`lib/logger/index.ts`)
   - Error tracking
   - Performance monitoring
   - User context
   - Breadcrumbs

## Events Tracked

### User Events

- `user.signup` - User signs up
- `user.login` - User logs in
- `user.logout` - User logs out

### Match Events

- `match.created` - Match is created
- `match.accepted` - Match is accepted
- `match.rejected` - Match is rejected
- `match.completed` - Match is completed

### Trade Events

- `trade.initiated` - Trade is initiated
- `trade.completed` - Trade is completed

### Payment Events

- `payment.intent_created` - Payment intent created
- `payment.completed` - Payment completed
- `payment.failed` - Payment failed

### Dispute Events

- `dispute.submitted` - Dispute is submitted
- `dispute.resolved` - Dispute is resolved

### Chat Events

- `chat.message_sent` - Message is sent
- `chat.message_received` - Message is received

### Notification Events

- `notification.sent` - Notification is sent
- `notification.delivered` - Notification is delivered
- `notification.opened` - Notification is opened

### Performance Events

- `performance.metric` - Performance metric recorded
- `page.view` - Page is viewed
- `page.load` - Page is loaded
- `api.request` - API request made
- `api.error` - API error occurred

## Usage

### Track Event

```typescript
import { trackEvent } from '@/lib/telemetry/client';

// Track user signup
trackEvent('user.signup', {
  method: 'email',
  userType: 'traveler',
});

// Track match creation
trackEvent('match.created', {
  matchId: '123',
  tripId: '456',
  requestId: '789',
  rewardAmount: 100,
  route: {
    from: 'New York',
    to: 'London',
  },
});
```

### Track Performance

```typescript
import { captureApiLatency } from '@/lib/telemetry/performance';

// Track API latency
captureApiLatency(
  '/api/matches/create',
  'POST',
  150, // duration in ms
  200, // status code
);
```

### Set User Context

```typescript
import { setTelemetryUser } from '@/lib/telemetry/client';

// Set user context
setTelemetryUser(userId, email);

// Clear user context
clearTelemetryUser();
```

## Performance Metrics

### Web Metrics

- **TTFB (Time to First Byte)**: Server response time
- **FCP (First Contentful Paint)**: First content rendered
- **LCP (Largest Contentful Paint)**: Largest content rendered
- **FID (First Input Delay)**: Time to first interaction
- **CLS (Cumulative Layout Shift)**: Visual stability

### Mobile Metrics

- **Cold Start**: App launch from closed state
- **Warm Start**: App launch from background
- **Bundle Load**: JavaScript bundle load time
- **Bridge Latency**: Capacitor bridge call latency
- **Push Notification Latency**: Notification delivery time

## Sentry Integration

### Error Tracking

Errors are automatically captured by:
- React Error Boundary
- API error handlers
- Unhandled promise rejections
- Uncaught exceptions

### Performance Monitoring

Sentry tracks:
- Page load performance
- API request performance
- Database query performance
- Custom performance transactions

### User Context

User context is automatically set:
- User ID
- Email
- Session ID
- Environment (development/staging/production)

## Analytics Integration

### Google Analytics

Events are sent to Google Analytics 4:
- Custom events
- Page views
- User properties

### Meta Pixel

Events are sent to Meta Pixel:
- Custom events
- Conversions
- User properties

## Configuration

### Environment Variables

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=staging
SENTRY_TRACES_SAMPLE_RATE=0.2

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_META_PIXEL_ID=...

# Telemetry
NEXT_PUBLIC_ENABLE_TELEMETRY=true
LOG_SAMPLING_RATE=0.2
```

### Disable Telemetry

Set `NEXT_PUBLIC_ENABLE_TELEMETRY=false` to disable telemetry.

## Privacy

### PII Redaction

Sensitive data is automatically redacted:
- Email addresses
- Credit card numbers
- Phone numbers
- SSN
- Tokens and secrets

### Sampling

Production logs are sampled to reduce volume:
- Default: 10% of logs
- Error logs: Never sampled
- Performance metrics: Always tracked

## Monitoring

### Sentry Dashboard

View events in Sentry:
- Errors and exceptions
- Performance metrics
- User sessions
- Release tracking

### Analytics Dashboards

View events in:
- Google Analytics
- Meta Events Manager

## Best Practices

1. **Event Naming**
   - Use dot notation (e.g., `user.signup`)
   - Be consistent with naming
   - Use past tense for completed actions

2. **Metadata**
   - Include relevant context
   - Avoid sensitive data
   - Keep metadata size reasonable

3. **Performance**
   - Don't block UI with telemetry
   - Use async tracking
   - Batch events when possible

4. **Privacy**
   - Never track PII
   - Redact sensitive data
   - Comply with GDPR/CCPA

## Troubleshooting

### Events Not Appearing

1. Check `NEXT_PUBLIC_ENABLE_TELEMETRY` is set
2. Verify Sentry DSN is correct
3. Check network requests in DevTools
4. Review Sentry dashboard

### Performance Impact

1. Check telemetry is async
2. Verify sampling is enabled
3. Monitor bundle size
4. Review performance metrics

## Next Steps

- [ ] Set up custom dashboards
- [ ] Create alert rules
- [ ] Implement A/B testing telemetry
- [ ] Add user journey tracking

