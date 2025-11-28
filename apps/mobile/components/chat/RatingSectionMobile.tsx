/**
 * Rating Section - Mobile
 * Allows users to rate their delivery experience
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@sparecarry/lib/supabase';
import { useAuth } from '@sparecarry/hooks/useAuth';

interface RatingSectionMobileProps {
  matchId: string;
  otherUserId?: string;
}

export function RatingSectionMobile({ matchId, otherUserId }: RatingSectionMobileProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: existingRating } = useQuery({
    queryKey: ['rating', matchId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('ratings')
        .select('*')
        .eq('match_id', matchId)
        .eq('rater_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!matchId,
  });

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || '');
    }
  }, [existingRating]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!otherUserId) {
      Alert.alert('Error', 'Cannot submit rating');
      return;
    }

    setLoading(true);
    try {
      if (existingRating) {
        const { error } = await supabase
          .from('ratings')
          .update({
            rating,
            comment: comment || null,
          })
          .eq('id', existingRating.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('ratings').insert({
          match_id: matchId,
          rater_id: user!.id,
          ratee_id: otherUserId,
          rating,
          comment: comment || null,
        });

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['rating', matchId, user?.id] });
      setModalOpen(false);
      Alert.alert('Success', 'Rating submitted!');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', error.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          <MaterialIcons name="star" size={24} color="#fbbf24" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>Rate this delivery</Text>
            <Text style={styles.subtitle}>
              {existingRating ? 'Update your feedback anytime.' : 'Share feedback so others know what to expect.'}
            </Text>
          </View>
        </View>
        {existingRating && (
          <View style={styles.existingRating}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <MaterialIcons
                  key={star}
                  name={star <= existingRating.rating ? 'star' : 'star-border'}
                  size={16}
                  color="#fbbf24"
                />
              ))}
            </View>
            {existingRating.comment && (
              <Text style={styles.existingComment}>{existingRating.comment}</Text>
            )}
          </View>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalOpen(true)}
          disabled={!otherUserId}
        >
          <Text style={styles.buttonText}>
            {existingRating ? 'Update Rating' : 'Leave a Rating'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Experience</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>How was your experience with this delivery?</Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <MaterialIcons
                    name={star <= rating ? 'star' : 'star-border'}
                    size={48}
                    color={star <= rating ? '#fbbf24' : '#d1d5db'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Comment (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={rating === 0 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {existingRating ? 'Update' : 'Submit'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  existingRating: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  existingComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  commentInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

