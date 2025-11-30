# Testing Guide for Optimized Services

## Quick Test Checklist

### ✅ Service Verification

1. **Location Service Test**

   ```bash
   # Run the test script
   node scripts/test-optimized-services.js
   ```

2. **Manual Testing**
   - Open the app in development mode
   - Navigate to any form with location input
   - Test autocomplete (should be cached on repeat)
   - Test reverse geocode (GPS location)
   - Check browser console for errors

3. **Shipping Service Test**
   - Navigate to `/shipping-estimator`
   - Enter package dimensions and weight
   - Select origin and destination countries
   - Verify calculations work correctly
   - Check that premium discounts apply

### ✅ Performance Profiler

1. **Enable Performance Report**
   - Add `?perf=true` to any URL in development
   - Example: `http://localhost:3000/home?perf=true`
   - Performance report appears in bottom-right corner

2. **What to Check**
   - Component render counts
   - Network request metrics
   - Auto-detected bottlenecks
   - Optimization suggestions

### ✅ Component Optimization

1. **Feed Card**
   - Navigate to home feed
   - Scroll through items
   - Check that cards don't re-render unnecessarily
   - Use React DevTools Profiler to verify

2. **Message Thread**
   - Open a conversation
   - Send messages
   - Verify smooth scrolling
   - Check render performance

3. **Shipping Estimator**
   - Enter values in form
   - Verify calculations are fast
   - Check that results update smoothly

### ✅ E2E Tests

Run the test suite to ensure no regressions:

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific tests
pnpm test:e2e:subscription
pnpm test:e2e:auth
```

## Expected Results

### Location Service

- ✅ Autocomplete results cached (check Network tab - fewer requests)
- ✅ Debouncing works (no rapid API calls while typing)
- ✅ Reverse geocode works for GPS locations
- ✅ No console errors

### Shipping Service

- ✅ Calculations are fast (< 50ms)
- ✅ Premium discounts apply correctly
- ✅ Customs costs calculated for international
- ✅ All courier options work

### Performance

- ✅ Feed cards render smoothly
- ✅ Message threads don't lag
- ✅ Forms respond quickly
- ✅ No memory leaks (check DevTools)

## Troubleshooting

### Issue: Location autocomplete not working

- Check `NEXT_PUBLIC_GEOAPIFY_KEY` is set
- Verify network requests in DevTools
- Check browser console for errors

### Issue: Shipping calculations return null

- Verify all required fields are filled
- Check country codes are valid ISO2
- Review console for validation errors

### Issue: Performance profiler not showing

- Ensure `NODE_ENV=development`
- Add `?perf=true` to URL
- Check browser console for errors

### Issue: Components re-rendering too much

- Use React DevTools Profiler
- Check if props are stable
- Verify React.memo is working
- Check useMemo/useCallback dependencies

## Performance Benchmarks

### Before Optimization

- Location autocomplete: ~300ms per request
- Shipping calculation: ~50ms
- Feed card render: ~10-15ms
- Message thread render: ~20-30ms

### After Optimization (Expected)

- Location autocomplete: ~50ms (cached) or ~300ms (first time)
- Shipping calculation: ~30ms (optimized)
- Feed card render: ~5-8ms (memoized)
- Message thread render: ~10-15ms (optimized)

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Check performance improvements
3. ✅ Remove deprecated files (after verification)
4. ✅ Continue with remaining optimizations
5. ✅ Monitor production metrics
