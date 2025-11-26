# Countries List Documentation

## Overview

SpareCarry uses a global static country list for fast, offline access to country data. The list includes all world countries with ISO2 and ISO3 codes.

## Current Implementation

### Static File
- **Location**: `src/constants/countries.ts`
- **Format**: TypeScript array with `Country` interface
- **Fields**: `name`, `iso2`, `iso3`
- **Count**: ~195 countries

### Database Table
- **Location**: `supabase/migrations/20251124092302_countries.sql`
- **Table**: `countries`
- **Purpose**: Analytics and optional server-side lookups
- **Note**: Frontend uses static file for speed; database is for reference only

## Usage

### Frontend (React/Next.js)

```typescript
import { COUNTRIES, getCountryByIso2, getCountryByIso3 } from '@/src/constants/countries';
import { CountrySelect } from '@/components/CountrySelect';

// Get all countries
const allCountries = COUNTRIES;

// Find by ISO2
const usa = getCountryByIso2('US');

// Find by ISO3
const gbr = getCountryByIso3('GBR');

// Use in component
<CountrySelect
  value={selectedCountryIso2}
  onChange={setSelectedCountryIso2}
  onSelect={(country) => console.log(country)}
/>
```

### Validation

```typescript
import { isValidIso2, isValidIso3, normalizeIso2 } from '@/src/utils/validateCountry';

// Validate ISO2
if (isValidIso2('US')) {
  // Valid
}

// Normalize to uppercase
const normalized = normalizeIso2('us'); // Returns 'US'
```

## Replacing Static List with Database

If you need to replace the static file with a database-backed list:

### Step 1: Create API Endpoint

```typescript
// app/api/countries/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return Response.json(data);
}
```

### Step 2: Update CountrySelect Component

```typescript
// Replace static import with API call
const { data: countries } = useQuery({
  queryKey: ['countries'],
  queryFn: async () => {
    const res = await fetch('/api/countries');
    return res.json();
  },
  staleTime: Infinity, // Cache forever
});
```

### Step 3: Add Localized Names

```sql
-- Migration: Add localized names
ALTER TABLE countries ADD COLUMN name_es TEXT;
ALTER TABLE countries ADD COLUMN name_fr TEXT;
-- ... etc
```

### Step 4: Add Continent Grouping

```sql
-- Migration: Add continent
ALTER TABLE countries ADD COLUMN continent TEXT;
CREATE INDEX idx_countries_continent ON countries(continent);
```

### Step 5: Add Flags (Optional)

```sql
-- Migration: Add flag emoji or URL
ALTER TABLE countries ADD COLUMN flag_emoji TEXT;
-- Or
ALTER TABLE countries ADD COLUMN flag_url TEXT;
```

## Performance Considerations

- **Static File**: Instant load, no network request, ~10KB gzipped
- **Database**: Requires API call, can be cached, allows dynamic updates
- **Recommendation**: Use static file unless you need:
  - Dynamic updates
  - Localized names
  - User-specific filtering
  - Analytics on country usage

## Future Enhancements

1. **Localized Names**: Add translations for country names
2. **Continent Grouping**: Group countries by continent
3. **Flags**: Add flag emojis or images
4. **Currency**: Add currency codes
5. **Time Zones**: Add time zone information
6. **Phone Codes**: Add international dialing codes

## Migration Checklist

When migrating from static to database:

- [ ] Create API endpoint
- [ ] Update CountrySelect to use API
- [ ] Add caching strategy
- [ ] Update tests
- [ ] Add loading states
- [ ] Handle offline scenarios
- [ ] Update documentation

