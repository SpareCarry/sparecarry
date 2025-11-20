# QA Tasks - Granular Testing Checklist

**Complete list of 60+ QA tasks for manual testing**

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

---

## Web UI Tasks

### WUI-001 to WUI-010: Authentication & Onboarding

- [ ] **WUI-001**: Sign up with email/password
- [ ] **WUI-002**: Verify email link works
- [ ] **WUI-003**: Login with email/password
- [ ] **WUI-004**: Login with Google OAuth
- [ ] **WUI-005**: Login with Apple OAuth (Safari only)
- [ ] **WUI-006**: Password reset flow
- [ ] **WUI-007**: Onboarding flow (all steps)
- [ ] **WUI-008**: Role selection (traveler/requester/sailor)
- [ ] **WUI-009**: Profile completion
- [ ] **WUI-010**: Logout functionality

### WUI-011 to WUI-020: Navigation & Layout

- [ ] **WUI-011**: Homepage loads correctly
- [ ] **WUI-012**: Navigation menu works
- [ ] **WUI-013**: Responsive design (mobile viewport)
- [ ] **WUI-014**: Responsive design (tablet viewport)
- [ ] **WUI-015**: Responsive design (desktop viewport)
- [ ] **WUI-016**: Dark mode toggle (if implemented)
- [ ] **WUI-017**: Language switcher (EN/ES/FR)
- [ ] **WUI-018**: Footer links work
- [ ] **WUI-019**: Breadcrumb navigation
- [ ] **WUI-020**: Back button behavior

### WUI-021 to WUI-030: Trip Management

- [ ] **WUI-021**: Create plane trip form
- [ ] **WUI-022**: Create boat trip form
- [ ] **WUI-023**: Edit trip details
- [ ] **WUI-024**: Delete/cancel trip
- [ ] **WUI-025**: View trip list
- [ ] **WUI-026**: Filter trips by location
- [ ] **WUI-027**: Filter trips by date
- [ ] **WUI-028**: Search trips
- [ ] **WUI-029**: Trip detail page
- [ ] **WUI-030**: Trip status updates

### WUI-031 to WUI-040: Request Management

- [ ] **WUI-031**: Create request form
- [ ] **WUI-032**: Upload item photos
- [ ] **WUI-033**: Edit request details
- [ ] **WUI-034**: Delete/cancel request
- [ ] **WUI-035**: View request list
- [ ] **WUI-036**: Filter requests by location
- [ ] **WUI-037**: Filter requests by deadline
- [ ] **WUI-038**: Search requests
- [ ] **WUI-039**: Request detail page
- [ ] **WUI-040**: Emergency request flag

### WUI-041 to WUI-050: Matching & Chat

- [ ] **WUI-041**: View available matches
- [ ] **WUI-042**: Accept match
- [ ] **WUI-043**: Reject match
- [ ] **WUI-044**: Match detail page
- [ ] **WUI-045**: Open chat from match
- [ ] **WUI-046**: Send text message
- [ ] **WUI-047**: Send image in chat
- [ ] **WUI-048**: Receive message (realtime)
- [ ] **WUI-049**: Read receipts
- [ ] **WUI-050**: Chat notifications

---

## Mobile UI Tasks (iOS)

### IOS-001 to IOS-010: App Basics

- [ ] **IOS-001**: App installs from TestFlight
- [ ] **IOS-002**: App launches without crashes
- [ ] **IOS-003**: Splash screen displays
- [ ] **IOS-004**: App icon correct
- [ ] **IOS-005**: App name correct
- [ ] **IOS-006**: Version number correct
- [ ] **IOS-007**: Bundle ID correct (staging suffix)
- [ ] **IOS-008**: App permissions requested correctly
- [ ] **IOS-009**: App background/foreground behavior
- [ ] **IOS-010**: App termination/restart

### IOS-011 to IOS-020: Navigation

- [ ] **IOS-011**: Tab bar navigation
- [ ] **IOS-012**: Stack navigation
- [ ] **IOS-013**: Modal presentation
- [ ] **IOS-014**: Swipe gestures
- [ ] **IOS-015**: Pull to refresh
- [ ] **IOS-016**: Scroll behavior
- [ ] **IOS-017**: Keyboard handling
- [ ] **IOS-018**: Safe area insets
- [ ] **IOS-019**: Status bar styling
- [ ] **IOS-020**: Haptic feedback

