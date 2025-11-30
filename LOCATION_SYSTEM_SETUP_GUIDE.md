# Location System - Complete Setup Guide

## ✅ Implementation Status

The complete Location System has been implemented with all requested features.

## 📋 Quick Start Checklist

### 1. Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_GEOAPIFY_KEY=d6dec9413f4f495295e42d4158a3803d
```

**Note:** The key is already configured. For production, get your own from https://www.geoapify.com (free tier: 3000 requests/day).

### 2. Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/add-location-fields.sql
-- This adds location fields to trips and requests tables
```

### 3. Verify Installation

```bash
# Check TypeScript compilation
pnpm tsc --noEmit

# Run tests
npx playwright test tests/e2e/location-flow.spec.ts
```

## 🎯 Features Implemented

### Core Features

- ✅ **Autocomplete** - Geoapify-powered with debouncing
- ✅ **Marina/Port Filtering** - Client-side keyword detection + API filtering
- ✅ **Map Preview** - Static map with marker for selected location
- ✅ **Reverse Geocoding** - Convert coordinates to place name
- ✅ **Current Location** - GPS location button with permission handling
- ✅ **Draggable Map Picker** - Fullscreen map with draggable pin
- ✅ **Snap to Marina** - Optional snap-to-nearest-marina feature

### Integration

- ✅ **Form Integration** - LocationFieldGroup in Create Request form
- ✅ **Database Schema** - Location fields in trips/requests tables
- ✅ **RLS Policies** - Existing policies cover new fields
- ✅ **Spatial Indexes** - Geospatial indexes for efficient queries

### Architecture

- ✅ **Provider Abstraction** - Easy to switch providers (Geoapify → Google Places)
- ✅ **Configuration** - Centralized config in `config/location.config.ts`
- ✅ **TypeScript Types** - Fully typed throughout
- ✅ **Error Handling** - Graceful fallbacks and error boundaries

## 📁 Files Created

### Configuration & Core

- `config/location.config.ts` - Configuration (keywords, limits, debounce)
- `lib/locationProvider.ts` - Provider abstraction layer
- `lib/geoapify.ts` - Geoapify API implementation

### Components

- `components/location/LocationInput.tsx` - Autocomplete input
- `components/location/LocationMapPreview.tsx` - Map preview
- `components/location/UseCurrentLocationButton.tsx` - GPS button
- `components/location/LocationDraggablePicker.tsx` - Map picker
- `components/location/LocationFieldGroup.tsx` - Complete location group
- `components/location/index.ts` - Exports

### Database

- `supabase/migrations/add-location-fields.sql` - Schema migration

### Tests & Docs

- `tests/e2e/location-flow.spec.ts` - E2E tests
- `docs/LOCATION.md` - Full documentation
- `LOCATION_SYSTEM_IMPLEMENTATION.md` - Implementation summary
- `LOCATION_SYSTEM_SETUP_GUIDE.md` - This file

## 🚀 How to Use

### In Forms

The location system is already integrated into `PostRequestForm`. To use in other forms:

```tsx
import { LocationFieldGroup } from "@/components/location";
import { Place } from "@/lib/locationProvider";

const [departure, setDeparture] = useState<Place | null>(null);

<LocationFieldGroup
  label="Departure Location"
  value={departure}
  onChange={setDeparture}
  showOnlyMarinas={true}
  showMapPreview={true}
  showCurrentLocation={true}
  showMapPicker={true}
  required
/>;
```

### Marina Filtering

```tsx
<LocationFieldGroup
  showOnlyMarinas={true} // Filter to marinas/ports only
  allowFallbackToAny={true} // Show all if no marinas found
/>
```

### Current Location

```tsx
<UseCurrentLocationButton
  onLocationFound={(place) => {
    console.log("Location:", place.name, place.lat, place.lon);
    if (place.category === "marina") {
      console.log("Found a marina!");
    }
  }}
  showOnlyMarinas={false}
/>
```

## 🔧 Customization

### Change Marina Keywords

Edit `config/location.config.ts`:

```typescript
MARINA_KEYWORDS: [
  "marina",
  "harbor",
  "port",
  // Add your keywords here
];
```

### Adjust Debounce Delay

```typescript
DEFAULT_DEBOUNCE_MS: 500; // Increase for slower networks
```

### Change Autocomplete Limit

```typescript
DEFAULT_AUTOCOMPLETE_LIMIT: 10; // Show more results
```

## 🔄 Switching Providers

To switch from Geoapify to Google Places:

1. **Create** `lib/googlePlaces.ts` implementing same interface as `lib/geoapify.ts`
2. **Update** `lib/locationProvider.ts` to import from `googlePlaces.ts` instead
3. **No UI changes needed!** All components work unchanged

See `docs/LOCATION.md` for detailed instructions.

## 🧪 Testing

### Manual Testing

1. Navigate to `/home/post-request`
2. Use location inputs:
   - Type "marina" → see autocomplete
   - Toggle marina filter → results filtered
   - Click "Use Current Location" → GPS location
   - Click "Map" button → open map picker
3. Submit form → verify location data saved

### Automated Testing

```bash
# Location E2E tests
npx playwright test tests/e2e/location-flow.spec.ts

# All tests
npx playwright test
```

## 🐛 Troubleshooting

### Autocomplete Not Working

- Check `NEXT_PUBLIC_GEOAPIFY_KEY` is set
- Verify network connectivity
- Check browser console for errors
- Minimum query length is 2 characters

### Marina Filter Too Restrictive

- Edit `MARINA_KEYWORDS` in `config/location.config.ts`
- Enable `allowFallbackToAny={true}`
- Check client-side filter logic in `lib/geoapify.ts`

### GPS Not Working

- Requires HTTPS (or localhost)
- Check browser permissions
- Verify `navigator.geolocation` is available
- Check console for permission errors

### Map Preview Not Loading

- Check Geoapify static map API key
- Verify location has valid lat/lon
- Fallback background appears on error

## 📊 Database Fields Added

### Requests Table

```sql
departure_location text
departure_lat double precision
departure_lon double precision
departure_category text
arrival_location text
arrival_lat double precision
arrival_lon double precision
arrival_category text
```

### Indexes

- Spatial indexes on lat/lon for geospatial queries
- Category indexes for filtering marinas/ports

## 📚 Documentation

- **Full Docs:** `docs/LOCATION.md` - Complete system documentation
- **Migration:** `supabase/migrations/add-location-fields.sql` - Database schema
- **Config:** `config/location.config.ts` - Configuration options
- **Implementation:** `LOCATION_SYSTEM_IMPLEMENTATION.md` - Summary

## ✨ Next Steps

1. ✅ Run database migration
2. ✅ Test location features manually
3. ✅ Run automated tests
4. ✅ Customize marina keywords if needed
5. ✅ Deploy to production

## 🎉 Summary

The Location System is **production-ready** with:

- ✅ Complete Geoapify integration
- ✅ Marina/port filtering with fallback
- ✅ All UI components working
- ✅ Database integration
- ✅ Provider abstraction
- ✅ Comprehensive documentation

**Everything is ready to use!** 🚀
