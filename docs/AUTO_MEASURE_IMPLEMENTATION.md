# Auto-Measure Feature Implementation

## Overview

The Auto-Measure feature allows users to estimate item dimensions (length, width, height) by pointing their phone camera at an object. This is a lightweight implementation that provides rough estimates (~20-30% accuracy) without requiring ARKit/ARCore or heavy ML models.

## Architecture

### Files Created

1. **`modules/autoMeasure/types.ts`**
   - TypeScript types for dimensions, bounding boxes, and measurement results

2. **`modules/autoMeasure/useAutoMeasure.ts`**
   - Core measurement logic hook
   - Distance estimation using camera focal length and sensor size
   - Pixel-to-real-world conversion
   - Bounding box detection (simplified)

3. **`modules/autoMeasure/AutoMeasureCamera.tsx`**
   - React Native camera component using expo-camera
   - Full-screen camera with bounding box overlay
   - Capture and measurement UI

4. **`modules/autoMeasure/index.ts`**
   - Module exports

5. **`apps/mobile/app/auto-measure.tsx`**
   - Expo Router screen for auto-measure
   - Handles navigation and result passing

6. **`components/forms/AutoMeasureButton.tsx`**
   - Integration button for the form
   - Mobile detection and navigation
   - Web fallback message

### Integration

The feature is integrated into `components/forms/post-request-form.tsx`:
- Button appears above dimension inputs
- On mobile: Opens camera screen
- On web: Shows info message
- Auto-fills length, width, height when measurement completes
- Shows "Auto-estimated (Tap to edit)" label

## How It Works

### Measurement Algorithm

1. **Bounding Box Detection**
   - Simplified edge detection (placeholder)
   - Assumes object is centered in frame
   - Returns estimated bounding box

2. **Distance Estimation**
   - Uses camera focal length (default: 4.2mm)
   - Uses sensor size (default: 5.4mm x 4.0mm)
   - Formula: `distance = (focal_length * assumed_object_size) / object_size_on_sensor`
   - Assumes typical object is ~20cm wide

3. **Dimension Calculation**
   - Converts pixel dimensions to real-world using:
     - `real_size = (pixel_size * distance) / focal_length`
   - Estimates height using heuristics:
     - Vertical objects (aspect ratio > 1.5): height = length * 0.8
     - Horizontal objects (aspect ratio < 0.7): height = length * 0.3
     - Square objects: height = min(width, length) * 0.5

4. **Confidence Calculation**
   - Based on bounding box coverage of frame
   - Range: 30-80% (rough estimates)

### Performance Optimizations

- **Frame Throttling**: Max 10fps processing (100ms throttle)
- **Low Resolution**: Uses compressed images (quality: 0.8)
- **Memoization**: Reuses calculations where possible
- **Background Processing**: Image manipulation offloaded

## Usage

### Mobile App

1. User taps "Auto-Fill Dimensions (Camera)" button
2. Camera screen opens
3. User points camera at object
4. Bounding box overlay shows detected object
5. User taps "Auto-Measure" button
6. Photo is captured and measured
7. Results shown in alert dialog
8. User confirms or retakes
9. Dimensions auto-filled in form

### Web App

- Button shows info message: "Auto-measure is only available in the mobile app"
- Feature not available on web (requires native camera access)

## Configuration

### Expo Config

Camera permissions are already configured in `apps/mobile/app.json`:
```json
{
  "plugins": [
    [
      "expo-camera",
      {
        "cameraPermission": "SpareCarry needs camera access to take photos of items."
      }
    ]
  ]
}
```

### Dependencies

- `expo-camera`: ~16.0.0 (already installed)
- `expo-image-manipulator`: ~12.0.0 (added to mobile app)

## Testing Checklist

### iOS

- [ ] Camera permission requested on first use
- [ ] Camera opens successfully
- [ ] Bounding box overlay displays
- [ ] Photo capture works
- [ ] Measurement calculation completes
- [ ] Results displayed correctly
- [ ] Navigation back to form works
- [ ] Dimensions auto-filled in form
- [ ] "Auto-estimated" label appears
- [ ] User can edit auto-filled values

### Android

- [ ] Camera permission requested on first use
- [ ] Camera opens successfully
- [ ] Bounding box overlay displays
- [ ] Photo capture works
- [ ] Measurement calculation completes
- [ ] Results displayed correctly
- [ ] Navigation back to form works
- [ ] Dimensions auto-filled in form
- [ ] "Auto-estimated" label appears
- [ ] User can edit auto-filled values

### Performance

- [ ] Camera preview smooth (no lag)
- [ ] Frame processing doesn't block UI
- [ ] Photo capture < 2 seconds
- [ ] Measurement calculation < 1 second
- [ ] No memory leaks on repeated use
- [ ] Works on low-end devices

### Edge Cases

- [ ] Handles permission denial gracefully
- [ ] Handles camera errors gracefully
- [ ] Handles measurement failures gracefully
- [ ] Works in low light conditions
- [ ] Works with various object sizes
- [ ] Works with various object shapes

## Known Limitations

1. **Accuracy**: Only ~20-30% accurate (rough estimates)
2. **Bounding Box Detection**: Simplified (assumes centered object)
3. **Distance Estimation**: Uses defaults (not device-specific)
4. **Height Estimation**: Uses heuristics (may not be accurate)
5. **Web Support**: Not available (mobile-only feature)

## Future Improvements

1. **Better Bounding Box Detection**
   - Use proper edge detection algorithms
   - Use ML model for object detection (optional)
   - Support multiple objects

2. **Device-Specific Calibration**
   - Detect device model
   - Use actual camera specs
   - Calibrate for different devices

3. **Reference Object**
   - Allow user to place reference object (e.g., credit card)
   - Use reference for better accuracy

4. **Multiple Measurements**
   - Allow user to measure from different angles
   - Average results for better accuracy

5. **AR Overlay**
   - Show estimated dimensions in AR
   - Visual feedback during measurement

## Troubleshooting

### Camera Not Opening

- Check camera permissions in device settings
- Verify expo-camera is installed
- Check Expo config has camera plugin

### Measurement Fails

- Ensure object is well-lit
- Ensure object is centered in frame
- Try different object sizes
- Check console for errors

### Results Not Appearing in Form

- Check navigation is working
- Check sessionStorage/AsyncStorage
- Verify form integration code
- Check browser console for errors

## Files Modified

- `components/forms/post-request-form.tsx`: Added AutoMeasureButton integration
- `apps/mobile/package.json`: Added expo-image-manipulator dependency

## Dependencies Added

- `expo-image-manipulator`: ~12.0.0 (mobile app only)

