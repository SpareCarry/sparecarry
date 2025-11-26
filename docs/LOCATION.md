# Location System Documentation

## Overview

The SpareCarry Location System provides a complete, production-ready location selection interface using Geoapify API. It includes autocomplete, map previews, GPS location, and draggable map picker with marina/port filtering.

## Architecture

The system uses a **provider abstraction layer** that allows switching location providers (e.g., from Geoapify to Google Places) with zero UI changes.

```
UI Components → locationProvider → lib/geoapify → Geoapify API
```

### Key Files

- **`lib/locationProvider.ts`** - Unified interface for location services
- **`lib/geoapify.ts`** - Geoapify API implementation (provider-specific)
- **`config/location.config.ts`** - Centralized configuration
- **`components/location/`** - UI components

## Components

### LocationInput

Autocomplete input with marina filtering and debouncing.

```tsx
<LocationInput
  placeholder="Search location..."
  onSelect={(place) => console.log(place)}
  showOnlyMarinas={true}
  allowFallbackToAny={true}
  bbox={[minLon, minLat, maxLon, maxLat]}
/>
```

### LocationMapPreview

Shows a map preview with marker for selected location.

```tsx
<LocationMapPreview place={selectedPlace} />
```

### UseCurrentLocationButton

Gets GPS location and reverse geocodes it.

```tsx
<UseCurrentLocationButton
  onLocationFound={(place) => console.log(place)}
  showOnlyMarinas={false}
/>
```

### LocationDraggablePicker

Fullscreen map modal with draggable pin selector.

```tsx
<LocationDraggablePicker
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={(place) => console.log(place)}
  showMarinaSnap={true}
/>
```

### LocationFieldGroup

Complete location input group (wraps all components above).

```tsx
<LocationFieldGroup
  label="Departure Location"
  value={departure}
  onChange={setDeparture}
  showOnlyMarinas={true}
  showMapPreview={true}
  showCurrentLocation={true}
  showMapPicker={true}
/>
```

## Configuration

Edit `config/location.config.ts` to customize:

```typescript
export const LOCATION_CONFIG = {
  MARINA_KEYWORDS: ['marina', 'harbor', 'port', ...], // Keywords for marina detection
  DEFAULT_AUTOCOMPLETE_LIMIT: 8,
  DEFAULT_DEBOUNCE_MS: 300,
  FALLBACK_ALLOW: true,
  MARINA_SNAP_DISTANCE_KM: 5,
  // ...
};
```

## Switching Providers

To switch from Geoapify to Google Places (or any other provider):

1. **Create new provider file:** `lib/googlePlaces.ts`
   - Implement same interface as `lib/geoapify.ts`
   - Export `googlePlacesAutocomplete`, `googlePlacesReverse`, `googlePlacesForward`

2. **Update `lib/locationProvider.ts`:**
   ```typescript
   // Change this:
   import { geoapifyAutocomplete, ... } from './geoapify';
   
   // To this:
   import { googlePlacesAutocomplete, ... } from './googlePlaces';
   
   // Update function bodies:
   export async function autocomplete(...) {
     return googlePlacesAutocomplete(...); // Changed from geoapifyAutocomplete
   }
   ```

3. **No UI changes needed!** All components continue to work.

## Marina/Port Filtering

### How It Works

1. **API-level filtering:** Attempts to use provider's category filters
2. **Client-side filtering:** Applies keyword/category detection to all results
3. **Fallback:** If no marinas found and `allowFallbackToAny` is true, shows all results

### Customizing Marina Detection

Edit `config/location.config.ts`:

```typescript
MARINA_KEYWORDS: [
  'marina',
  'harbor',
  'port',
  'pier',
  'dock',
  // Add more keywords
]
```

The filtering logic in `lib/geoapify.ts` checks:
- Feature category/type fields
- Place name for keywords
- OSM tags (if available)

## Form Integration

### Basic Integration

