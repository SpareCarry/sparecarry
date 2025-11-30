# Release Notes Template

**Version**: `X.Y.Z`  
**Release Date**: `YYYY-MM-DD`  
**Environment**: `staging` | `production`  
**Build Numbers**: iOS `XXX`, Android `XXX`

---

## 🚀 What's New

### Major Features

- **Feature Name**: Brief description of the feature and its benefits
  - Sub-feature or detail
  - Another detail
- **Another Feature**: Description

### Minor Features

- Small enhancement or improvement
- Another small enhancement

### Example

```markdown
## 🚀 What's New

### Major Features

- **Group Buy Matching**: Travelers can now create group buys to combine multiple requests and offer discounts
  - Automatic discount calculation based on participant count
  - Real-time participant updates via Realtime subscriptions
- **Enhanced Chat System**: Improved messaging with read receipts and typing indicators
  - Message status indicators (sent, delivered, read)
  - Typing indicators for better conversation flow

### Minor Features

- Added dark mode support for mobile apps
- Improved search filters for trips and requests
```

---

## 🛠 Bug Fixes

### Critical Fixes

- **Issue**: Brief description of the bug
  - **Impact**: What was affected
  - **Resolution**: How it was fixed

### High Priority Fixes

- **Issue**: Description
  - **Impact**: Description
  - **Resolution**: Description

### Other Fixes

- Fixed issue with...
- Resolved problem where...

### Example

```markdown
## 🛠 Bug Fixes

### Critical Fixes

- **Payment Intent Creation**: Fixed issue where payment intents were not being created for matches
  - **Impact**: Users could not proceed to payment after matching
  - **Resolution**: Fixed Stripe API integration and added proper error handling

### High Priority Fixes

- **Chat Message Delivery**: Fixed messages not appearing in real-time
  - **Impact**: Users had to refresh to see new messages
  - **Resolution**: Fixed Realtime subscription connection handling

### Other Fixes

- Fixed crash when viewing empty trip list
- Resolved issue with profile image upload failing on iOS
- Fixed Android keyboard covering input fields
```

---

## ⚙️ Improvements

### Performance

- Improved page load times by X%
- Optimized database queries for faster match results
- Reduced bundle size by X KB

### User Experience

- Enhanced UI/UX improvements
- Better error messages
- Improved accessibility

### Developer Experience

- Updated dependencies
- Improved build times
- Better error logging

### Example

```markdown
## ⚙️ Improvements

### Performance

- Improved trip search results load time by 40%
- Optimized Supabase queries with better indexing
- Reduced JavaScript bundle size by 150 KB (gzip)

### User Experience

- Redesigned match confirmation flow for clarity
- Added loading states for all async operations
- Improved error messages with actionable guidance

### Developer Experience

- Upgraded Next.js to 14.2.5
- Improved TypeScript type coverage to 100%
- Added comprehensive health check endpoint
```

---

## 🧪 Known Issues

### High Priority

- **Issue**: Description
  - **Workaround**: If available
  - **ETA**: Expected fix date

### Medium Priority

- **Issue**: Description
  - **Workaround**: If available

### Low Priority

- Minor issue description

### Example

```markdown
## 🧪 Known Issues

### High Priority

- **iOS Push Notifications**: Some users report not receiving push notifications on iOS 17.0
  - **Workaround**: Enable notifications manually in Settings
  - **ETA**: Fixed in v1.2.0 (expected 2024-01-15)

### Medium Priority

- **Android Back Button**: Back button on Android sometimes navigates incorrectly
  - **Workaround**: Use in-app navigation buttons
- **Stripe Webhook Delay**: Webhook events may take up to 30 seconds to process
  - **Workaround**: Refresh payment status manually

### Low Priority

- Profile images may take a few seconds to load on slow connections
- Some emojis may not render correctly in chat messages
```

---

## 📱 Mobile (iOS + Android) Notes

### iOS

- **Minimum Version**: iOS 15.0+
- **TestFlight Build**: `XXX`
- **App Store Build**: `XXX` (if applicable)
- **New Permissions**: None
- **Breaking Changes**: None
- **Installation Notes**: Any special instructions

### Android

- **Minimum Version**: Android 8.0 (API 26)+
- **Play Store Build**: `XXX`
- **Target SDK**: 34
- **New Permissions**: None
- **Breaking Changes**: None
- **Installation Notes**: Any special instructions

### Example