### IOS-021 to IOS-030: Features

- [ ] **IOS-021**: Push notifications (permission)
- [ ] **IOS-022**: Push notifications (receive)
- [ ] **IOS-023**: Push notifications (tap to open)
- [ ] **IOS-024**: Deep linking
- [ ] **IOS-025**: Share sheet
- [ ] **IOS-026**: Image picker
- [ ] **IOS-027**: Camera access
- [ ] **IOS-028**: Location services
- [ ] **IOS-029**: Biometric authentication (if implemented)
- [ ] **IOS-030**: App Store review guidelines compliance

---

## Mobile UI Tasks (Android)

### AND-001 to AND-010: App Basics

- [ ] **AND-001**: App installs from Play Store
- [ ] **AND-002**: App launches without crashes
- [ ] **AND-003**: Splash screen displays
- [ ] **AND-004**: App icon correct
- [ ] **AND-005**: App name correct
- [ ] **AND-006**: Version number correct
- [ ] **AND-007**: Package name correct (staging suffix)
- [ ] **AND-008**: App permissions requested correctly
- [ ] **AND-009**: App background/foreground behavior
- [ ] **AND-010**: App termination/restart

### AND-011 to AND-020: Navigation

- [ ] **AND-011**: Bottom navigation
- [ ] **AND-012**: Stack navigation
- [ ] **AND-013**: Back button behavior
- [ ] **AND-014**: Swipe gestures
- [ ] **AND-015**: Pull to refresh
- [ ] **AND-016**: Scroll behavior
- [ ] **AND-017**: Keyboard handling
- [ ] **AND-018**: System UI (status bar, navigation bar)
- [ ] **AND-019**: Material Design compliance
- [ ] **AND-020**: Haptic feedback

### AND-021 to AND-030: Features

- [ ] **AND-021**: Push notifications (permission)
- [ ] **AND-022**: Push notifications (receive)
- [ ] **AND-023**: Push notifications (tap to open)
- [ ] **AND-024**: Deep linking
- [ ] **AND-025**: Share intent
- [ ] **AND-026**: Image picker
- [ ] **AND-027**: Camera access
- [ ] **AND-028**: Location services
- [ ] **AND-029**: Biometric authentication (if implemented)
- [ ] **AND-030**: Play Store review guidelines compliance

---

## API Tasks

### API-001 to API-010: Authentication Endpoints

- [ ] **API-001**: POST /api/auth/signup
- [ ] **API-002**: POST /api/auth/login
- [ ] **API-003**: POST /api/auth/logout
- [ ] **API-004**: POST /api/auth/reset-password
- [ ] **API-005**: POST /api/auth/verify-email
- [ ] **API-006**: GET /api/auth/session
- [ ] **API-007**: POST /api/auth/oauth/google
- [ ] **API-008**: POST /api/auth/oauth/apple
- [ ] **API-009**: Rate limiting on auth endpoints
- [ ] **API-010**: Input validation on auth endpoints

### API-011 to API-020: Trip Endpoints

- [ ] **API-011**: GET /api/trips (list)
- [ ] **API-012**: GET /api/trips/:id (detail)
- [ ] **API-013**: POST /api/trips (create)
- [ ] **API-014**: PUT /api/trips/:id (update)
- [ ] **API-015**: DELETE /api/trips/:id (delete)
- [ ] **API-016**: GET /api/trips/search (search)
- [ ] **API-017**: Authentication required
- [ ] **API-018**: Authorization checks (own trips)
- [ ] **API-019**: Input validation
- [ ] **API-020**: Error handling

### API-021 to API-030: Request Endpoints

- [ ] **API-021**: GET /api/requests (list)
- [ ] **API-022**: GET /api/requests/:id (detail)
- [ ] **API-023**: POST /api/requests (create)
- [ ] **API-024**: PUT /api/requests/:id (update)
- [ ] **API-025**: DELETE /api/requests/:id (delete)
- [ ] **API-026**: GET /api/requests/search (search)
- [ ] **API-027**: Authentication required
- [ ] **API-028**: Authorization checks (own requests)
- [ ] **API-029**: Input validation
- [ ] **API-030**: Error handling