```tsx
import { LocationFieldGroup } from '@/components/location';
import { Place } from '@/lib/locationProvider';

const [departure, setDeparture] = useState<Place | null>(null);

<LocationFieldGroup
  label="Departure Location"
  value={departure}
  onChange={setDeparture}
  showOnlyMarinas={true}
  required
/>

// On form submit:
const formData = {
  departure_location: departure?.name,
  departure_lat: departure?.lat,
  departure_lon: departure?.lon,
  departure_category: departure?.category,
};
```

### With React Hook Form

```tsx
const { setValue, watch } = useForm();

<LocationFieldGroup
  label="Departure"
  onChange={(place) => {
    if (place) {
      setValue('departure_location', place.name);
      setValue('departure_lat', place.lat);
      setValue('departure_lon', place.lon);
      setValue('departure_category', place.category);
    }
  }}
/>
```

## Database Schema

Location fields are stored in `trips` and `requests` tables:

```sql
departure_location text,
departure_lat double precision,
departure_lon double precision,
departure_category text,
arrival_location text,
arrival_lat double precision,
arrival_lon double precision,
arrival_category text
```

Run migration: `supabase/migrations/add-location-fields.sql`

## API Configuration

### Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_GEOAPIFY_KEY=d6dec9413f4f495295e42d4158a3803d
```

### API Key

The Geoapify key is already configured. For production:
1. Create account at https://www.geoapify.com
2. Get API key
3. Update environment variable

**No credit card required** for basic usage (3000 requests/day free tier).

## Testing

### Unit Tests

```bash
# Test location provider
pnpm test lib/locationProvider

# Test marina filtering
pnpm test lib/geoapify
```

### Integration Tests

```bash
# Test location components
pnpm test components/location

# E2E location flow
npx playwright test tests/e2e/location-flow.spec.ts
```

### Manual Testing

1. Test autocomplete with marina filter
2. Test fallback when no marinas found
3. Test GPS location button
4. Test map picker and snap-to-marina
5. Test form submission with location data

## Troubleshooting

### Autocomplete Not Working

- Check `NEXT_PUBLIC_GEOAPIFY_KEY` is set
- Check network tab for API errors
- Verify query length >= 2 characters

### Marina Filter Too Restrictive

- Edit `MARINA_KEYWORDS` in `config/location.config.ts`
- Check client-side filter logic in `lib/geoapify.ts`
- Enable `allowFallbackToAny={true}` for fallback

### GPS Not Working

- Check browser permissions
- Verify HTTPS (required for geolocation)
- Check browser console for permission errors

### Map Preview Not Loading

- Verify Geoapify static map API key
- Check if location has valid lat/lon
- Fallback background color should appear on error

## Advanced Usage

### Custom Bounding Box

```tsx
<LocationInput
  bbox={[-122.5, 37.7, -122.3, 37.8]} // San Francisco area
  // ...
/>
```

### Custom Debounce

```tsx
<LocationInput
  debounceMs={500} // Slower debounce for expensive queries
  // ...
/>
```

### Snap to Marina

```tsx
<LocationDraggablePicker
  showMarinaSnap={true}
  // Searches within MARINA_SNAP_DISTANCE_KM
  // ...
/>
```

## Performance

- **Debouncing:** Default 300ms prevents excessive API calls
- **Result limiting:** Default 8 results per query
- **Caching:** Consider adding React Query for autocomplete results
- **Lazy loading:** Map preview only loads when location selected

## Security

- API key is public (client-side) but rate-limited
- No sensitive data sent to Geoapify
- User location only sent with permission
- Consider proxy API route for production to hide API key

## Future Enhancements

- [ ] Add React Query caching for autocomplete
- [ ] Add location history/favorites
- [ ] Add offline location caching
- [ ] Add distance calculation between locations
- [ ] Add route visualization on map

## Support

For issues:
1. Check this documentation
2. Review code comments in `lib/geoapify.ts`
3. Check browser console for errors
4. Verify API key and network connectivity

