# SpareCarry

A peer-to-peer delivery platform connecting travelers with people who need items delivered.

## Features

### Core Features
- **Post Requests**: Request items to be delivered with detailed specifications
- **Post Trips**: Travelers can offer spare capacity on their trips
- **Smart Matching**: Automatic matching based on route, dates, and capacity
- **Escrow Payments**: Secure payments held in escrow until delivery confirmation
- **Real-time Chat**: In-app messaging between requesters and travelers
- **Delivery Tracking**: GPS + photo proof for deliveries
- **Rating System**: Rate both parties after delivery

### Premium Features
- **SpareCarry Pro Subscription**: $6.99/month or $59/year
  - 0% platform fees (vs 12-18%)
  - Priority in feed
  - Blue check verification badge

### Advanced Features
- **Dynamic Platform Fees**: 12-18% based on method + user history
  - Volume discounts (up to 3% off)
  - Rating-based discounts (up to 1% off)
- **Insurance Upsell**: Allianz Travel Insurance integration (placeholder)
- **Referral Program**: $50 credit each way after first completed delivery
- **Group Buys**: Multiple requesters can join the same trip
- **Internationalization**: Spanish + French translations (next-intl)
- **Mobile Apps**: iOS/Android via Capacitor

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Magic Link, Google, Apple)
- **Payments**: Stripe (Connect, Identity, Subscriptions)
- **Email**: Resend
- **Internationalization**: next-intl
- **Mobile**: Capacitor
- **Forms**: React Hook Form + Zod

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_MONTHLY_PRICE_ID=price_xxxxx
   STRIPE_YEARLY_PRICE_ID=price_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   RESEND_API_KEY=your_resend_api_key
   NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
   NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id
   NEXT_PUBLIC_APP_URL=https://sparecarry.com
   ```

3. **Set up Supabase**:
   - Run `supabase/schema.sql` in your Supabase SQL editor
   - Run `supabase/storage-setup.sql` for storage buckets
   - Run `supabase/seed-meetup-locations.sql` for meetup locations

4. **Set up Stripe**:
   - Create products and prices for subscriptions
   - Configure webhook endpoint: `/api/webhooks/stripe`
   - See `docs/STRIPE_SUBSCRIPTION_SETUP.md`

5. **Run development server**:
   ```bash
   npm run dev
   ```

## Mobile App Build

1. **Build Next.js app**:
   ```bash
   npm run build
   ```

2. **Sync with Capacitor**:
   ```bash
   npm run capacitor:sync
   ```

3. **Open in native IDE**:
   ```bash
   npm run capacitor:ios      # Opens Xcode
   npm run capacitor:android  # Opens Android Studio
   ```

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── [locale]/          # Internationalized routes
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── home/              # Main app pages
│   └── subscription/      # Subscription pages
├── components/             # React components
│   ├── ui/               # shadcn/ui components
│   ├── feed/             # Feed components
│   ├── chat/             # Chat components
│   ├── forms/            # Form components
│   └── ...
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase clients
│   ├── stripe/           # Stripe clients
│   ├── pricing/          # Pricing logic
│   ├── insurance/        # Insurance integration
│   └── referrals/        # Referral system
├── messages/              # Translation files (next-intl)
├── supabase/             # Database schemas and migrations
└── docs/                 # Documentation

```

## Documentation

- `docs/STRIPE_SUBSCRIPTION_SETUP.md` - Stripe subscription setup
- `docs/AFFILIATE_SETUP.md` - Affiliate links setup
- `docs/FEATURES.md` - Feature documentation

## License

Private - All rights reserved