### API-031 to API-040: Match Endpoints

- [ ] **API-031**: GET /api/matches (list)
- [ ] **API-032**: GET /api/matches/:id (detail)
- [ ] **API-033**: POST /api/matches/accept
- [ ] **API-034**: POST /api/matches/reject
- [ ] **API-035**: GET /api/matches/check (auto-match)
- [ ] **API-036**: Authentication required
- [ ] **API-037**: Authorization checks (participants only)
- [ ] **API-038**: Input validation
- [ ] **API-039**: Error handling
- [ ] **API-040**: Match status transitions

### API-041 to API-050: Chat Endpoints

- [ ] **API-041**: GET /api/conversations (list)
- [ ] **API-042**: GET /api/conversations/:id (detail)
- [ ] **API-043**: GET /api/messages/:conversationId (list)
- [ ] **API-044**: POST /api/messages (send)
- [ ] **API-045**: PUT /api/messages/:id/read (mark read)
- [ ] **API-046**: Authentication required
- [ ] **API-047**: Authorization checks (participants only)
- [ ] **API-048**: Input validation
- [ ] **API-049**: Error handling
- [ ] **API-050**: Realtime updates

---

## Payment Tasks

### PAY-001 to PAY-010: Payment Flow

- [ ] **PAY-001**: Create payment intent
- [ ] **PAY-002**: Stripe form loads
- [ ] **PAY-003**: Test card payment (success)
- [ ] **PAY-004**: Test card payment (decline)
- [ ] **PAY-005**: Payment confirmation
- [ ] **PAY-006**: Escrow creation
- [ ] **PAY-007**: Match status update
- [ ] **PAY-008**: Payment error handling
- [ ] **PAY-009**: Payment retry
- [ ] **PAY-010**: Payment history

### PAY-011 to PAY-020: Stripe Integration

- [ ] **PAY-011**: Webhook signature verification
- [ ] **PAY-012**: payment_intent.succeeded event
- [ ] **PAY-013**: payment_intent.payment_failed event
- [ ] **PAY-014**: charge.refunded event
- [ ] **PAY-015**: Webhook error handling
- [ ] **PAY-016**: Test mode vs live mode
- [ ] **PAY-017**: Stripe Connect (if implemented)
- [ ] **PAY-018**: Subscription payments (if implemented)
- [ ] **PAY-019**: Refund processing
- [ ] **PAY-020**: Payment disputes

---

## Notifications Tasks

### NOTIF-001 to NOTIF-010: Push Notifications

- [ ] **NOTIF-001**: Request notification permission
- [ ] **NOTIF-002**: Register device token
- [ ] **NOTIF-003**: Receive push notification
- [ ] **NOTIF-004**: Tap notification to open app
- [ ] **NOTIF-005**: Deep link from notification
- [ ] **NOTIF-006**: Notification badge count
- [ ] **NOTIF-007**: Notification sound
- [ ] **NOTIF-008**: Notification on lock screen
- [ ] **NOTIF-009**: Notification in notification center
- [ ] **NOTIF-010**: Disable notifications

### NOTIF-011 to NOTIF-020: Email Notifications

- [ ] **NOTIF-011**: Welcome email on signup
- [ ] **NOTIF-012**: Email verification
- [ ] **NOTIF-013**: Password reset email
- [ ] **NOTIF-014**: Match created email
- [ ] **NOTIF-015**: Payment confirmation email
- [ ] **NOTIF-016**: Delivery confirmation email
- [ ] **NOTIF-017**: Dispute notification email
- [ ] **NOTIF-018**: Email unsubscribe
- [ ] **NOTIF-019**: Email template rendering
- [ ] **NOTIF-020**: Email delivery tracking

---

## Feature Flags Tasks

### FLAG-001 to FLAG-010: Flag Functionality

