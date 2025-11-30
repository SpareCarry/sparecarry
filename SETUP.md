# SpareCarry Setup Guide

## Complete Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (optional)
RESEND_API_KEY=re_...

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
NEXT_PUBLIC_META_PIXEL_ID=...
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Run the SQL script
5. Verify tables were created in the Table Editor

### 4. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Dashboard
3. For Stripe Connect:
   - Enable Connect in your Stripe Dashboard
   - Set up your Connect settings
   - Configure webhook endpoints

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) (or https://sparecarry.com in production)

## Database Schema Overview

### Core Tables

- **users** - Authentication and user roles
- **profiles** - Extended user information, Stripe Connect accounts
- **trips** - Traveler trips (plane/boat) with capacity
- **requests** - Delivery requests with item details
- **matches** - Matches between trips and requests
- **conversations** - Chat threads for matches
- **messages** - Individual messages
- **deliveries** - Delivery proof and tracking
- **meetup_locations** - Pre-seeded locations (20 included)

### Key Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Automatic profile creation on user signup
- ✅ Automatic conversation creation on match
- ✅ Updated_at triggers on all tables
- ✅ Comprehensive indexes for performance
- ✅ Foreign key constraints for data integrity

## Using Supabase Clients

### Server Components

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data } = await supabase.from("trips").select("*");
```

### Client Components

```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data } = await supabase.from("trips").select("*");
```

## Using Stripe

### Server-side

```typescript
import { stripe } from "@/lib/stripe/server";

const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: "usd",
});
```

### Client-side

```typescript
"use client";
import { loadStripe } from "@stripe/stripe-js";

const stripe = await loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
```

## Validation with Zod

All schemas are defined in `lib/zod/schemas.ts`:

```typescript
import { tripSchema, requestSchema } from "@/lib/zod/schemas";

const validatedTrip = tripSchema.parse(tripData);
```

## Code Formatting

Format code:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

## Next Steps

1. Set up authentication flows
2. Create trip posting functionality
3. Implement request creation
4. Build matching algorithm
5. Add messaging UI
6. Integrate Stripe Connect onboarding
7. Build delivery tracking
