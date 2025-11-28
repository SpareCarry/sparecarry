/**
 * Shipping Estimator Screen - Mobile
 * Compare courier prices with SpareCarry prices
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationInput } from '@sparecarry/ui';
import {
  calculateShippingEstimate,
  type ShippingEstimateInput,
  getAvailableCouriers,
} from '../../../../lib/services/shipping';

// Simple subscription check - check users table directly
async function checkSubscriptionStatus(userId: string | undefined): Promise<{ isPremium: boolean }> {
  if (!userId) return { isPremium: false };
  
  try {
    const { createClient } = await import('@sparecarry/lib/supabase');
    const supabase = createClient();
    const { data } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single();
    
    const isPremium = data?.subscription_status === 'active' || data?.subscription_status === 'trialing';
    return { isPremium };
  } catch (error) {
    console.warn('Error checking subscription status:', error);
    return { isPremium: false };
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
import { useAuth } from '@sparecarry/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export default function ShippingEstimatorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Get subscription status for premium pricing
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: () => checkSubscriptionStatus(user?.id),
    enabled: !!user,
    staleTime: 60000,
  });
  const isPremium = subscriptionStatus?.isPremium ?? false;

  // Location inputs
  const [originLocation, setOriginLocation] = useState('');
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLon, setOriginLon] = useState<number | null>(null);
  const [originCountry, setOriginCountry] = useState('');
  
  const [destinationLocation, setDestinationLocation] = useState('');
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLon, setDestinationLon] = useState<number | null>(null);
  const [destinationCountry, setDestinationCountry] = useState('');

  // Dimensions and weight
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('dhl');
  
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<ReturnType<typeof calculateShippingEstimate> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available couriers
  const availableCouriers = useMemo(() => getAvailableCouriers(), []);

  // Get country codes from locations
  const handleOriginSelect = async (place: any) => {
    setOriginLocation(place.name);
    setOriginLat(place.lat);
    setOriginLon(place.lon);
    if (place.country) {
      setOriginCountry(place.country.toUpperCase());
    } else {
      // Try to get country from reverse geocode
      try {
        const { reverseGeocode } = await import('@sparecarry/lib/services/location');
        const geocoded = await reverseGeocode(place.lat, place.lon);
        if (geocoded?.country) {
          setOriginCountry(geocoded.country.toUpperCase());
        }
      } catch (error) {
        console.warn('Failed to get origin country:', error);
      }
    }
  };

  const handleDestinationSelect = async (place: any) => {
    setDestinationLocation(place.name);
    setDestinationLat(place.lat);
    setDestinationLon(place.lon);
    if (place.country) {
      setDestinationCountry(place.country.toUpperCase());
    } else {
      // Try to get country from reverse geocode
      try {
        const { reverseGeocode } = await import('@sparecarry/lib/services/location');
        const geocoded = await reverseGeocode(place.lat, place.lon);
        if (geocoded?.country) {
          setDestinationCountry(geocoded.country.toUpperCase());
        }
      } catch (error) {
        console.warn('Failed to get destination country:', error);
      }
    }
  };

  const handleCalculate = async () => {
    // Validate inputs
    const validationErrors: Record<string, string> = {};
    
    if (!originLocation || !originCountry) {
      validationErrors.origin = 'Origin location is required';
    }
    if (!destinationLocation || !destinationCountry) {
      validationErrors.destination = 'Destination location is required';
    }
    if (!length || parseFloat(length) <= 0) {
      validationErrors.length = 'Length is required';
    }
    if (!width || parseFloat(width) <= 0) {
      validationErrors.width = 'Width is required';
    }
    if (!height || parseFloat(height) <= 0) {
      validationErrors.height = 'Height is required';
    }
    if (!weight || parseFloat(weight) <= 0) {
      validationErrors.weight = 'Weight is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      Alert.alert('Validation Error', Object.values(validationErrors).join('\n'));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Calculate distance if coordinates are available
      let distanceKm: number | undefined;
      if (originLat !== null && originLon !== null && destinationLat !== null && destinationLon !== null) {
        distanceKm = calculateDistanceKm(
          originLat,
          originLon,
          destinationLat,
          destinationLon
        );
      }

      // Prepare shipping estimate input
      const input: ShippingEstimateInput = {
        originCountry: originCountry,
        destinationCountry: destinationCountry,
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        weight: parseFloat(weight),
        declaredValue: declaredValue ? parseFloat(declaredValue) : 0,
        selectedCourier: selectedCourier,
        isPremium: isPremium,
        distanceKm: distanceKm,
        originLat: originLat || undefined,
        originLon: originLon || undefined,
        destinationLat: destinationLat || undefined,
        destinationLon: destinationLon || undefined,
      };

      // Calculate estimate
      const result = calculateShippingEstimate(input);
      
      if (!result) {
        Alert.alert('Error', 'Failed to calculate shipping estimate. Please check your inputs.');
        setLoading(false);
        return;
      }

      setEstimate(result);
    } catch (error: any) {
      console.error('Error calculating estimate:', error);
      Alert.alert('Error', error.message || 'Failed to calculate shipping estimate');
    } finally {
      setLoading(false);
    }
  };

  const handlePostRequest = () => {
    if (!estimate) {
      Alert.alert('Error', 'Please calculate an estimate first');
      return;
    }

    // Determine which price to prefill based on restrictions
    let prefilledMaxReward: number;
    if (estimate.canTransportByPlane === false) {
      prefilledMaxReward = Math.round(estimate.spareCarryBoatPrice);
    } else {
      // Prefer boat (cheaper), fallback to plane
      prefilledMaxReward = estimate.spareCarryBoatPrice > 0 
        ? Math.round(estimate.spareCarryBoatPrice) 
        : Math.round(estimate.spareCarryPlanePrice);
    }

    // Prepare prefill data
    const prefillData = {
      from_location: originLocation || originCountry,
      to_location: destinationLocation || destinationCountry,
      departure_lat: originLat,
      departure_lon: originLon,
      arrival_lat: destinationLat,
      arrival_lon: destinationLon,
      length_cm: parseFloat(length) || 0,
      width_cm: parseFloat(width) || 0,
      height_cm: parseFloat(height) || 0,
      weight_kg: parseFloat(weight) || 0,
      value_usd: declaredValue ? parseFloat(declaredValue) : 0,
      max_reward: prefilledMaxReward,
    };

    // Store in AsyncStorage for post-request form to read
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      AsyncStorage.setItem('shippingEstimatorPrefill', JSON.stringify(prefillData));
    } catch (error) {
      console.warn('Failed to save prefill data:', error);
    }

    // Navigate to post request
    router.push('/(tabs)/post-request');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Shipping Estimator</Text>
          <Text style={styles.subtitle}>
            Compare courier prices with SpareCarry prices
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <LocationInput
              label="Origin Location *"
              value={originLocation}
              onChange={(address, lat, lon) => {
                setOriginLocation(address);
                setOriginLat(lat);
                setOriginLon(lon);
              }}
              onLocationSelect={handleOriginSelect}
              placeholder="Enter origin location"
            />
            {errors.origin && (
              <Text style={styles.errorText}>{errors.origin}</Text>
            )}
          </View>

          <View style={styles.field}>
            <LocationInput
              label="Destination Location *"
              value={destinationLocation}
              onChange={(address, lat, lon) => {
                setDestinationLocation(address);
                setDestinationLat(lat);
                setDestinationLon(lon);
              }}
              onLocationSelect={handleDestinationSelect}
              placeholder="Enter destination location"
            />
            {errors.destination && (
              <Text style={styles.errorText}>{errors.destination}</Text>
            )}
          </View>

          {availableCouriers.length > 1 && (
            <View style={styles.field}>
              <Text style={styles.label}>Compare With Courier</Text>
              <View style={styles.courierButtons}>
                {availableCouriers.map((courier) => (
                  <TouchableOpacity
                    key={courier}
                    style={[
                      styles.courierButton,
                      selectedCourier === courier && styles.courierButtonActive,
                    ]}
                    onPress={() => setSelectedCourier(courier)}
                  >
                    <Text
                      style={[
                        styles.courierButtonText,
                        selectedCourier === courier && styles.courierButtonTextActive,
                      ]}
                    >
                      {courier.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        <View style={styles.field}>
          <Text style={styles.label}>Dimensions (cm) *</Text>
          <View style={styles.dimensionsRow}>
            <View style={styles.dimensionInput}>
              <TextInput
                style={[styles.input, errors.length && styles.inputError]}
                value={length}
                onChangeText={(text) => {
                  setLength(text);
                  if (errors.length) {
                    const newErrors = { ...errors };
                    delete newErrors.length;
                    setErrors(newErrors);
                  }
                }}
                placeholder="Length"
                keyboardType="numeric"
              />
              {errors.length && (
                <Text style={styles.errorText}>{errors.length}</Text>
              )}
            </View>
            <View style={styles.dimensionInput}>
              <TextInput
                style={[styles.input, errors.width && styles.inputError]}
                value={width}
                onChangeText={(text) => {
                  setWidth(text);
                  if (errors.width) {
                    const newErrors = { ...errors };
                    delete newErrors.width;
                    setErrors(newErrors);
                  }
                }}
                placeholder="Width"
                keyboardType="numeric"
              />
              {errors.width && (
                <Text style={styles.errorText}>{errors.width}</Text>
              )}
            </View>
            <View style={styles.dimensionInput}>
              <TextInput
                style={[styles.input, errors.height && styles.inputError]}
                value={height}
                onChangeText={(text) => {
                  setHeight(text);
                  if (errors.height) {
                    const newErrors = { ...errors };
                    delete newErrors.height;
                    setErrors(newErrors);
                  }
                }}
                placeholder="Height"
                keyboardType="numeric"
              />
              {errors.height && (
                <Text style={styles.errorText}>{errors.height}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg) *</Text>
          <TextInput
            style={[styles.input, errors.weight && styles.inputError]}
            value={weight}
            onChangeText={(text) => {
              setWeight(text);
              if (errors.weight) {
                const newErrors = { ...errors };
                delete newErrors.weight;
                setErrors(newErrors);
              }
            }}
            placeholder="0"
            keyboardType="numeric"
          />
          {errors.weight && (
            <Text style={styles.errorText}>{errors.weight}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Declared Value ($)</Text>
          <TextInput
            style={styles.input}
            value={declaredValue}
            onChangeText={setDeclaredValue}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[styles.calculateButton, loading && styles.calculateButtonDisabled]}
          onPress={handleCalculate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="calculate" size={20} color="#fff" />
              <Text style={styles.calculateButtonText}>Calculate</Text>
            </>
          )}
        </TouchableOpacity>

        {estimate && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>Estimated Prices</Text>
            
            {/* Courier Price */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{selectedCourier.toUpperCase()}:</Text>
              <Text style={styles.priceValue}>
                ${estimate.courierPrice.toFixed(2)}
              </Text>
            </View>
            
            {/* Customs (if international) */}
            {estimate.customsCost > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Customs & Fees:</Text>
                <Text style={styles.priceValue}>
                  ${estimate.customsCost.toFixed(2)}
                </Text>
              </View>
            )}
            
            {/* Courier Total */}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.priceLabel}>Courier Total:</Text>
              <Text style={[styles.priceValue, styles.totalValue]}>
                ${estimate.courierTotal.toFixed(2)}
              </Text>
            </View>

            {/* SpareCarry Plane Price */}
            {estimate.canTransportByPlane && (
              <View style={[styles.priceRow, styles.spareCarryRow]}>
                <View style={styles.spareCarryLabel}>
                  <MaterialIcons name="flight" size={18} color="#14b8a6" />
                  <Text style={styles.priceLabel}>SpareCarry (Plane):</Text>
                </View>
                <View style={styles.priceRight}>
                  <Text style={[styles.priceValue, styles.spareCarryPrice]}>
                    ${estimate.spareCarryPlanePrice.toFixed(2)}
                  </Text>
                  {estimate.savingsPlane > 0 && (
                    <Text style={styles.savingsBadge}>
                      Save ${estimate.savingsPlane.toFixed(2)} ({estimate.savingsPercentagePlane}%)
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* SpareCarry Boat Price */}
            <View style={[styles.priceRow, styles.spareCarryRow]}>
              <View style={styles.spareCarryLabel}>
                <MaterialIcons name="directions-boat" size={18} color="#14b8a6" />
                <Text style={styles.priceLabel}>SpareCarry (Boat):</Text>
              </View>
              <View style={styles.priceRight}>
                <Text style={[styles.priceValue, styles.spareCarryPrice]}>
                  ${estimate.spareCarryBoatPrice.toFixed(2)}
                </Text>
                {estimate.savingsBoat > 0 && (
                  <Text style={styles.savingsBadge}>
                    Save ${estimate.savingsBoat.toFixed(2)} ({estimate.savingsPercentageBoat}%)
                  </Text>
                )}
              </View>
            </View>

            {/* Best Savings */}
            {(estimate.savingsBoat > 0 || (estimate.canTransportByPlane && estimate.savingsPlane > 0)) && (
              <View style={styles.savingsRow}>
                <MaterialIcons name="savings" size={20} color="#14b8a6" />
                <Text style={styles.savingsText}>
                  Save up to ${Math.max(estimate.savingsBoat, estimate.canTransportByPlane ? estimate.savingsPlane : 0).toFixed(2)} with SpareCarry!
                </Text>
              </View>
            )}

            {/* Plane Restriction Warning */}
            {!estimate.canTransportByPlane && estimate.planeRestrictionReason && (
              <View style={styles.warningRow}>
                <MaterialIcons name="warning" size={18} color="#f59e0b" />
                <Text style={styles.warningText}>
                  {estimate.planeRestrictionReason}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.postRequestButton}
              onPress={handlePostRequest}
            >
              <MaterialIcons name="add-circle" size={20} color="#fff" />
              <Text style={styles.postRequestButtonText}>Post Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  dimensionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dimensionInput: {
    flex: 1,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  courierButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  courierButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  courierButtonActive: {
    borderColor: '#14b8a6',
    backgroundColor: '#e0f7fa',
  },
  courierButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  courierButtonTextActive: {
    color: '#14b8a6',
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  calculateButtonDisabled: {
    opacity: 0.6,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  totalRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 12,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spareCarryRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#14b8a6',
    marginTop: 8,
    paddingTop: 12,
  },
  spareCarryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  savingsBadge: {
    fontSize: 12,
    color: '#14b8a6',
    fontWeight: '600',
    marginTop: 2,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  spareCarryPrice: {
    color: '#14b8a6',
    fontSize: 18,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14b8a6',
  },
  postRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  postRequestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
});