```markdown
## 📱 Mobile (iOS + Android) Notes

### iOS

- **Minimum Version**: iOS 15.0+
- **TestFlight Build**: `123`
- **App Store Build**: `N/A` (staging only)
- **New Permissions**: None
- **Breaking Changes**: None
- **Installation Notes**:
  - First-time installers may need to enable notifications in Settings
  - Requires internet connection for initial setup

### Android

- **Minimum Version**: Android 8.0 (API 26)+
- **Play Store Build**: `456`
- **Target SDK**: 34
- **New Permissions**: None
- **Breaking Changes**: None
- **Installation Notes**:
  - APK size: 45 MB
  - Requires Google Play Services for push notifications
```

---

## 🌐 Web Notes

### Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari, Chrome Mobile

### Performance

- Lighthouse Score: XX/100
- First Contentful Paint: X.Xs
- Largest Contentful Paint: X.Xs

### Breaking Changes

- None (or list any)

### Example

```markdown
## 🌐 Web Notes

### Browser Support

- Chrome/Edge: Latest 2 versions (recommended)
- Firefox: Latest 2 versions
- Safari: Latest 2 versions (macOS and iOS)
- Mobile browsers: iOS Safari 15+, Chrome Mobile 100+

### Performance

- Lighthouse Score: 92/100
- First Contentful Paint: 1.2s
- Largest Contentful Paint: 2.5s
- Time to Interactive: 3.1s

### Breaking Changes

- None

### Known Web Issues

- Safari may show console warnings for some Web APIs (non-blocking)
```

---

## 💬 User Impact Summary

### Who is Affected

- All users
- New users only
- Existing users only
- Specific user groups

### Action Required

- None
- Update app from App Store/Play Store
- Clear cache and refresh
- Re-login required

### Migration Notes

- Automatic migration (no user action)
- Manual steps required

### Example

```markdown
## 💬 User Impact Summary

### Who is Affected

- **All Users**: New matching algorithm affects all trip/request matching
- **New Users**: Improved onboarding flow
- **Existing Users**: No action required, improvements are automatic

### Action Required

- **iOS Users**: Update to latest version from TestFlight
- **Android Users**: Update to latest version from Play Store Internal Testing
- **Web Users**: Clear browser cache if experiencing issues

### Migration Notes

- All data migrations are automatic
- No user action required
- Existing matches and conversations are preserved
```

---

## 🔧 Developer Notes

### Dependencies Updated

- `package-name`: `old-version` → `new-version`
- `another-package`: `old-version` → `new-version`

### Environment Variables

- New variables required:
  - `NEW_ENV_VAR=value`
- Deprecated variables:
  - `OLD_ENV_VAR` (no longer used)

### Database Changes

- New migrations: `YYYYMMDD_description.sql`
- Schema changes: List any
- Data migrations: List any

### API Changes

- New endpoints: `/api/new-endpoint`
- Deprecated endpoints: `/api/old-endpoint` (will be removed in vX.Y.Z)
- Breaking changes: List any

### Example

```markdown
## 🔧 Developer Notes

### Dependencies Updated

- `@supabase/supabase-js`: `2.38.0` → `2.39.0`
- `next`: `14.1.0` → `14.2.5`
- `stripe`: `13.0.0` → `14.10.0`

### Environment Variables

- New variables required:
  - `NEXT_PUBLIC_UNLEASH_URL=https://unleash.example.com`
  - `NEXT_PUBLIC_UNLEASH_CLIENT_KEY=your-key`
- Deprecated variables:
  - None

### Database Changes

- New migrations: `20241219_add_group_buys_table.sql`
- Schema changes:
  - Added `group_buys` table
  - Added `group_buy_id` column to `matches` table
- Data migrations: None

### API Changes

- New endpoints:
  - `POST /api/group-buys/create` - Create a group buy
  - `POST /api/group-buys/join` - Join a group buy
- Deprecated endpoints: None
- Breaking changes: None
```

---

## 🔍 QA Checklist

### Pre-Release

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E tests passing (Playwright)
- [ ] Mobile E2E tests passing (Detox)
- [ ] Type coverage: 100%
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed

### Post-Release

- [ ] Health check endpoint returns OK
- [ ] Sentry error rate < 0.1%
- [ ] Stripe webhooks processing correctly
- [ ] Push notifications working (iOS + Android)
- [ ] Feature flags configured correctly
- [ ] Database migrations applied successfully
- [ ] No critical errors in logs

### Example

```markdown
## 🔍 QA Checklist

### Pre-Release

- [x] All unit tests passing (Vitest)
- [x] All integration tests passing
- [x] E2E tests passing (Playwright)
- [x] Mobile E2E tests passing (Detox)
- [x] Type coverage: 100%
- [x] Security audit passed
- [x] Performance benchmarks met
- [x] Accessibility audit passed (WCAG 2.1 AA)

### Post-Release

