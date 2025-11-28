/**
 * Auto-Measure Camera Screen
 * Mobile-only route for measuring item dimensions
 */

import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { mobileLogger } from '../lib/logger';
import { useEffect, useState } from 'react';

// Lazy load AutoMeasureCamera to handle missing module gracefully
let AutoMeasureCamera: any = null;
let MeasurementResult: any = null;
let CapturedPhoto: any = null;

try {
  // Try to import from the modules directory (relative to workspace root)
  const AutoMeasureModule = require('../../../modules/autoMeasure/AutoMeasureCamera');
  AutoMeasureCamera = AutoMeasureModule.AutoMeasureCamera || AutoMeasureModule.default;
  
  const TypesModule = require('../../../modules/autoMeasure/types');
  MeasurementResult = TypesModule.MeasurementResult;
  CapturedPhoto = TypesModule.CapturedPhoto;
} catch (error) {
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  console.warn('⚠️ [Auto-Measure] Failed to load AutoMeasureCamera module:', normalizedError);
  console.warn('   Auto-Measure feature will be disabled.');
  mobileLogger.warn('Auto-Measure module not available', { error: normalizedError });
}

export default function AutoMeasureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [moduleError, setModuleError] = useState<string | null>(null);

  useEffect(() => {
    console.log('📷 Auto-Measure screen opened');
    console.log('   Params:', JSON.stringify(params, null, 2));
    mobileLogger.info('Auto-Measure screen opened', { metadata: { params } });
    
    if (!AutoMeasureCamera) {
      setModuleError('Auto-Measure feature is not available. The camera module could not be loaded.');
    }
  }, [params]);

  const handleMeasurementComplete = (
    result: any,
    photos?: any[]
  ) => {
    console.log('✅ Measurement complete!');
    console.log('   Dimensions:', result.dimensions);
    console.log('   Confidence:', result.confidence);
    console.log('   Photos:', photos ? photos.length : 0);
    
    mobileLogger.info('Measurement complete', {
      metadata: {
        dimensions: result.dimensions,
        confidence: result.confidence,
        photoCount: photos ? photos.length : 0,
      },
    });

    // Store results
    const dimensions = {
      length_cm: result.dimensions.length,
      width_cm: result.dimensions.width,
      height_cm: result.dimensions.height,
    };

    // Store in AsyncStorage for React Native
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Store dimensions with proper field names
      AsyncStorage.setItem('autoMeasureResult', JSON.stringify({
        length_cm: result.dimensions.length,
        width_cm: result.dimensions.width,
        height_cm: result.dimensions.height,
      }));
      
      // Store all photos (main, side, reference)
      if (photos && photos.length > 0) {
        const photosData = photos.map(photo => ({
          uri: photo.uri || photo.file,
          dimensions: photo.dimensions,
          timestamp: photo.timestamp,
          isAutoMeasure: true,
          type: photo.photoType || photo.type || 'main',
        }));
        AsyncStorage.setItem('autoMeasurePhotos', JSON.stringify(photosData));
        console.log('[Auto-Measure] Stored', photosData.length, 'photos in AsyncStorage');
      }
      
      mobileLogger.info('Measurement results stored in AsyncStorage', {
        metadata: {
          dimensions,
          photoCount: photos ? photos.length : 0,
        },
      });
    } catch (storageError) {
      console.error('[Auto-Measure] Failed to store results:', storageError);
      mobileLogger.error('Failed to store measurement results', {
        error: storageError instanceof Error ? storageError : new Error(String(storageError)),
      });
    }

    // Navigate back
    mobileLogger.debug('Navigating back from auto-measure');
    router.back();
  };

  // Show error if module is not available
  if (!AutoMeasureCamera || moduleError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Auto-Measure</Text>
        <Text style={styles.errorText}>
          {moduleError || 'Auto-Measure feature is not available.'}
        </Text>
        <Text style={styles.helpText} onPress={() => router.back()}>
          Go Back
        </Text>
      </View>
    );
  }

  return <AutoMeasureCamera onMeasurementComplete={handleMeasurementComplete} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  helpText: {
    fontSize: 16,
    color: '#14b8a6',
    textDecorationLine: 'underline',
  },
});

