# Auto-Measure Photo Capture - Validation Checklist

## ✅ Implementation Complete

The Auto-Measure feature now captures photos with the measurement overlay and automatically adds them to the listing photos.

## Pre-Testing Setup

### Dependencies
- [ ] `react-native-view-shot` installed (added to `apps/mobile/package.json`)
- [ ] `expo-file-system` installed (added to `apps/mobile/package.json`)
- [ ] Run `pnpm install` in root directory
- [ ] Run `pnpm install` in `apps/mobile` directory
- [ ] Rebuild native app (required for new native dependencies)

### Configuration
- [ ] Camera permissions configured (already done)
- [ ] Storage permissions configured (already done)
- [ ] Supabase Storage bucket "item-photos" exists and is accessible

## iOS Testing

### Photo Capture
- [ ] Camera opens successfully
- [ ] Measurement rectangle overlay displays correctly
- [ ] Tapping "Auto-Measure" freezes the frame
- [ ] View with overlay is captured successfully
- [ ] Photo is saved locally
- [ ] Photo includes measurement rectangle overlay
- [ ] Photo quality is acceptable (overlay visible)
- [ ] Photo compression works (file size reasonable)

### Integration
- [ ] Dimensions are auto-filled in form
- [ ] Captured photo is automatically added to photos gallery
- [ ] Photo appears in PhotoUploader component
- [ ] Photo can be reordered in gallery
- [ ] Photo can be deleted from gallery
- [ ] Photo is labeled/identifiable as auto-measure photo

### Upload
- [ ] Photo uploads to Supabase Storage when online
- [ ] Photo is stored in correct bucket ("item-photos")
- [ ] Photo path is correct format ("requests/{userId}/auto-measure-{timestamp}.jpg")
- [ ] Public URL is generated correctly
- [ ] Photo URL is included in form submission

### Offline Support
- [ ] Photo is saved locally when offline
- [ ] Photo is queued for upload when network available
- [ ] Photo appears in gallery even when offline
- [ ] Form can be submitted with local photo (uploaded later)

## Android Testing

### Photo Capture
- [ ] Camera opens successfully
- [ ] Measurement rectangle overlay displays correctly
- [ ] Tapping "Auto-Measure" freezes the frame
- [ ] View with overlay is captured successfully
- [ ] Photo is saved locally
- [ ] Photo includes measurement rectangle overlay
- [ ] Photo quality is acceptable (overlay visible)
- [ ] Photo compression works (file size reasonable)

### Integration
- [ ] Dimensions are auto-filled in form
- [ ] Captured photo is automatically added to photos gallery
- [ ] Photo appears in PhotoUploader component
- [ ] Photo can be reordered in gallery
- [ ] Photo can be deleted from gallery
- [ ] Photo is labeled/identifiable as auto-measure photo

### Upload
- [ ] Photo uploads to Supabase Storage when online
- [ ] Photo is stored in correct bucket ("item-photos")
- [ ] Photo path is correct format ("requests/{userId}/auto-measure-{timestamp}.jpg")
- [ ] Public URL is generated correctly
- [ ] Photo URL is included in form submission

### Offline Support
- [ ] Photo is saved locally when offline
- [ ] Photo is queued for upload when network available
- [ ] Photo appears in gallery even when offline
- [ ] Form can be submitted with local photo (uploaded later)

## Performance Testing

### Capture Performance
- [ ] View capture completes in < 2 seconds
- [ ] Photo compression doesn't block UI
- [ ] No memory leaks on repeated captures
- [ ] Works smoothly on low-end devices

### Upload Performance
- [ ] Upload doesn't block UI thread
- [ ] Upload progress is visible (if implemented)
- [ ] Failed uploads are retried (if implemented)
- [ ] Multiple photos can be uploaded simultaneously

## Edge Cases

### Error Handling
- [ ] Handles view capture failures gracefully
- [ ] Handles photo compression failures gracefully
- [ ] Handles upload failures gracefully
- [ ] Shows appropriate error messages
- [ ] Allows retry on failures

### User Interactions
- [ ] User can retake photo if capture fails
- [ ] User can delete captured photo
- [ ] User can capture multiple photos
- [ ] User can mix auto-measure and regular photos
- [ ] User can reorder photos (auto-measure + regular)

### Storage
- [ ] Handles storage quota exceeded
- [ ] Handles permission denied
- [ ] Cleans up temporary files
- [ ] Doesn't accumulate unused files

## Visual Verification

### Overlay Visibility
- [ ] Measurement rectangle is clearly visible in captured photo
- [ ] Rectangle color (#14b8a6) is visible against various backgrounds
- [ ] Rectangle size matches detected object
- [ ] Status text is readable (if included in capture)

### Photo Quality
- [ ] Photo resolution is sufficient for viewing
- [ ] Photo compression doesn't degrade overlay visibility
- [ ] Photo aspect ratio is correct
- [ ] Photo orientation is correct

## Integration Testing

### Form Submission
- [ ] Form submits successfully with auto-measure photo
- [ ] Photo URL is included in request data
- [ ] Photo appears in listing after submission
- [ ] Photo is accessible via public URL

### Photo Gallery
- [ ] Auto-measure photo appears in correct position
- [ ] Photo can be reordered with other photos
- [ ] Photo count includes auto-measure photo
- [ ] Max photo limit (6) is respected

## Known Limitations

1. **File Conversion**: Mobile uses URI-based upload (may need adjustment for Supabase client)
2. **Offline Upload**: Queue system not fully implemented (photos saved locally but upload happens immediately when online)
3. **Photo Labeling**: Auto-measure photos aren't visually labeled in gallery (could add badge/icon)

## Testing Commands

```bash
# Install dependencies
pnpm install

# Rebuild native app (required for new dependencies)
cd apps/mobile
pnpm prebuild  # Expo
# Or rebuild in Xcode/Android Studio

# Run mobile app
pnpm start

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Success Criteria

✅ Feature is considered complete when:
- All iOS tests pass
- All Android tests pass
- Photo capture works reliably
- Overlay is visible in captured photos
- Photos are automatically added to gallery
- Upload works online and offline
- Performance is acceptable
- Error handling is graceful
- Integration with form is seamless

## Troubleshooting

### View Capture Fails
- Check `react-native-view-shot` is installed
- Verify ViewShot ref is properly set
- Check camera permissions
- Verify view hierarchy is correct

### Photo Not Appearing in Gallery
- Check photo is added to `photos` state
- Verify PhotoUploader component receives photo
- Check file conversion is working
- Verify photo is valid File object

### Upload Fails
- Check Supabase Storage bucket exists
- Verify storage permissions
- Check network connection
- Verify file format is correct
- Check Supabase client configuration

### Overlay Not Visible
- Check overlay is rendered before capture
- Verify ViewShot captures entire view
- Check overlay z-index
- Verify overlay color is visible

