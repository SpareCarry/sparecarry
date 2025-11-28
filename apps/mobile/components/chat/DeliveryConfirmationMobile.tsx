/**
 * Delivery Confirmation Component - Mobile
 * Allows traveler to confirm delivery with photos and location
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentLocation } from '@sparecarry/hooks/useLocation';
import { createClient } from '@sparecarry/lib/supabase';
import { useAuth } from '@sparecarry/hooks/useAuth';

interface DeliveryConfirmationMobileProps {
  matchId: string;
}

export function DeliveryConfirmationMobile({ matchId }: DeliveryConfirmationMobileProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [photos, setPhotos] = useState<string[]>([]);
  const [gpsLat, setGpsLat] = useState<string>('');
  const [gpsLng, setGpsLng] = useState<string>('');
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll access to upload photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
      setPhotos([...photos, ...newPhotos].slice(0, 6));
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri].slice(0, 6));
    }
  };

  const handleGetLocation = async () => {
    setGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      setGpsLat(location.latitude.toString());
      setGpsLng(location.longitude.toString());
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      Alert.alert('Error', 'Please add at least one photo');
      return;
    }

    if (!gpsLat || !gpsLng) {
      Alert.alert('Error', 'Please get your GPS location');
      return;
    }

    setLoading(true);
    try {
      // Upload photos
      const photoUrls: string[] = [];
      for (const photoUri of photos) {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const fileExt = photoUri.split('.').pop() || 'jpg';
        const fileName = `${user!.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `deliveries/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-photos')
          .getPublicUrl(filePath);

        photoUrls.push(publicUrl);
      }

      // Create delivery record
      const { error: deliveryError } = await supabase.from('deliveries').insert({
        match_id: matchId,
        proof_photos: photoUrls,
        delivery_lat: parseFloat(gpsLat),
        delivery_lon: parseFloat(gpsLng),
        delivery_location_name: locationName || null,
        delivered_at: new Date().toISOString(),
      });

      if (deliveryError) throw deliveryError;

      // Update match status
      const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'delivered' })
        .eq('id', matchId);

      if (matchError) throw matchError;

      Alert.alert('Success', 'Delivery confirmed! Waiting for requester confirmation.');
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      Alert.alert('Error', error.message || 'Failed to confirm delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm Delivery</Text>
      <Text style={styles.subtitle}>Add photos and location to confirm delivery</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos *</Text>
          <View style={styles.photosContainer}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoWrapper}>
                <View style={styles.photoPlaceholder}>
                  <MaterialIcons name="image" size={40} color="#999" />
                </View>
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickPhoto}>
                <MaterialIcons name="add-photo-alternate" size={32} color="#14b8a6" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoActionButton} onPress={handleTakePhoto}>
              <MaterialIcons name="camera-alt" size={20} color="#14b8a6" />
              <Text style={styles.photoActionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoActionButton} onPress={handlePickPhoto}>
              <MaterialIcons name="photo-library" size={20} color="#14b8a6" />
              <Text style={styles.photoActionText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location *</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleGetLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <ActivityIndicator color="#14b8a6" />
            ) : (
              <>
                <MaterialIcons name="my-location" size={20} color="#14b8a6" />
                <Text style={styles.locationButtonText}>Get Current Location</Text>
              </>
            )}
          </TouchableOpacity>
          {(gpsLat && gpsLng) && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationInfoText}>
                {gpsLat}, {gpsLng}
              </Text>
            </View>
          )}
          <TextInput
            style={styles.locationInput}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Location name (optional)"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || photos.length === 0 || !gpsLat || !gpsLng}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Confirm Delivery</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoWrapper: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderWidth: 2,
    borderColor: '#14b8a6',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#14b8a6',
    fontWeight: '600',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  photoActionText: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  locationInfoText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  locationInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

