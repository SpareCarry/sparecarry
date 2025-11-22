# Quick Test Commands

## 🚀 Run All Automated Tests

```bash
# Test all features automatically
pnpm test:features

# Or use Node.js directly
node --loader ts-node/esm scripts/test-all-features.ts

# Or if tsx is installed
npx tsx scripts/test-all-features.ts
```

## 📋 What Gets Tested Automatically

✅ **Environment Variables** - All required vars are set  
✅ **Database Connectivity** - Can connect to Supabase  
✅ **Stripe Connectivity** - Can connect to Stripe  
✅ **API Endpoints** - All endpoints are accessible  
✅ **Auto-Release Cron** - Cron endpoint works  
✅ **Database Tables** - All tables exist and are queryable  
✅ **Matching Algorithm** - Matching logic works  
✅ **Payment Intent Creation** - Can create Stripe payment intents  
✅ **Notification Services** - Expo/Resend configured  

## ⚡ Quick Commands

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test:all

# Run payment flow tests
pnpm test:payment-flow

# Run feature tests (if tsx is installed)
npx tsx scripts/test-all-features.ts
```

## 💡 Alternative: Use Test Script Directly

If `tsx` isn't installed, you can also run tests manually:

```bash
# Test database
node -e "const { createClient } = require('./lib/supabase/server'); createClient().then(s => s.from('users').select('count').limit(1).then(() => console.log('✅ DB OK')).catch(e => console.error('❌ DB Error:', e)))"

# Test Stripe (if configured)
node -e "const { stripe } = require('./lib/stripe/server'); stripe.balance.retrieve().then(() => console.log('✅ Stripe OK')).catch(e => console.error('❌ Stripe Error:', e))"

# Test API endpoints
curl http://localhost:3000/api/matches/auto-match -X POST -H "Content-Type: application/json" -d '{"test":true}'
```

