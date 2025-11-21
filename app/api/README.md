# API Routes

This directory hosts all App Router API handlers for SpareCarry. Routes are
organized by business domain (notifications, matches, payments, referrals,
Stripe, etc.) and run on the Node.js runtime.

## Notable areas

- `notifications/*`: Sends push/email notifications via the stubbed
  notification service. Replace the stubs in `lib/notifications/push-service`
  with production integrations (FCM/OneSignal/Resend) before launch.
- `matches/*`: Handles auto-matching and purchase link generation.
- `payments/*`: Creates Stripe payment intents, confirms delivery, and
  processes auto-release jobs (requires `CRON_SECRET`).
- `subscriptions/*`, `supporter/*`, `stripe/*`: Manage Stripe Checkout,
  billing portal access, and identity verification.
- `referrals/*`: Processes referral credits (service-role access required).
- `webhooks/stripe`: Stripe webhook endpoint (keep running on the Node.js
  runtime—do not deploy to the edge).

## To-do / hardening

1. Replace notification/email stubs with a real delivery service.
2. Audit all routes for proper error reporting and monitoring.
3. Add integration tests that exercise the most critical flows
   (subscription checkout, supporter flow, payment intent creation).
4. Keep this directory under `scripts/pre-build-exclude-routes.js` when
   exporting the marketing site to avoid bundling server-only code.

