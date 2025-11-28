/**
 * Camera Screen - Mobile Only
 * Uses native camera via expo-camera
 */

import { View, Text, StyleSheet } from 'react-native';
import { useCamera } from '@sparecarry/hooks';
import { CameraButton } from '@sparecarry/ui';

export default function CameraScreen() {
  const { takePicture, pickImage, loading } = useCamera();

  const handleCapture = (result: { uri: string; type?: string; name?: string; size?: number }) => {
    console.log('Photo captured:', result);
    // Handle the captured image
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera</Text>
      <CameraButton onCapture={handleCapture} style={styles.cameraButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cameraButton: {
    marginTop: 20,
  },
});

