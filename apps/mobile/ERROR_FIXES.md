# Mobile App Error Fixes

## Fixed Issues

### 1. "Text strings must be rendered within a <Text> component" Error
**Location:** `apps/mobile/app/(tabs)/index.tsx` - FeedItemCard component

**Problem:** React Native doesn't allow conditional rendering with `&&` when the left side could be a number (like `item.spare_volume_liters &&`). If the value is `0`, it would render "0" as text, causing the error.

**Fix:** Changed all `&&` conditional rendering to ternary operators with `null` fallback:
- `{item.user_supporter && (...)}` → `{item.user_supporter ? (...) : null}`
- `{item.spare_volume_liters && (...)}` → `{item.spare_volume_liters ? (...) : null}`
- `{item.match_score && item.match_score > 0 && (...)}` → `{item.match_score && item.match_score > 0 ? (...) : null}`

### 2. Invalid MaterialIcons Icon Name: "package"
**Location:** Multiple files

**Problem:** `"package"` is not a valid MaterialIcons icon name, causing warnings.

**Fix:** Replaced `"package"` with `"inventory-2"` in:
- `apps/mobile/app/(tabs)/index.tsx` (FeedItemCard)
- `apps/mobile/app/(tabs)/my-stuff.tsx`
- `apps/mobile/app/feed-detail.tsx`

### 3. Missing Styles for Empty State Actions
**Location:** `apps/mobile/app/(tabs)/index.tsx`

**Problem:** Empty state buttons were using styles that didn't exist.

**Fix:** Added missing styles:
- `emptyActions`
- `emptyActionButton`
- `emptyActionButtonSecondary`
- `emptyActionButtonText`
- `emptyActionButtonTextSecondary`

### 4. Null/Undefined Location Values
**Location:** `apps/mobile/app/(tabs)/index.tsx` - FeedItemCard

**Problem:** Location values could be null/undefined, causing rendering issues.

**Fix:** Added fallback values:
- `{item.from_location} → {item.to_location}` → `{item.from_location || 'Unknown'} → {item.to_location || 'Unknown'}`
- `{dateStr}` → `{dateStr || 'No date'}`

## Status

✅ All errors fixed. The app should now run without the "Text strings must be rendered within a <Text> component" error.