- [ ] **FLAG-001**: Flags load on app start
- [ ] **FLAG-002**: Flags cached locally
- [ ] **FLAG-003**: Flags refresh periodically
- [ ] **FLAG-004**: enable_push_notifications flag
- [ ] **FLAG-005**: email_notifications flag
- [ ] **FLAG-006**: dispute_refund_flow flag
- [ ] **FLAG-007**: FF_STAGING_ONLY flag
- [ ] **FLAG-008**: Flag fallback to safe defaults
- [ ] **FLAG-009**: Flag toggle in admin UI
- [ ] **FLAG-010**: Environment-specific flags

---

## Sentry Verification Tasks

### SENTRY-001 to SENTRY-010: Error Tracking

- [ ] **SENTRY-001**: Sentry initialized on web
- [ ] **SENTRY-002**: Sentry initialized on mobile
- [ ] **SENTRY-003**: Uncaught errors captured
- [ ] **SENTRY-004**: API route errors captured
- [ ] **SENTRY-005**: React error boundary errors captured
- [ ] **SENTRY-006**: PII redaction working
- [ ] **SENTRY-007**: Source maps uploaded
- [ ] **SENTRY-008**: Releases tracked
- [ ] **SENTRY-009**: Performance traces
- [ ] **SENTRY-010**: User context set

---

## Staging Supabase Verification Tasks

### DB-001 to DB-010: Database Connectivity

- [ ] **DB-001**: Supabase connection works
- [ ] **DB-002**: Authentication works
- [ ] **DB-003**: Database queries work
- [ ] **DB-004**: Storage uploads work
- [ ] **DB-005**: Storage downloads work
- [ ] **DB-006**: Realtime subscriptions work
- [ ] **DB-007**: RLS policies enforced
- [ ] **DB-008**: Test data accessible
- [ ] **DB-009**: Database migrations applied
- [ ] **DB-010**: Seed data present

---

## Matching Algorithm Behavior Testing

### MATCH-001 to MATCH-010: Matching Logic

- [ ] **MATCH-001**: Match created for same route
- [ ] **MATCH-002**: Match created for overlapping dates
- [ ] **MATCH-003**: Match respects capacity constraints
- [ ] **MATCH-004**: Match respects dimension constraints
- [ ] **MATCH-005**: Match respects preferred method
- [ ] **MATCH-006**: Emergency requests prioritized
- [ ] **MATCH-007**: Group buy matching works
- [ ] **MATCH-008**: No duplicate matches
- [ ] **MATCH-009**: Match status transitions
- [ ] **MATCH-010**: Match cancellation handling

---

## Edge Case Testing

### EDGE-001 to EDGE-010: Network & Offline

- [ ] **EDGE-001**: Network loss during request
- [ ] **EDGE-002**: Network loss during payment
- [ ] **EDGE-003**: Network loss during chat
- [ ] **EDGE-004**: Offline mode (mobile)
- [ ] **EDGE-005**: Slow network handling
- [ ] **EDGE-006**: Request timeout handling
- [ ] **EDGE-007**: API error responses
- [ ] **EDGE-008**: Invalid input handling
- [ ] **EDGE-009**: Concurrent request handling
- [ ] **EDGE-010**: Session expiration handling

### EDGE-011 to EDGE-020: Data & State

- [ ] **EDGE-011**: Large file uploads
- [ ] **EDGE-012**: Special characters in input
- [ ] **EDGE-013**: Very long text inputs
- [ ] **EDGE-014**: Empty state handling
- [ ] **EDGE-015**: Loading state handling
- [ ] **EDGE-016**: Error state handling
- [ ] **EDGE-017**: State persistence
- [ ] **EDGE-018**: State synchronization
- [ ] **EDGE-019**: Data refresh
- [ ] **EDGE-020**: Cache invalidation

---

## Summary

**Total Tasks**: 60+

**Categories**:
- Web UI: 50 tasks
- Mobile UI (iOS): 30 tasks
- Mobile UI (Android): 30 tasks
- API: 50 tasks
- Payment: 20 tasks
- Notifications: 20 tasks
- Feature Flags: 10 tasks
- Sentry: 10 tasks
- Database: 10 tasks
- Matching: 10 tasks
- Edge Cases: 20 tasks

**Estimated Testing Time**: 8-12 hours for complete coverage

---

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

