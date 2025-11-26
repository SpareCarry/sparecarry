# Tier-1 Features Documentation

## Overview

This document describes the Tier-1 feature set for SpareCarry, including implementation details, usage, and configuration.

## Features

### 1. Item Safety Score
Automatically computes a safety score (0-100) for each listing based on:
- Item category
- Presence of batteries/liquids
- Declared value
- Weight and dimensions
- Number of photos (more photos = higher score)

**Location:** `modules/tier1Features/safety/`

**Usage:**
```typescript
import { useSafetyScore } from '@/modules/tier1Features/safety';
import { computeSafetyScore } from '@/modules/tier1Features/safety';

// In a component
const { score, reasons, saveScore } = useSafetyScore(listingId, listingDetails);

// Or compute directly
const result = computeSafetyScore({
  title: 'iPhone',
  category: 'electronics',
  hasBatteries: true,
  photoCount: 3,
});
```

### 2. Auto Category Detection
Automatically detects item category from title and description using keyword matching.

**Location:** `modules/tier1Features/categories/`

**Supported Categories:**
- electronics
- clothing
- shoes
- cosmetics
- tools
- books
- food

**Usage:**
```typescript
import { useAutoCategory } from '@/modules/tier1Features/categories';

const { category, confidence } = useAutoCategory(title, description);
```

### 3. Parcel Photo Verification
Requires minimum 3 photos (front, side, size-for-scale) with validation and compression.

**Location:** `modules/tier1Features/photos/`

**Requirements:**
- Minimum 3 photos
- Maximum 6 photos
- File size < 5MB
- Formats: JPEG, PNG, WebP

**Usage:**
```tsx
import { PhotoUploader } from '@/modules/tier1Features/photos';

<PhotoUploader
  photos={photos}
  onPhotosChange={setPhotos}
  minPhotos={3}
  maxPhotos={6}
/>
```

### 4. Trusted Traveller System
Automatically awards "Trusted Traveller" badge after 3 successful job completions.

**Location:** `modules/tier1Features/badges/`

**Database:**
- `badges` table: Available badges
- `user_badges` table: User badge assignments
- `traveller_stats` table: Tracks completed jobs
- SQL trigger: Auto-awards badge when `completed_jobs_count >= 3`

**Usage:**
```typescript
import { useUserBadges } from '@/modules/tier1Features/badges';

const { data: badges } = useUserBadges(userId);
```

**Badge Awarding:**
- Server-side (recommended): SQL trigger automatically awards badge
- Client-side: Use `checkAndAwardTrustedTraveller()` function

### 5. Real-Time ETA Estimate

**Plane ETA:**
- Auto-calculated using Haversine distance formula
- Assumes 800 km/h average speed + 4 hour handling buffer
- Formula: `(distance / 800) + 4 hours`

**Boat ETA:**
- **MANUAL INPUT ONLY** - User must specify days
- Field: `boatEtaDays` (number of days)
- No automatic calculation

**Location:** `modules/tier1Features/eta/`

**Usage:**
```typescript
import { useEtaEstimator } from '@/modules/tier1Features/eta';

const eta = useEtaEstimator(
  'plane', // or 'boat'
  fromLocation,
  toLocation,
  boatEtaDays // Required for boat, undefined for plane
);
```

### 6. "Is this Allowed to Carry?" Rules Engine

Validates items against shipping rules and returns warnings/restrictions.

**Location:** `modules/tier1Features/rules/`

**Rules:**
- Batteries: Allowed with warnings
- Liquids: Allowed if < 100ml, restricted if larger
- Food: Allowed with customs warnings
- Medicines: Allowed with documentation requirements
- Dangerous goods: NOT ALLOWED
- Weapons: NOT ALLOWED

**Usage:**
```typescript
import { isAllowedToCarry } from '@/modules/tier1Features/rules';

const result = isAllowedToCarry({
  category: 'electronics',
  hasBatteries: true,
  liquidVolume: 150,
});

if (!result.allowed) {
  // Show restrictions
} else if (result.warnings.length > 0) {
  // Show warnings
}
```

## Database Schema

Run `supabase/tier1_schema.sql` in your Supabase SQL Editor to create all required tables:

```sql
-- Tables created:
- badges
- user_badges
- listing_photos
- listing_safety
- traveller_stats

-- Triggers created:
- trigger_check_trusted_traveller (auto-awards badge)
```

## Integration with Forms

### PostRequestForm Integration

The Tier-1 features are integrated via the `Tier1Integration` component:

```tsx
import { Tier1Integration } from '@/components/forms/tier1-integration';

<Tier1Integration
  title={title}
  description={description}
  category={category}
  onCategoryChange={setCategory}
  declaredValue={value}
  weight={weight}
  dimensions={{ length, width, height }}
  photos={photos}
  travelMethod="plane"
  fromLocation={from}
  toLocation={to}
  listingId={listingId}
/>
```

This component automatically:
- Detects category
- Computes safety score
- Checks allowed rules
- Estimates ETA (for plane)

