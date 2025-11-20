# QA Simulation Manual

**Complete QA testing guide for SpareCarry beta launch**

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

---

## Table of Contents

1. [Functional Test Cases](#functional-test-cases)
2. [End-to-End User Journeys](#end-to-end-user-journeys)
3. [Mobile QA Scenarios](#mobile-qa-scenarios)
4. [Web QA Scenarios](#web-qa-scenarios)
5. [Security Testing Scenarios](#security-testing-scenarios)
6. [Payment Simulation](#payment-simulation)
7. [Notifications Simulation](#notifications-simulation)
8. [Messaging Load Tests](#messaging-load-tests)
9. [Delivery + Escrow Simulation](#delivery--escrow-simulation)
10. [Dispute Simulation](#dispute-simulation)
11. [Feature Flag Testing Scenarios](#feature-flag-testing-scenarios)
12. [Acceptance Criteria](#acceptance-criteria)
13. [Regression Checklist](#regression-checklist)
14. [Screenshot Checklist](#screenshot-checklist)
15. [Screen Recording Checklist](#screen-recording-checklist)

---

## 🧪 Functional Test Cases

### Authentication & User Management

#### TC-AUTH-001: User Registration
**Steps**:
1. Navigate to signup page
2. Enter email: `test-user@sparecarry.test`
3. Enter password: `Test123!@#`
4. Click "Sign Up"
5. Check email for verification link
6. Click verification link
7. Verify redirect to onboarding

**Expected**:
- ✅ User account created
- ✅ Verification email sent
- ✅ Profile created automatically
- ✅ Redirected to onboarding/home

**Acceptance**: User can sign up and verify email

---

#### TC-AUTH-002: User Login
**Steps**:
1. Navigate to login page
2. Enter email: `test-traveler1@sparecarry.test`
3. Enter password: `Test123!@#`
4. Click "Sign In"
5. Verify redirect to dashboard

**Expected**:
- ✅ Login successful
- ✅ Session created
- ✅ Redirected to appropriate dashboard (traveler/requester)
- ✅ User data loaded

**Acceptance**: User can log in with valid credentials

---

#### TC-AUTH-003: Password Reset
**Steps**:
1. Navigate to login page
2. Click "Forgot Password"
3. Enter email: `test-user@sparecarry.test`
4. Click "Send Reset Link"
5. Check email for reset link
6. Click reset link
7. Enter new password: `NewTest123!@#`
8. Confirm password
9. Click "Reset Password"
10. Login with new password

**Expected**:
- ✅ Reset email sent
- ✅ Password reset link works
- ✅ Password updated successfully
- ✅ Can login with new password

**Acceptance**: Password reset flow works end-to-end

---

#### TC-AUTH-004: OAuth Login (Google)
**Steps**:
1. Navigate to login page
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify redirect to app

**Expected**:
- ✅ OAuth flow completes
- ✅ User account created/linked
- ✅ Redirected to app
- ✅ Profile populated from Google

**Acceptance**: OAuth login works

---

#### TC-AUTH-005: OAuth Login (Apple)
**Steps**:
1. Navigate to login page (iOS only)
2. Click "Sign in with Apple"
3. Complete Apple OAuth flow
4. Verify redirect to app

**Expected**:
- ✅ Apple OAuth flow completes
- ✅ User account created/linked
- ✅ Redirected to app

**Acceptance**: Apple OAuth login works (iOS only)

---

### Traveler Flow

#### TC-TRAVEL-001: Create Trip (Plane)
**Steps**:
1. Login as traveler
2. Navigate to "Post Trip"
3. Select "Plane"
4. Enter from location: `San Francisco, CA`
5. Enter to location: `St. George's, Grenada`
6. Enter flight number: `AA1234`
7. Select departure date (7 days from now)
8. Enter ETA window: `6:00 PM - 8:00 PM`
9. Enter spare capacity: `23 kg, 50 L`
10. Enter max dimensions: `150cm x 50cm x 30cm`
11. Click "Post Trip"
12. Verify trip appears in "My Trips"

**Expected**:
- ✅ Trip created successfully
- ✅ Trip visible in "My Trips"
- ✅ Trip visible in public feed
- ✅ Status is "active"

**Acceptance**: Traveler can create plane trip

---

#### TC-TRAVEL-002: Create Trip (Boat)
**Steps**:
1. Login as sailor
2. Navigate to "Post Trip"
3. Select "Boat"
4. Enter from location: `Rodney Bay, Saint Lucia`
5. Enter to location: `Grenada Marine, Grenada`
6. Select departure date (14 days from now)
7. Enter ETA window: `12:00 PM - 6:00 PM`
8. Enter spare capacity: `45 kg, 100 L`
9. Enter max dimensions: `200cm x 80cm x 50cm`
10. Enable "Can Oversize"
11. Click "Post Trip"
12. Verify trip appears in "My Trips"

**Expected**:
- ✅ Trip created successfully
- ✅ Trip visible in "My Trips"
- ✅ Trip visible in public feed
- ✅ Oversize option saved

**Acceptance**: Sailor can create boat trip

---

#### TC-TRAVEL-003: Edit Trip
**Steps**:
1. Login as traveler
2. Navigate to "My Trips"
3. Click on existing trip
4. Click "Edit"
5. Update spare capacity: `30 kg, 60 L`
6. Click "Save"
7. Verify changes saved

**Expected**:
- ✅ Trip updated successfully
- ✅ Changes reflected in feed
- ✅ Updated timestamp shown

**Acceptance**: Traveler can edit their trips

---

#### TC-TRAVEL-004: Cancel Trip
**Steps**:
1. Login as traveler
2. Navigate to "My Trips"
3. Click on active trip
4. Click "Cancel Trip"
5. Confirm cancellation
6. Verify trip status is "cancelled"

**Expected**:
- ✅ Trip cancelled successfully
- ✅ Status updated to "cancelled"
- ✅ Trip removed from public feed
- ✅ Active matches notified (if any)

**Acceptance**: Traveler can cancel trips

---

### Requester Flow

#### TC-REQUEST-001: Create Request
**Steps**:
1. Login as requester
2. Navigate to "Post Request"
3. Enter title: `Marine Battery - 12V Deep Cycle`
4. Enter description: `Need a 12V deep cycle marine battery for my boat`
5. Enter from location: `West Marine, San Francisco, CA`
6. Enter to location: `Grenada Marine, St. George's, Grenada`
7. Enter deadline: `10 days from now`
8. Enter max reward: `$150.00`
9. Enter weight: `25 kg`
10. Enter dimensions: `30cm x 17cm x 20cm`
11. Select preferred method: `Any`
12. Upload item photo (optional)
13. Click "Post Request"
14. Verify request appears in "My Requests"

**Expected**:
- ✅ Request created successfully
- ✅ Request visible in "My Requests"
- ✅ Request visible in public feed
- ✅ Status is "open"

**Acceptance**: Requester can create delivery request

---

#### TC-REQUEST-002: Create Emergency Request
**Steps**:
1. Login as requester
2. Navigate to "Post Request"
3. Fill in request details
4. Enable "Emergency" flag
5. Click "Post Request"
6. Verify emergency badge appears
7. Verify request appears at top of feed

**Expected**:
- ✅ Request created with emergency flag
- ✅ Emergency badge visible
- ✅ Request prioritized in feed
- ✅ Travelers notified (if push enabled)

**Acceptance**: Emergency requests are properly flagged

---

#### TC-REQUEST-003: Edit Request
**Steps**:
1. Login as requester
2. Navigate to "My Requests"
3. Click on open request
4. Click "Edit"
5. Update max reward: `$175.00`
6. Click "Save"
7. Verify changes saved

**Expected**:
- ✅ Request updated successfully
- ✅ Changes reflected in feed
- ✅ Updated timestamp shown

**Acceptance**: Requester can edit open requests

---

#### TC-REQUEST-004: Cancel Request
**Steps**:
1. Login as requester
2. Navigate to "My Requests"
3. Click on open request
4. Click "Cancel Request"
5. Confirm cancellation
6. Verify request status is "cancelled"

**Expected**:
- ✅ Request cancelled successfully
- ✅ Status updated to "cancelled"
- ✅ Request removed from public feed
- ✅ Active matches notified (if any)

**Acceptance**: Requester can cancel requests

---

### Matching Flow

#### TC-MATCH-001: Automatic Match Creation
**Steps**:
1. Login as traveler
2. Create trip: `San Francisco → Grenada` (7 days from now)
3. Login as requester (different account)
4. Create request: `San Francisco → Grenada` (deadline: 10 days from now)
5. Verify match appears in both accounts
6. Check match details

**Expected**:
- ✅ Match created automatically
- ✅ Match visible to both users
- ✅ Match status is "pending"
- ✅ Conversation created automatically

**Acceptance**: Matching algorithm creates matches correctly

---

#### TC-MATCH-002: Manual Match Acceptance
**Steps**:
1. Login as traveler
2. Navigate to "Matches"
3. View pending match
4. Click "Accept Match"
5. Verify match status changes to "chatting"
6. Verify conversation opens

**Expected**:
- ✅ Match accepted successfully
- ✅ Status updated to "chatting"
- ✅ Conversation accessible
- ✅ Both users notified

**Acceptance**: Traveler can accept matches

---

#### TC-MATCH-003: Match Rejection
**Steps**:
1. Login as traveler
2. Navigate to "Matches"
3. View pending match
4. Click "Reject Match"
5. Confirm rejection
6. Verify match status is "cancelled"
7. Verify match removed from feed

**Expected**:
- ✅ Match rejected successfully
- ✅ Status updated to "cancelled"
- ✅ Match removed from active matches
- ✅ Requester notified

**Acceptance**: Traveler can reject matches

---

#### TC-MATCH-004: Group Buy Matching
**Steps**:
1. Login as traveler
2. Create trip
3. Click "Create Group Buy"
4. Set max participants: `5`
5. Set discount: `10%`
6. Verify group buy created
7. Login as multiple requesters
8. Each requester joins group buy
9. Verify matches created for all participants

**Expected**:
- ✅ Group buy created successfully
- ✅ Multiple requesters can join
- ✅ Matches created for each participant
- ✅ Discount applied correctly

**Acceptance**: Group buy matching works

---

### Chat Flow

#### TC-CHAT-001: Send Message
**Steps**:
1. Login as traveler
2. Navigate to "Matches"
3. Open match with status "chatting"
4. Type message: `Hi! I can help with this delivery.`
5. Click "Send"
6. Verify message appears in chat
7. Login as requester
8. Verify message appears in their chat

**Expected**:
- ✅ Message sent successfully
- ✅ Message appears immediately
- ✅ Message visible to both users
- ✅ Timestamp shown correctly

**Acceptance**: Users can send messages

---

#### TC-CHAT-002: Receive Message (Realtime)
**Steps**:
1. Login as traveler
2. Open chat conversation
3. Keep chat open
4. Login as requester (different device/browser)
5. Send message from requester account
6. Verify message appears in traveler's chat without refresh

**Expected**:
- ✅ Message received in real-time
- ✅ No page refresh required
- ✅ Message appears instantly
- ✅ Read receipt updates (if enabled)

**Acceptance**: Realtime messaging works

---

#### TC-CHAT-003: Message Read Receipts
**Steps**:
1. Login as requester
2. Send message to traveler
3. Login as traveler
4. Open chat conversation
5. Verify message shows as "read"
6. Verify read timestamp shown

**Expected**:
- ✅ Read receipt updates when message viewed
- ✅ Read timestamp shown
- ✅ Sender sees read status

**Acceptance**: Read receipts work correctly

---

#### TC-CHAT-004: Chat with Images
**Steps**:
1. Login as traveler
2. Open chat conversation
3. Click "Attach Image"
4. Select image from device
5. Add caption (optional)
6. Click "Send"
7. Verify image appears in chat
8. Verify image is clickable/zoomable

**Expected**:
- ✅ Image uploaded successfully
- ✅ Image appears in chat
- ✅ Image is viewable
- ✅ Image stored in Supabase storage

**Acceptance**: Users can send images in chat

---

### Payment Flow

#### TC-PAY-001: Create Payment Intent
**Steps**:
1. Login as requester
2. Navigate to match with status "chatting"
3. Click "Proceed to Payment"
4. Review payment details:
   - Reward amount: `$150.00`
   - Platform fee: `$22.50` (15%)
   - Total: `$172.50`
5. Click "Confirm Payment"
6. Verify Stripe payment form appears
7. Enter test card: `4242 4242 4242 4242`
8. Enter expiry: `12/25`
9. Enter CVC: `123`
10. Enter ZIP: `90210`
11. Click "Pay"
12. Verify payment intent created

**Expected**:
- ✅ Payment intent created
- ✅ Stripe form loads correctly
- ✅ Test payment processes
- ✅ Match status updates to "escrow_paid"

**Acceptance**: Payment intent creation works

---

#### TC-PAY-002: Payment Success
**Steps**:
1. Complete payment flow (TC-PAY-001)
2. Verify payment success message
3. Verify match status is "escrow_paid"
4. Verify escrow payment intent ID stored
5. Check Stripe dashboard for payment

**Expected**:
- ✅ Payment processed successfully
- ✅ Match status updated
- ✅ Payment intent ID stored
- ✅ Payment visible in Stripe dashboard

**Acceptance**: Payment success flow works

---

#### TC-PAY-003: Payment Failure
**Steps**:
1. Navigate to payment flow
2. Enter declined test card: `4000 0000 0000 0002`
3. Complete payment
4. Verify error message shown
5. Verify match status remains "chatting"
6. Verify payment intent not created

**Expected**:
- ✅ Payment failure handled gracefully
- ✅ Error message shown to user
- ✅ Match status unchanged
- ✅ User can retry payment

**Acceptance**: Payment failure handling works

---

#### TC-PAY-004: Refund Processing
**Steps**:
1. Login as admin
2. Navigate to disputed match
3. Review dispute details
4. Click "Process Refund"
5. Confirm refund amount
6. Verify refund processed in Stripe
7. Verify match status updated

**Expected**:
- ✅ Refund processed successfully
- ✅ Refund visible in Stripe
- ✅ Match status updated
- ✅ User notified of refund

**Acceptance**: Refund processing works (admin only)

---

### Delivery Flow

#### TC-DELIVERY-001: Mark Delivery Complete
**Steps**:
1. Login as traveler
2. Navigate to match with status "escrow_paid"
3. Click "Mark as Delivered"
4. Upload proof photos (2-3 photos)
5. Enter GPS location (optional)
6. Select meetup location
7. Click "Confirm Delivery"
8. Verify delivery recorded
9. Verify match status is "delivered"

**Expected**:
- ✅ Delivery marked complete
- ✅ Proof photos uploaded
- ✅ Match status updated to "delivered"
- ✅ Requester notified

**Acceptance**: Traveler can mark delivery complete

---

#### TC-DELIVERY-002: Confirm Delivery (Requester)
**Steps**:
1. Login as requester
2. Navigate to match with status "delivered"
3. Review delivery proof photos
4. Click "Confirm Delivery"
5. Verify escrow released to traveler
6. Verify match status is "completed"
7. Verify rating prompt appears

**Expected**:
- ✅ Delivery confirmed by requester
- ✅ Escrow released automatically
- ✅ Match status updated to "completed"
- ✅ Rating prompt shown

**Acceptance**: Requester can confirm delivery

---

#### TC-DELIVERY-003: Auto-Release Escrow
**Steps**:
1. Create match with delivery marked 24+ hours ago
2. Verify escrow auto-released
3. Verify match status is "completed"
4. Verify traveler receives payment

**Expected**:
- ✅ Escrow auto-released after 24 hours
- ✅ Match status updated
- ✅ Payment processed to traveler
- ✅ Requester notified

**Acceptance**: Auto-release escrow works

---

### Rating Flow

#### TC-RATING-001: Rate Traveler
**Steps**:
1. Login as requester
2. Complete delivery confirmation
3. Rate traveler: `5 stars`
4. Add comment: `Excellent service!`
5. Click "Submit Rating"
6. Verify rating saved
7. Verify traveler's average rating updated

**Expected**:
- ✅ Rating submitted successfully
- ✅ Rating visible on traveler profile
- ✅ Average rating calculated correctly
- ✅ Comment displayed

**Acceptance**: Requester can rate traveler

---

#### TC-RATING-002: Rate Requester
**Steps**:
1. Login as traveler
2. After delivery confirmed
3. Rate requester: `4 stars`
4. Add comment: `Good communication`
5. Click "Submit Rating"
6. Verify rating saved

**Expected**:
- ✅ Rating submitted successfully
- ✅ Rating visible on requester profile
- ✅ Average rating calculated correctly

**Acceptance**: Traveler can rate requester

---

### Dispute Flow

#### TC-DISPUTE-001: Open Dispute
**Steps**:
1. Login as requester
2. Navigate to match with status "delivered"
3. Click "Open Dispute"
4. Select reason: `Item not received`
5. Enter description: `Item was not delivered as described`
6. Upload evidence photos (optional)
7. Click "Submit Dispute"
8. Verify dispute opened
9. Verify match status is "disputed"

**Expected**:
- ✅ Dispute opened successfully
- ✅ Match status updated to "disputed"
- ✅ Dispute visible to admin
- ✅ Traveler notified

**Acceptance**: Requester can open dispute

---

#### TC-DISPUTE-002: Resolve Dispute (Admin)
**Steps**:
1. Login as admin
2. Navigate to disputes dashboard
3. View dispute details
4. Review evidence
5. Click "Resolve Dispute"
6. Select resolution: `Refund Requester`
7. Enter resolution notes
8. Click "Confirm Resolution"
9. Verify refund processed
10. Verify match status updated

**Expected**:
- ✅ Dispute resolved by admin
- ✅ Refund processed (if applicable)
- ✅ Match status updated
- ✅ Both parties notified

**Acceptance**: Admin can resolve disputes

---

## 🔁 End-to-End User Journeys

### Journey 1: Complete Delivery Flow (Happy Path)

**Actors**: Traveler + Requester

**Steps**:
1. **Traveler**: Create trip `San Francisco → Grenada` (7 days from now)
2. **Requester**: Create request `San Francisco → Grenada` (deadline: 10 days)
3. **System**: Auto-match created
4. **Traveler**: Accept match
5. **Requester**: Send message: "Hi, can you help?"
6. **Traveler**: Reply: "Yes, I can help!"
7. **Requester**: Proceed to payment
8. **Requester**: Complete payment ($150 + $22.50 fee)
9. **System**: Match status → "escrow_paid"
10. **Traveler**: Mark delivery complete (upload photos)
11. **System**: Match status → "delivered"
12. **Requester**: Confirm delivery
13. **System**: Escrow released, match status → "completed"
14. **Requester**: Rate traveler (5 stars)
15. **Traveler**: Rate requester (5 stars)

**Expected Duration**: 10-15 minutes

**Acceptance**: Complete flow works end-to-end

---

### Journey 2: Emergency Request Flow

**Actors**: Requester + Multiple Travelers

**Steps**:
1. **Requester**: Create emergency request
2. **System**: Request prioritized in feed
3. **System**: Push notifications sent to nearby travelers
4. **Traveler 1**: Views emergency request
5. **Traveler 1**: Accepts match
6. **Requester**: Proceeds to payment immediately
7. **Traveler 1**: Confirms delivery timeline
8. **Traveler 1**: Marks delivery complete
9. **Requester**: Confirms delivery
10. **System**: Escrow released

**Expected Duration**: 5-10 minutes

**Acceptance**: Emergency flow works with prioritization

---

### Journey 3: Group Buy Flow

**Actors**: Traveler + Multiple Requesters

**Steps**:
1. **Traveler**: Create trip
2. **Traveler**: Create group buy (max 5, 10% discount)
3. **Requester 1**: Joins group buy
4. **Requester 2**: Joins group buy
5. **Requester 3**: Joins group buy
6. **System**: Matches created for all participants
7. **All Requesters**: Complete payments (with discount)
8. **Traveler**: Marks all deliveries complete
9. **All Requesters**: Confirm deliveries
10. **System**: All escrows released

**Expected Duration**: 15-20 minutes

**Acceptance**: Group buy flow works with multiple participants

---

### Journey 4: Dispute Resolution Flow

**Actors**: Requester + Traveler + Admin

**Steps**:
1. **Requester**: Create request
2. **Traveler**: Accept match
3. **Requester**: Complete payment
4. **Traveler**: Mark delivery complete
5. **Requester**: Opens dispute (item not received)
6. **Admin**: Reviews dispute
7. **Admin**: Contacts both parties
8. **Admin**: Resolves dispute (refund requester)
9. **System**: Refund processed
10. **System**: Match status → "cancelled"

**Expected Duration**: 20-30 minutes

**Acceptance**: Dispute resolution flow works

---

## 📱 Mobile QA Scenarios

### iOS Specific

#### MOBILE-IOS-001: App Launch
**Steps**:
1. Install app from TestFlight
2. Launch app
3. Verify splash screen appears
4. Verify app loads within 3 seconds
5. Verify home screen appears

**Expected**:
- ✅ App launches without crashes
- ✅ Splash screen displays correctly
- ✅ Load time < 3 seconds
- ✅ Home screen renders correctly

**Acceptance**: iOS app launches successfully

---

#### MOBILE-IOS-002: Push Notifications
**Steps**:
1. Grant notification permissions
2. Login as requester
3. Create request
4. Login as traveler (different device)
5. Accept match
6. Verify requester receives push notification
7. Tap notification
8. Verify app opens to match details

**Expected**:
- ✅ Push notification received
- ✅ Notification content correct
- ✅ Tapping notification opens app
- ✅ App navigates to correct screen

**Acceptance**: iOS push notifications work

---

#### MOBILE-IOS-003: Deep Linking
**Steps**:
1. Receive notification with deep link
2. Tap notification
3. Verify app opens to specific match/request
4. Test URL scheme: `sparecarry://match/123`
5. Verify deep link handled correctly

**Expected**:
- ✅ Deep links work correctly
- ✅ App navigates to correct content
- ✅ URL scheme registered
- ✅ Fallback handling works

**Acceptance**: iOS deep linking works

---

#### MOBILE-IOS-004: Offline Mode
**Steps**:
1. Open app
2. Enable airplane mode
3. Navigate to feed
4. Verify cached content displays
5. Try to create trip
6. Verify offline message shown
7. Disable airplane mode
8. Verify sync occurs

**Expected**:
- ✅ Cached content displays offline
- ✅ Offline state indicated
- ✅ Sync occurs when online
- ✅ No data loss

**Acceptance**: iOS offline mode works

---

### Android Specific

#### MOBILE-ANDROID-001: App Launch
**Steps**:
1. Install app from Play Store Internal Testing
2. Launch app
3. Verify splash screen appears
4. Verify app loads within 3 seconds
5. Verify home screen appears

**Expected**:
- ✅ App launches without crashes
- ✅ Splash screen displays correctly
- ✅ Load time < 3 seconds
- ✅ Home screen renders correctly

**Acceptance**: Android app launches successfully

---

#### MOBILE-ANDROID-002: Push Notifications
**Steps**:
1. Grant notification permissions
2. Login as requester
3. Create request
4. Login as traveler (different device)
5. Accept match
6. Verify requester receives push notification
7. Tap notification
8. Verify app opens to match details

**Expected**:
- ✅ Push notification received
- ✅ Notification content correct
- ✅ Tapping notification opens app
- ✅ App navigates to correct screen

**Acceptance**: Android push notifications work

---

#### MOBILE-ANDROID-003: Back Button Navigation
**Steps**:
1. Navigate through app screens
2. Use Android back button
3. Verify correct navigation stack
4. Verify back button exits app on home screen

**Expected**:
- ✅ Back button navigates correctly
- ✅ Navigation stack maintained
- ✅ App exits on home screen
- ✅ No unexpected behavior

**Acceptance**: Android back button works correctly

---

#### MOBILE-ANDROID-004: File Upload
**Steps**:
1. Navigate to create request
2. Click "Upload Photo"
3. Select image from gallery
4. Verify image preview appears
5. Submit request
6. Verify image uploaded successfully

**Expected**:
- ✅ Image picker opens
- ✅ Image selected successfully
- ✅ Preview displays correctly
- ✅ Upload completes

**Acceptance**: Android file upload works

---

## 🌐 Web QA Scenarios

### WEB-001: Responsive Design
**Steps**:
1. Open app in browser
2. Test on desktop (1920x1080)
3. Test on tablet (768x1024)
4. Test on mobile (375x667)
5. Verify layout adapts correctly
6. Verify all features accessible

**Expected**:
- ✅ Layout responsive on all screen sizes
- ✅ Features accessible on mobile
- ✅ Touch targets appropriate size
- ✅ No horizontal scrolling

**Acceptance**: Web app is responsive

---

### WEB-002: Browser Compatibility
**Steps**:
1. Test in Chrome (latest)
2. Test in Firefox (latest)
3. Test in Safari (latest)
4. Test in Edge (latest)
5. Verify all features work
6. Verify no console errors

**Expected**:
- ✅ Works in all supported browsers
- ✅ No browser-specific bugs
- ✅ No console errors
- ✅ Consistent behavior

**Acceptance**: Web app works in all browsers

---

### WEB-003: PWA Features
**Steps**:
1. Open app in browser
2. Verify install prompt appears (if applicable)
3. Install as PWA
4. Launch from home screen
5. Verify offline functionality
6. Verify service worker active

**Expected**:
- ✅ Install prompt appears
- ✅ PWA installs successfully
- ✅ Offline functionality works
- ✅ Service worker active

**Acceptance**: PWA features work

---

## 🔐 Security Testing Scenarios

### SEC-001: Input Validation
**Steps**:
1. Navigate to signup
2. Enter SQL injection: `'; DROP TABLE users; --`
3. Enter XSS: `<script>alert('XSS')</script>`
4. Enter extremely long strings (10,000+ chars)
5. Verify all inputs sanitized
6. Verify no SQL injection possible
7. Verify no XSS possible

**Expected**:
- ✅ SQL injection blocked
- ✅ XSS blocked
- ✅ Input length validated
- ✅ Special characters sanitized

**Acceptance**: Input validation prevents attacks

---

### SEC-002: Authentication Bypass
**Steps**:
1. Try to access protected route without login
2. Try to access API endpoint without auth token
3. Try to modify other user's data
4. Verify all requests require authentication
5. Verify authorization checks work

**Expected**:
- ✅ Protected routes require login
- ✅ API endpoints require auth
- ✅ Users cannot access other users' data
- ✅ Authorization enforced

**Acceptance**: Authentication/authorization enforced

---

### SEC-003: Rate Limiting
**Steps**:
1. Send 100+ requests to API endpoint rapidly
2. Verify rate limit triggered
3. Verify 429 status code returned
4. Wait for rate limit window
5. Verify requests work again

**Expected**:
- ✅ Rate limiting active
- ✅ 429 status code returned
- ✅ Rate limit message shown
- ✅ Rate limit resets correctly

**Acceptance**: Rate limiting prevents abuse

---

### SEC-004: File Upload Security
**Steps**:
1. Try to upload executable file (.exe, .sh)
2. Try to upload extremely large file (100MB+)
3. Try to upload file with malicious name
4. Verify only allowed file types accepted
5. Verify file size limits enforced
6. Verify file names sanitized

**Expected**:
- ✅ Only allowed file types accepted
- ✅ File size limits enforced
- ✅ File names sanitized
- ✅ Malicious files rejected

**Acceptance**: File upload security enforced

---

## 💳 Payment Simulation

### PAY-SIM-001: Test Card Payments
**Test Cards**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Insufficient Funds: `4000 0000 0000 9995`
- Expired Card: `4000 0000 0000 0069`

**Steps**:
1. For each test card:
   - Navigate to payment flow
   - Enter card details
   - Complete payment
   - Verify expected result

**Expected**:
- ✅ Success card processes
- ✅ Decline card shows error
- ✅ Insufficient funds shows error
- ✅ Expired card shows error

**Acceptance**: All test card scenarios work

---

### PAY-SIM-002: Webhook Simulation
**Steps**:
1. Create payment intent
2. Use Stripe CLI to simulate webhook events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
3. Verify webhook events processed
4. Verify database updated correctly

**Expected**:
- ✅ Webhook events received
- ✅ Events processed correctly
- ✅ Database updated
- ✅ Signature verification works

**Acceptance**: Webhook simulation works

---

## 🔔 Notifications Simulation

### NOTIF-SIM-001: Push Notification Test
**Steps**:
1. Register device for push notifications
2. Send test notification via API:
   ```bash
   curl -X POST https://staging.sparecarry.com/api/notifications/send-push \
     -H "Content-Type: application/json" \
     -d '{"token":"DEVICE_TOKEN","title":"Test","body":"Hello World"}'
   ```
3. Verify notification received
4. Verify notification content correct

**Expected**:
- ✅ Notification sent successfully
- ✅ Notification received on device
- ✅ Content matches request
- ✅ Tapping notification opens app

**Acceptance**: Push notifications work

---

### NOTIF-SIM-002: Email Notification Test
**Steps**:
1. Trigger email notification (e.g., match created)
2. Check email inbox
3. Verify email received
4. Verify email content correct
5. Verify links work

**Expected**:
- ✅ Email sent successfully
- ✅ Email received
- ✅ Content correct
- ✅ Links functional

**Acceptance**: Email notifications work

---

## 💬 Messaging Load Tests

### MSG-LOAD-001: High Message Volume
**Steps**:
1. Create 10 test conversations
2. Send 100 messages rapidly
3. Verify all messages delivered
4. Verify no message loss
5. Verify realtime updates work

**Expected**:
- ✅ All messages delivered
- ✅ No message loss
- ✅ Realtime updates work
- ✅ Performance acceptable

**Acceptance**: System handles high message volume

---

### MSG-LOAD-002: Concurrent Users
**Steps**:
1. Open 10 browser tabs
2. Login as 10 different users
3. All users send messages simultaneously
4. Verify all messages received
5. Verify no conflicts

**Expected**:
- ✅ All messages delivered
- ✅ No conflicts
- ✅ Performance acceptable
- ✅ No data corruption

**Acceptance**: System handles concurrent users

---

## 🚚 Delivery + Escrow Simulation

### DELIVERY-SIM-001: Complete Delivery Flow
**Steps**:
1. Create match
2. Process payment (escrow)
3. Mark delivery complete
4. Confirm delivery
5. Verify escrow released
6. Verify payment to traveler

**Expected**:
- ✅ Escrow held correctly
- ✅ Delivery marked complete
- ✅ Escrow released on confirmation
- ✅ Payment processed correctly

**Acceptance**: Delivery and escrow flow works

---

### DELIVERY-SIM-002: Auto-Release Escrow
**Steps**:
1. Create match with delivery
2. Wait 24 hours (or simulate time)
3. Verify escrow auto-released
4. Verify match status updated
5. Verify traveler receives payment

**Expected**:
- ✅ Escrow auto-released after 24h
- ✅ Status updated correctly
- ✅ Payment processed
- ✅ Notifications sent

**Acceptance**: Auto-release escrow works

---

## 🆘 Dispute Simulation

### DISPUTE-SIM-001: Open Dispute
**Steps**:
1. Create match with delivery
2. Requester opens dispute
3. Verify dispute created
4. Verify match status updated
5. Verify admin notified

**Expected**:
- ✅ Dispute opened successfully
- ✅ Status updated
- ✅ Admin can view dispute
- ✅ Both parties notified

**Acceptance**: Dispute opening works

---

### DISPUTE-SIM-002: Resolve Dispute
**Steps**:
1. Open dispute
2. Admin reviews dispute
3. Admin resolves dispute (refund)
4. Verify refund processed
5. Verify match status updated

**Expected**:
- ✅ Dispute resolved successfully
- ✅ Refund processed
- ✅ Status updated
- ✅ Parties notified

**Acceptance**: Dispute resolution works

---

## 🧩 Feature Flag Testing Scenarios

### FLAG-001: Enable Push Notifications
**Steps**:
1. Toggle `enable_push_notifications` flag to `on`
2. Verify push notifications work
3. Toggle flag to `off`
4. Verify push notifications disabled

**Expected**:
- ✅ Flag toggles correctly
- ✅ Feature enabled/disabled based on flag
- ✅ Fallback behavior works
- ✅ No errors when flag off

**Acceptance**: Feature flags control features correctly

---

### FLAG-002: Staging-Only Features
**Steps**:
1. Verify `FF_STAGING_ONLY` flag exists
2. Enable flag in staging
3. Verify feature visible in staging
4. Verify feature not visible in production

**Expected**:
- ✅ Flag works in staging
- ✅ Feature hidden in production
- ✅ Environment-specific flags work
- ✅ No cross-environment leakage

**Acceptance**: Environment-specific flags work

---

## 🎯 Acceptance Criteria

### General Criteria
- ✅ All test cases pass
- ✅ No critical bugs
- ✅ Performance acceptable (< 3s load time)
- ✅ No security vulnerabilities
- ✅ All features functional
- ✅ Error handling works
- ✅ Offline mode works (mobile)

### Platform-Specific Criteria

**Web**:
- ✅ Works in all supported browsers
- ✅ Responsive on all screen sizes
- ✅ PWA features work
- ✅ SEO metadata correct

**iOS**:
- ✅ App launches without crashes
- ✅ Push notifications work
- ✅ Deep linking works
- ✅ App Store guidelines met

**Android**:
- ✅ App launches without crashes
- ✅ Push notifications work
- ✅ Back button works correctly
- ✅ Play Store guidelines met

---

## 🧹 Regression Checklist

### Core Features
- [ ] User registration/login
- [ ] Trip creation/editing
- [ ] Request creation/editing
- [ ] Matching algorithm
- [ ] Chat messaging
- [ ] Payment processing
- [ ] Delivery confirmation
- [ ] Rating system
- [ ] Dispute resolution

### Platform Features
- [ ] Web responsive design
- [ ] iOS push notifications
- [ ] Android push notifications
- [ ] Deep linking
- [ ] Offline mode
- [ ] File uploads

### Security
- [ ] Input validation
- [ ] Authentication/authorization
- [ ] Rate limiting
- [ ] File upload security
- [ ] PII redaction

---

## 📸 Screenshot Checklist

### Required Screenshots
- [ ] Login screen
- [ ] Home/Dashboard
- [ ] Trip creation form
- [ ] Request creation form
- [ ] Match details
- [ ] Chat conversation
- [ ] Payment form
- [ ] Delivery confirmation
- [ ] Rating screen
- [ ] Dispute form
- [ ] Profile page
- [ ] Settings page

### Platform-Specific
- [ ] iOS: App Store screenshots (all required sizes)
- [ ] Android: Play Store screenshots (all required sizes)
- [ ] Web: Browser viewport screenshots

---

## 🎥 Screen Recording Checklist

### Required Recordings
- [ ] Complete delivery flow (happy path)
- [ ] Emergency request flow
- [ ] Group buy flow
- [ ] Dispute resolution flow
- [ ] Payment flow (success + failure)
- [ ] Push notification flow
- [ ] Offline mode behavior
- [ ] Error handling scenarios

### Platform-Specific
- [ ] iOS: App launch and navigation
- [ ] Android: App launch and navigation
- [ ] Web: Responsive behavior

---

**Last Updated**: 2024-12-19  
**Version**: 1.0.0