- [x] Health check endpoint returns OK (`/api/health`)
- [x] Sentry error rate < 0.1%
- [x] Stripe webhooks processing correctly
- [x] Push notifications working (iOS + Android)
- [x] Feature flags configured correctly
- [x] Database migrations applied successfully
- [x] No critical errors in logs
```

---

## 🧩 Feature Flag Changes

### New Flags

- `flag-name`: Description, default state (`on`/`off`)

### Flag State Changes

- `flag-name`: `off` → `on` (or vice versa)
- Reason for change

### Deprecated Flags

- `old-flag-name`: Will be removed in vX.Y.Z

### Example

```markdown
## 🧩 Feature Flag Changes

### New Flags

- `enable_group_buys`: Enables group buy matching feature, default `on` (staging), `off` (production)
- `new_match_algorithm`: New matching algorithm with improved accuracy, default `off`

### Flag State Changes

- `enable_push_notifications`: `off` → `on` (staging only)
  - Reason: Push notifications are now stable and ready for beta testing
- `dispute_refund_flow`: `off` → `on` (staging only)
  - Reason: Dispute resolution flow is ready for testing

### Deprecated Flags

- `legacy_payment_flow`: Will be removed in v1.3.0 (replaced by new payment system)
```

---

## ⏪ Rollback Instructions

### When to Rollback

- Critical bugs affecting > 10% of users
- Security vulnerabilities
- Data corruption issues
- Service outages

### Rollback Steps

#### Web (Vercel)

1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find previous stable deployment
4. Click "Promote to Production"
5. Verify health check endpoint

#### iOS (TestFlight)

1. Remove latest build from TestFlight
2. Notify testers of previous build number
3. Monitor Sentry for error reduction

#### Android (Play Store)

1. Go to Play Console
2. Navigate to Internal Testing track
3. Deactivate current release
4. Activate previous release
5. Notify testers

#### Database

1. Run rollback script: `pnpm db:rollback:staging`
2. Verify database state
3. Check data integrity

### Example

```markdown
## ⏪ Rollback Instructions

### When to Rollback

- Critical bugs affecting > 10% of users
- Security vulnerabilities
- Data corruption issues
- Service outages lasting > 5 minutes

### Rollback Steps

#### Web (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to `sparecarry-staging` project
3. Go to Deployments tab
4. Find previous stable deployment (e.g., `abc123`)
5. Click "Promote to Production"
6. Verify: `curl https://staging.sparecarry.com/api/health`

#### iOS (TestFlight)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to TestFlight → Builds
3. Remove latest build (v1.1.0 build 123)
4. Notify testers: "Please use build 122"
5. Monitor Sentry for error reduction

#### Android (Play Store)

1. Go to [Play Console](https://play.google.com/console)
2. Navigate to Internal Testing → Releases
3. Deactivate current release (v1.1.0)
4. Activate previous release (v1.0.9)
5. Notify testers via email

#### Database

1. Run rollback: `pnpm db:rollback:staging`
2. Verify: Check table counts match previous state
3. Check data integrity: `SELECT COUNT(*) FROM matches WHERE status = 'completed'`
```

---

## Formatting Conventions

### Markdown

- Use `##` for main sections
- Use `###` for subsections
- Use `-` for unordered lists
- Use `**bold**` for emphasis
- Use `` `code` `` for inline code
- Use ``code blocks` for multi-line code

### Emojis

- Use emojis consistently for section headers
- Keep emoji usage professional
- Don't overuse emojis in body text

### Semantic Versioning

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, backward compatible

### Example Versioning

```
v1.0.0 → v1.0.1 (patch: bug fix)
v1.0.1 → v1.1.0 (minor: new feature)
v1.1.0 → v2.0.0 (major: breaking change)
```

---

## Automated Generation Compatibility

### Fastlane

This template is compatible with Fastlane's `changelog_from_git_commits` action:

```ruby
changelog = changelog_from_git_commits(
  between: ["v1.0.0", "HEAD"],
  pretty: "- %s"
)
```

### GitHub Releases

This template can be used directly in GitHub Release notes. Use the template and fill in:

- Version number
- Release date
- Build numbers
- Sections based on commits/changes

### CI/CD Integration

```yaml
# .github/workflows/release.yml
- name: Generate Release Notes
  run: |
    node scripts/release-notes.js v1.0.0 HEAD > RELEASE_NOTES.md
    # Then use RELEASE_NOTES.md as release body
```

---

## Template Usage

1. **Copy this template** for each release
2. **Fill in version and date** at the top
3. **Update sections** based on changes
4. **Remove unused sections** if not applicable
5. **Review and edit** before publishing
6. **Publish** to:
   - GitHub Releases
   - App Store Connect (Release Notes)
   - Play Console (Release Notes)
   - Internal team communication

---

**Last Updated**: 2024-12-19  
**Template Version**: 1.0.0