### Boat ETA Manual Input

For boat travel, add a manual input field:

```tsx
{travelMethod === 'boat' && (
  <div className="space-y-2">
    <Label htmlFor="boat_eta_days">Estimated Delivery Time (Days) *</Label>
    <Input
      id="boat_eta_days"
      type="number"
      min="1"
      {...register("boat_eta_days", { valueAsNumber: true })}
      placeholder="Enter number of days"
    />
    <p className="text-xs text-slate-500">
      Manual input required for boat travel. Estimate based on route and vessel speed.
    </p>
  </div>
)}
```

## Server-Side Badge Awarding

### Recommended: SQL Trigger (Already Implemented)

The SQL schema includes a trigger that automatically awards the "Trusted Traveller" badge when `traveller_stats.completed_jobs_count >= 3`.

### Alternative: Server Script

If you need more control, create a server-side function:

```typescript
// lib/badges/award-badge.ts
import { createClient } from '@supabase/supabase-js';

export async function awardTrustedTravellerBadge(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key
  );

  // Increment completed jobs count
  const { data: stats } = await supabase
    .from('traveller_stats')
    .select('completed_jobs_count')
    .eq('user_id', userId)
    .single();

  const newCount = (stats?.completed_jobs_count || 0) + 1;

  await supabase
    .from('traveller_stats')
    .upsert({
      user_id: userId,
      completed_jobs_count: newCount,
      last_completed_at: new Date().toISOString(),
    });

  // Trigger will automatically award badge if count >= 3
}
```

Call this function when a job is marked as completed.

## Configuration

### Adjusting Safety Scoring Rules

Edit `modules/tier1Features/safety/scoringRules.ts`:

```typescript
// Modify weights
if (details.hasBatteries) {
  score -= 20; // Adjust penalty
}

// Add new rules
if (details.category === 'perishable') {
  score -= 15;
}
```

### Adding New Categories

Edit `modules/tier1Features/categories/categoryRules.ts`:

```typescript
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // ... existing categories
  furniture: ['chair', 'table', 'sofa', 'furniture'],
};
```

### Modifying Allowed Rules

Edit `modules/tier1Features/rules/isAllowedRules.ts`:

```typescript
// Add new restriction
if (details.weight > 50) {
  allowed = false;
  restrictions.push('Items over 50kg require special handling');
}
```

### Adjusting ETA Calculations

Edit `modules/tier1Features/eta/useEtaEstimator.ts`:

```typescript
// Change plane speed assumption
const planeSpeed = 800; // km/h

// Change handling buffer
const handlingBuffer = 4; // hours
```

## Testing

### Playwright Tests

Run Tier-1 feature tests:

```bash
# All Tier-1 tests
npx playwright test tests/e2e/item-safety.spec.ts
npx playwright test tests/e2e/photo-upload.spec.ts
npx playwright test tests/e2e/trusted-traveller.spec.ts
npx playwright test tests/e2e/auto-category.spec.ts
```

### Manual Testing

1. **Safety Score:**
   - Create listing with batteries → should show reduced score
   - Add photos → should increase score
   - Set high value → should show warning

2. **Category Detection:**
   - Enter "iPhone case" → should suggest "electronics"
   - Enter "Nike shoes" → should suggest "shoes"

3. **Photo Upload:**
   - Upload < 3 photos → should show error
   - Upload 3+ photos → should accept

4. **Badge System:**
   - Complete 3 jobs → should auto-award badge
   - Check profile → should display badge

5. **ETA:**
   - Select plane → should show auto-calculated ETA
   - Select boat → should show manual input field

## Troubleshooting

### Safety Score Not Computing

- Check that `listingDetails` includes required fields
- Verify `listingId` is set if saving to database
- Check browser console for errors

### Category Not Detecting

- Ensure title/description contains keywords
- Check confidence threshold (default 0.7)
- Add more keywords to `categoryRules.ts`

### Badge Not Awarding

- Verify SQL trigger is installed: `trigger_check_trusted_traveller`
- Check `traveller_stats` table for correct count
- Verify badge exists in `badges` table with slug `trusted_traveller`

### Photos Not Uploading

- Check file size < 5MB
- Verify file format (JPEG, PNG, WebP)
- Ensure Supabase Storage bucket exists and RLS allows uploads

## Next Steps

1. **Run SQL Schema:**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/tier1_schema.sql
   ```

2. **Install Dependencies (if needed):**
   ```bash
   # For Expo photo features (if not already installed)
   pnpm add expo-image-picker expo-image-manipulator
   ```

3. **Integrate into Forms:**
   - Add `Tier1Integration` component to `PostRequestForm`
   - Add boat ETA manual input field
   - Test each feature

4. **Enable Badge Triggering:**
   - SQL trigger is already in schema
   - Ensure job completion updates `traveller_stats`

## Support

For questions or issues:
- Check this documentation
- Review code comments in module files
- Check Playwright tests for usage examples

