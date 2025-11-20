# Temporary API Routes

This directory contains API routes that are either:

1. **Experimental/Incomplete**: Routes that are still in development
2. **Deprecated**: Routes that have been moved to `app/api/` but kept here for reference
3. **Placeholder**: Routes that need additional setup before being production-ready

## Status of Routes

### Notifications
- `notifications/send-message/route.ts` - ✅ **Moved to app/api** (uses notification service stub)
- `notifications/send-match/route.ts` - ✅ **Moved to app/api** (uses notification service stub)
- `notifications/send-counter-offer/route.ts` - ✅ **Moved to app/api** (uses notification service stub)
- `notifications/register-token/route.ts` - ⚠️ **Needs review** (may need client-side implementation)
- `notifications/emergency-request/route.ts` - ⚠️ **Needs review** (special case handling)

### Matches
- `matches/auto-match/route.ts` - ✅ **Moved to app/api** (notification integration added)
- `matches/create/route.ts` - ✅ **Moved to app/api**
- `matches/check/route.ts` - ✅ **Moved to app/api**
- `matches/update-purchase-link/route.ts` - ✅ **Moved to app/api**

### Payments
- `payments/create-intent/route.ts` - ✅ **Moved to app/api**
- `payments/confirm-delivery/route.ts` - ✅ **Moved to app/api**
- `payments/auto-release/route.ts` - ✅ **Moved to app/api**

### Other Routes
All other routes have been moved to `app/api/` and are production-ready.

## Next Steps

1. **Complete notification service**: Implement actual push notification sending (FCM, OneSignal, etc.)
2. **Complete email service**: Implement Resend integration for email notifications
3. **Review emergency notifications**: Ensure proper handling of emergency requests
4. **Test all routes**: Ensure all moved routes work correctly with updated import paths

## Migration Notes

- All routes have been copied to `app/api/` with updated import paths
- Import paths changed from `../../../../` to `../../../` (one less level)
- Notification TODOs have been addressed with service stubs
- Routes are ready for production use, but notification services need backend setup

