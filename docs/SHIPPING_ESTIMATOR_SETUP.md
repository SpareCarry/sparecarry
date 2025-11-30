# Shipping Cost Estimator - Setup Guide

## Overview

The Shipping Cost Estimator allows users to compare courier shipping prices with SpareCarry delivery options, automatically calculate savings, and create jobs directly from estimates.

## Features

- ✅ **Free courier price estimation** (no paid APIs, formula-based)
- ✅ **Free customs cost calculation** (formula-based)
- ✅ **Country presets** (auto-fill dimensions/weight)
- ✅ **SpareCarry price comparison** (plane vs boat)
- ✅ **Visual savings display** (bold green savings percentages)
- ✅ **Auto-fill job creation** (prefill from estimate)

## Files Created

### Data Files

- `assets/data/courierRates.json` - Courier pricing data
- `assets/data/countryCustoms.json` - Customs duty rates by country
- `assets/data/countryPresets.json` - Default dimensions/weight per country

### Utility Files

- `src/utils/courierRates.ts` - Courier price calculations
- `src/utils/customsRates.ts` - Customs cost calculations
- `src/utils/countryPresets.ts` - Country preset helpers
- `src/utils/shippingEstimator.ts` - Main estimation logic

### UI Files

- `app/shipping-estimator/page.tsx` - Shipping estimator screen
- Updated `components/forms/post-request-form.tsx` - Accepts prefill data
- Updated `components/layout/main-layout.tsx` - Added navigation link

### Tests

- `tests/e2e/shipping-estimator.spec.ts` - E2E Playwright tests

## Setup Instructions

### 1. Verify JSON Data Files

Ensure these files exist in your project:

```
assets/data/courierRates.json
assets/data/countryCustoms.json
assets/data/countryPresets.json
```

### 2. Configure TypeScript (if needed)

If TypeScript complains about importing JSON, ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

### 3. Verify Navigation

The shipping estimator should appear in the main navigation menu. Check `components/layout/main-layout.tsx`:

```typescript
{ name: "Shipping Estimator", href: "/shipping-estimator", icon: Calculator }
```

### 4. Test the Feature

#### Manual Testing:

1. Navigate to `/shipping-estimator`
2. Select origin country (e.g., "AU")
3. Select destination country (e.g., "ID") - should auto-fill dimensions
4. Enter weight (if not auto-filled)
5. View price comparison
6. Click "Create SpareCarry Job" button
7. Verify job creation form is pre-filled

#### Automated Testing:

```bash
# Run Playwright tests
npx playwright test tests/e2e/shipping-estimator.spec.ts

# Or run all E2E tests
npx playwright test
```

## Usage

### For Users

1. **Access the Estimator:**
   - Click "Shipping Estimator" in navigation menu
   - Or visit `/shipping-estimator` directly

2. **Enter Package Details:**
   - Select origin and destination countries
   - Dimensions auto-fill based on destination country preset
   - Enter weight
   - (Optional) Enter declared value for customs calculation

3. **View Comparison:**
   - Courier price (with customs if applicable)
   - SpareCarry Plane price + savings
   - SpareCarry Boat price + savings

4. **Create Job:**
   - Click "Create SpareCarry Job from This Estimate"
   - Job creation form auto-fills with all details
   - Complete and submit

### For Developers

#### Modify Courier Rates

Edit `assets/data/courierRates.json`:

```json
{
  "DHL": {
    "base_rate": { "domestic": 12, "international": 18 },
    "per_kg_rate": { "domestic": 4.5, "international": 6.8 }
  }
}
```

#### Modify Customs Rates

Edit `assets/data/countryCustoms.json`:

```json
{
  "AU": { "duty_rate": 0.05, "processing_fee": 15 }
}
```

#### Modify Country Presets

Edit `assets/data/countryPresets.json`:

```json
{
  "AU": {
    "default_length": 20,
    "default_width": 15,
    "default_height": 10,
    "default_weight": 1
  }
}
```

#### Adjust SpareCarry Pricing Formulas

Edit `src/utils/shippingEstimator.ts`:

```typescript
// Plane: 2.0 * weight + 6
export function calculateSpareCarryPlanePrice(weight: number): number {
  const price = 2.0 * weight + 6; // Modify formula here
  return Math.round(price * 100) / 100;
}

// Boat: 0.7 * weight + 4
export function calculateSpareCarryBoatPrice(weight: number): number {
  const price = 0.7 * weight + 4; // Modify formula here
  return Math.round(price * 100) / 100;
}
```

## Formulas

### Courier Price Calculation

```
dimensional_weight = (length * width * height) / 5000
chargeable_weight = max(actual_weight, dimensional_weight)
price = base_rate + (per_kg_rate * chargeable_weight)
```

### Customs Cost

```
customs_cost = declared_value * duty_rate(country) + processing_fee
```

### SpareCarry Prices

```
plane_price = 2.0 * weight + 6
boat_price = 0.7 * weight + 4
```

## API Reference

### `calculateShippingEstimate(input: ShippingEstimateInput): ShippingEstimateResult | null`

Main function to calculate complete shipping estimate.

**Input:**

```typescript
{
  originCountry: string;
  destinationCountry: string;
  length: number; // cm
  width: number; // cm
  height: number; // cm
  weight: number; // kg
  declaredValue: number; // USD
  selectedCourier: string;
}
```

**Output:**

```typescript
{
  courierPrice: number;
  courierTotal: number; // courier + customs
  customsCost: number;
  spareCarryPlanePrice: number;
  spareCarryBoatPrice: number;
  savingsPlane: number;
  savingsBoat: number;
  savingsPercentagePlane: number;
  savingsPercentageBoat: number;
}
```

## Troubleshooting

### JSON Import Errors

If TypeScript errors on JSON imports:

1. Check `tsconfig.json` has `"resolveJsonModule": true`
2. Restart TypeScript server in your IDE

### Auto-fill Not Working

- Check that country code exists in `countryPresets.json`
- Verify destination country selector triggers `handleDestinationChange`

### Prices Not Calculating

- Check browser console for errors
- Verify all required fields are filled
- Check that courier name exists in `courierRates.json`

### Job Creation Not Pre-filling

- Verify URL contains `prefill` query parameter
- Check `PostRequestForm` reads `searchParams.get('prefill')`
- Ensure JSON is properly encoded/decoded

## Testing

### Run E2E Tests

```bash
# Single test file
npx playwright test tests/e2e/shipping-estimator.spec.ts

# With UI
npx playwright test tests/e2e/shipping-estimator.spec.ts --ui

# Debug mode
npx playwright test tests/e2e/shipping-estimator.spec.ts --debug
```

### Test Coverage

- ✅ Open estimator screen
- ✅ Select countries (auto-fill)
- ✅ Calculate prices
- ✅ Assert savings > 20%
- ✅ Navigate to job creation with prefill

## Next Steps

1. **Customize Rates:** Adjust courier/customs rates to match your market
2. **Add More Countries:** Extend country presets and customs data
3. **Enhance UI:** Add charts/graphs for visual comparison
4. **Integration:** Connect to actual job creation API

## Support

For issues or questions:

- Check this documentation
- Review code comments in utility files
- Run Playwright tests to verify functionality
- Check browser console for runtime errors
