# GitHub Secrets Mapping

Complete mapping of GitHub Secrets to environment variables for staging and production deployments.

## Staging Secrets

### Supabase

- `STAGING_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY` (server-only)

### Stripe

- `STAGING_STRIPE_SECRET_KEY` → `STRIPE_SECRET_KEY` (server-only)
- `STAGING_STRIPE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STAGING_STRIPE_WEBHOOK_SECRET` → `STRIPE_WEBHOOK_SECRET` (server-only)

### Sentry

- `STAGING_SENTRY_DSN` → `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` → Used for sourcemap uploads
- `SENTRY_ORG` → Sentry organization slug
- `SENTRY_PROJECT_STAGING` → Sentry project slug for staging

### Feature Flags (Unleash)

- `STAGING_UNLEASH_URL` → `NEXT_PUBLIC_UNLEASH_URL`
- `STAGING_UNLEASH_CLIENT_KEY` → `NEXT_PUBLIC_UNLEASH_CLIENT_KEY`

### App URLs

- `STAGING_APP_URL` → `NEXT_PUBLIC_APP_URL`

### iOS Deployment

- `STAGING_APPLE_ID` → `APPLE_ID`
- `STAGING_APPLE_TEAM_ID` → `APPLE_TEAM_ID`
- `STAGING_APP_STORE_CONNECT_KEY_ID` → `APP_STORE_CONNECT_API_KEY_ID`
- `STAGING_APP_STORE_CONNECT_ISSUER_ID` → `APP_STORE_CONNECT_ISSUER_ID`
- `STAGING_APP_STORE_CONNECT_KEY` → Base64-encoded `.p8` key file
- `STAGING_IOS_PROVISIONING_PROFILE_NAME` → `IOS_PROVISIONING_PROFILE_NAME`

### Android Deployment

- `STAGING_ANDROID_KEYSTORE` → Base64-encoded keystore file
- `STAGING_KEYSTORE_PASSWORD` → `KEYSTORE_PASSWORD`
- `STAGING_KEY_PASSWORD` → `KEY_PASSWORD`
- `STAGING_KEY_ALIAS` → `KEY_ALIAS`
- `STAGING_GOOGLE_PLAY_JSON` → Base64-encoded service account JSON

### Vercel (Web Deployment)

- `VERCEL_TOKEN` → Vercel authentication token
- `VERCEL_ORG_ID` → Vercel organization ID
- `VERCEL_PROJECT_ID_STAGING` → Vercel project ID for staging

## Production Secrets

### Supabase

- `PRODUCTION_SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `PRODUCTION_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe

- `PRODUCTION_STRIPE_SECRET_KEY` → `STRIPE_SECRET_KEY`
- `PRODUCTION_STRIPE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `PRODUCTION_STRIPE_WEBHOOK_SECRET` → `STRIPE_WEBHOOK_SECRET`

### Sentry

- `PRODUCTION_SENTRY_DSN` → `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_PROJECT_PRODUCTION` → Sentry project slug for production

### Feature Flags

- `PRODUCTION_UNLEASH_URL` → `NEXT_PUBLIC_UNLEASH_URL`
- `PRODUCTION_UNLEASH_CLIENT_KEY` → `NEXT_PUBLIC_UNLEASH_CLIENT_KEY`

### App URLs

- `PRODUCTION_APP_URL` → `NEXT_PUBLIC_APP_URL`

### iOS Deployment

- `PRODUCTION_APPLE_ID` → `APPLE_ID`
- `PRODUCTION_APPLE_TEAM_ID` → `APPLE_TEAM_ID`
- `PRODUCTION_APP_STORE_CONNECT_KEY_ID` → `APP_STORE_CONNECT_API_KEY_ID`
- `PRODUCTION_APP_STORE_CONNECT_ISSUER_ID` → `APP_STORE_CONNECT_ISSUER_ID`
- `PRODUCTION_APP_STORE_CONNECT_KEY` → Base64-encoded `.p8` key file
- `PRODUCTION_IOS_PROVISIONING_PROFILE_NAME` → `IOS_PROVISIONING_PROFILE_NAME`

### Android Deployment

- `PRODUCTION_ANDROID_KEYSTORE` → Base64-encoded keystore file
- `PRODUCTION_KEYSTORE_PASSWORD` → `KEYSTORE_PASSWORD`
- `PRODUCTION_KEY_PASSWORD` → `KEY_PASSWORD`
- `PRODUCTION_KEY_ALIAS` → `KEY_ALIAS`
- `PRODUCTION_GOOGLE_PLAY_JSON` → Base64-encoded service account JSON

### Vercel

- `VERCEL_PROJECT_ID_PRODUCTION` → Vercel project ID for production

## How to Set Secrets

1. Go to GitHub repository
2. Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Enter name and value
5. Click "Add secret"

## Encoding Binary Files

### iOS .p8 Key File

```bash
base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy
# Paste into STAGING_APP_STORE_CONNECT_KEY secret
```

### Android Keystore

```bash
base64 -i release.keystore | pbcopy
# Paste into STAGING_ANDROID_KEYSTORE secret
```

### Google Play Service Account JSON

```bash
base64 -i service-account.json | pbcopy
# Paste into STAGING_GOOGLE_PLAY_JSON secret
```

## Verification

After setting secrets, verify they're accessible in workflows:

1. Check workflow logs
2. Verify environment variables are set
3. Test deployment to staging first

## Security Notes

- Never commit secrets to repository
- Use separate secrets for staging and production
- Rotate keys periodically
- Use least privilege principle
- Review secret access regularly
