# Playwright E2E Fix Plan

This document tracks everything that must be true for the Playwright suite to pass. We will iterate suite-by-suite, checking off each flow once both the product behavior and the tests align.

## 1. Global prerequisites

| Status | Task | Notes |
| --- | --- | --- |
| ✅ | **Test-mode auth bypass** | Supabase client now returns the injected Playwright user when `__PLAYWRIGHT_TEST_MODE__` or `PLAYWRIGHT_TESTING` is set (see `lib/supabase/client.ts`). |
| ⬜ | Deterministic mock data layer | Ensure every page that hits Supabase REST endpoints gracefully handles the empty arrays returned by `setupSupabaseMocks`. |
| ⬜ | Analytics / side-effect guards | Wrap analytics calls (Mixpanel/Segment/etc.) so they silently noop in tests. |
| ⬜ | Feature-flag aware UI | Surfaces that are hidden behind flags in production need deterministic rendering in test mode (Promo cards, Trusted badge, etc.). |

## 2. Flow-by-flow checklist

Each entry references the spec that asserts the behavior and the app surface we need to harden.

| Status | Spec (tests/e2e/…) | Product Surface | Key Work Items |
| --- | --- | --- | --- |
| ⬜ | `flows/landing.spec.ts` | Marketing landing page (`app/page.tsx`) | Ensure CTA buttons spin up auth check + redirect, waitlist modal opens, hero sections render reliably. |
| ⬜ | `auth-flow.spec.ts`, `auth.spec.ts`, `flows/auth.spec.ts` | `/auth/login`, `/auth/signup`, magic-link flow | Verify validation states, redirect preservation, OAuth placeholder buttons. |
| ⬜ | `complete-app-flow.spec.ts` | Full journey (landing → auth → home) | Needs stable `waitForPageReady` hook plus predictable navigation in test mode. |
| ⬜ | `feed.spec.ts` | Feed/browse page (`app/home/page.tsx`) | Guarantee feed cards render with `data-testid="feed-item"` and mock data populates cards. |
| ⬜ | `full-payment-flow.spec.ts`, `payment-flow.e2e.ts` | Payment CTA / escrow screens | Confirm `/api/payments/*` mocks surface expected banners + statuses. |
| ⬜ | `flows/edge-cases.spec.ts` | Post-request form | Restricted items toggle, emergency multiplier copy, location auto-complete fallback, messaging modal guardrails. |
| ⬜ | `flows/post-request-upgrades.spec.ts` | Post-request upgrade carousel | Category dropdown, “Other” description field, emergency pricing cap, photo upload placeholder. |
| ⬜ | `shipping-estimator.spec.ts`, `pricing-estimator-promo.spec.ts` | `/shipping-estimator` | Ensure origin/destination selects, price comparison cards, promo banners (Early Supporter, premium discounts) all render with deterministic data. |
| ⬜ | `promo-card.spec.ts` | Promo widgets (Early Supporter + First Delivery) | Surface countdown, dismissal persistence, post-expiry fallbacks. |
| ⬜ | `flows/my-stuff.spec.ts` | “My Stuff” dashboard | Verify navigation, chat/support buttons, accessibility labels. |
| ⬜ | `flows/jobs.spec.ts` | Job posting switcher | Validate “Post Trip / Post Request” toggles, prohibited items guard, validation errors. |
| ⬜ | `flows/profile.spec.ts`, `subscription-flow.spec.ts`, `lifetime/*` specs | Profile + SpareCarry Pro card | Subscription options, lifetime availability, checkout buttons, hall-of-fame links. |
| ⬜ | `watchlist.spec.ts` | Watchlist button | Add `data-testid` hooks, ensure Supabase insert/delete paths resolve under mocks. |
| ⬜ | `suggested-matches.spec.ts` | Suggested matches module | Provide mocked match data so the carousel/list renders. |
| ⬜ | `message-translate.spec.ts`, `flows/messaging.spec.ts`, `flows/beta-testing-flow.spec.ts` | Messaging modal & beta multi-user flow | Guarantee chat modal opens, send button disabled when input empty, translation toggle available. |
| ⬜ | `cancellation-reasons.spec.ts` | Cancellation modal | Modal trigger, radio buttons, “Other” note requirement. |
| ⬜ | `trusted-traveller.spec.ts`, `trust-badges.spec.ts`, `item-safety.spec.ts` | Trust & safety surfaces | Badge components, safety score widget, tooltip copy. |
| ⬜ | `auto-category.spec.ts` | Auto-category detection | Ensure heuristics run client-side with deterministic mock results. |
| ⬜ | `photo-upload.spec.ts`, `photo-upload-enhanced.spec.ts` | Photo upload controls | Implement 4-photo limit UI, compression notices, thumbnail gallery placeholders. |
| ⬜ | `location-flow.spec.ts` | Location inputs (`LocationFieldGroup`) | Autocomplete fallback, “Use my location” button, marina filters. |
| ⬜ | `negative-tests.spec.ts` | Auth & form error resilience | Display inline validation and toast-free fallbacks under mocked network errors. |
| ⬜ | `lifetime/test_signup_shows_lifetime_screen.spec.ts`, `test_lifetime_purchase_flow.spec.ts`, `test_existing_lifetime_user.spec.ts`, `test_lifetime_limit_reached.spec.ts`, `test_compat_with_monthly_yearly.spec.ts` | Lifetime purchase funnel | Need deterministic copy + gating for lifetime offers, limit messaging, compatibility with monthly/yearly tiers. |
| ⬜ | `examples/fast-mode-example.spec.ts` | Fast mode dev harness | Keep `/examples/fast-mode` route wired to mock data for multi-user toggling. |

## 3. Execution order

1. **Baseline (DONE)**: make the app test-aware (`createClient` test mode override).
2. **Landing/Auth**: stabilise entry points so downstream flows can run.
3. **Profile/Subscription**: unblock the largest cluster of failing specs.
4. **Form-heavy flows**: Post Request, Jobs, Shipping Estimator.
5. **Messaging & Beta flows**.
6. **Trust/Promo/Watchlist polish**.

Progress will be tracked by checking off the rows above and keeping a short summary of fixes per suite in `TEST_REPORTS_GUIDE.md`.

