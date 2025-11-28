/**
 * Confirm Delivery Button - Mobile
 * Allows requester to confirm delivery and release payment
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@sparecarry/lib/supabase';

interface ConfirmDeliveryButtonMobileProps {
  matchId: string;
}

export function ConfirmDeliveryButtonMobile({ matchId }: ConfirmDeliveryButtonMobileProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    Alert.alert(
      'Confirm Delivery',
      'This will release payment to the traveler. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/confirm-delivery`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ matchId }),
                }
              );

              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to confirm delivery');
              }

              queryClient.invalidateQueries({ queryKey: ['match', matchId] });
              Alert.alert('Success', 'Payment released to traveler!');
            } catch (error: any) {
              console.error('Error confirming delivery:', error);
              Alert.alert('Error', error.message || 'Failed to confirm delivery');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <MaterialIcons name="check-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Confirm Delivery & Release Payment</Text>
          </>
        )}
      </TouchableOpacity>
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

