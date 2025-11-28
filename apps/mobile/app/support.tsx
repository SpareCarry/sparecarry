/**
 * Support & Disputes Page - Mobile
 * Contact support and manage disputes
 */

import { useState } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@sparecarry/lib/supabase';
import { useAuth } from '@sparecarry/hooks/useAuth';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

interface DisputeRecord {
  id: string;
  match_id: string;
  reason: string;
  status: 'open' | 'resolved' | 'rejected';
  resolution_notes?: string | null;
  created_at: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Fetch user's disputes
  const { data: disputes, isLoading: disputesLoading } = useQuery<DisputeRecord[]>({
    queryKey: ['user-disputes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .or(`opened_by.eq.${user.id},match_id.in.(select id from matches where requester_id.eq.${user.id} or traveler_id.eq.${user.id})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DisputeRecord[];
    },
    enabled: !!user?.id,
  });

  // Submit support ticket mutation
  const submitSupportMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim() || !message.trim()) {
        throw new Error('Please fill in all fields');
      }

      const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:3000'}/api/support/contact`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            subject: subject.trim(),
            message: message.trim(),
            userEmail: user?.email,
            userId: user?.id,
            matchId: selectedMatchId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send support request');
      }

      return ticketId;
    },
    onSuccess: (ticketId) => {
      setSubject('');
      setMessage('');
      setShowSupportForm(false);
      Alert.alert('Success', `Support request submitted! Ticket: ${ticketId}`);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to submit support request');
    },
  });

  // Open dispute mutation
  const openDisputeMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!reason.trim()) {
        throw new Error('Please describe what went wrong.');
      }

      if (!user) throw new Error('Not authenticated');
      if (!selectedMatchId) throw new Error('No match selected');

      const { error } = await supabase.from('disputes').insert({
        match_id: selectedMatchId,
        opened_by: user.id,
        reason: reason.trim(),
        status: 'open',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setDisputeReason('');
      setShowDisputeForm(false);
      setSelectedMatchId(null);
      queryClient.invalidateQueries({ queryKey: ['user-disputes', user?.id] });
      Alert.alert('Success', 'Dispute submitted. Our support team will reach out shortly.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Unable to submit dispute. Please try again.');
    },
  });

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="person-off" size={48} color="#999" />
          <Text style={styles.errorText}>Please log in to access support</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support & Disputes</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Support Form */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="help-outline" size={24} color="#14b8a6" />
            <Text style={styles.sectionTitle}>Contact Support</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Have a question or need help? Send us a message and we'll get back to you.
          </Text>

          {showSupportForm ? (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Subject *"
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Message *"
                placeholderTextColor="#999"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowSupportForm(false);
                    setSubject('');
                    setMessage('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => submitSupportMutation.mutate()}
                  disabled={submitSupportMutation.isPending}
                >
                  {submitSupportMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Send</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSupportForm(true)}
            >
              <MaterialIcons name="mail-outline" size={20} color="#14b8a6" />
              <Text style={styles.actionButtonText}>Send Support Message</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Disputes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="gavel" size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Your Disputes</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Track and manage disputes for your deliveries.
          </Text>

          {disputesLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#14b8a6" />
            </View>
          ) : disputes && disputes.length > 0 ? (
            <View style={styles.disputesList}>
              {disputes.map((dispute) => (
                <View key={dispute.id} style={styles.disputeCard}>
                  <View style={styles.disputeHeader}>
                    <View style={[
                      styles.statusBadge,
                      dispute.status === 'open' && styles.statusBadgeOpen,
                      dispute.status === 'resolved' && styles.statusBadgeResolved,
                      dispute.status === 'rejected' && styles.statusBadgeRejected,
                    ]}>
                      <Text style={styles.statusBadgeText}>{dispute.status}</Text>
                    </View>
                    <Text style={styles.disputeDate}>
                      {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                    </Text>
                  </View>
                  <Text style={styles.disputeReason}>{dispute.reason}</Text>
                  {dispute.resolution_notes && (
                    <View style={styles.resolutionNotes}>
                      <Text style={styles.resolutionNotesTitle}>Resolution:</Text>
                      <Text style={styles.resolutionNotesText}>{dispute.resolution_notes}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="check-circle-outline" size={48} color="#10b981" />
              <Text style={styles.emptyStateText}>No disputes</Text>
              <Text style={styles.emptyStateSubtext}>All clear! You have no open disputes.</Text>
            </View>
          )}

          {showDisputeForm ? (
            <View style={styles.form}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={disputeReason}
                onChangeText={setDisputeReason}
                placeholder="Describe the issue so we can help... *"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDisputeForm(false);
                    setDisputeReason('');
                    setSelectedMatchId(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => openDisputeMutation.mutate(disputeReason)}
                  disabled={openDisputeMutation.isPending || !disputeReason.trim()}
                >
                  {openDisputeMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="gavel" size={20} color="#fff" />
                      <Text style={styles.submitButtonText}>Open Dispute</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.disputeButton]}
              onPress={() => {
                // In a real app, you'd select a match first
                Alert.alert(
                  'Open Dispute',
                  'To open a dispute, go to the chat screen for the match and use the dispute option there.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <MaterialIcons name="gavel" size={20} color="#f59e0b" />
              <Text style={[styles.actionButtonText, styles.disputeButtonText]}>Open New Dispute</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Prefer Email?</Text>
          <Text style={styles.contactEmail}>support@sparecarry.com</Text>
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
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 16,
    backgroundColor: '#14b8a6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  actionButtonText: {
    color: '#14b8a6',
    fontSize: 16,
    fontWeight: '600',
  },
  disputeButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  disputeButtonText: {
    color: '#f59e0b',
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 120,
  },
  formButtons: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disputesList: {
    gap: 12,
    marginBottom: 16,
  },
  disputeCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disputeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeOpen: {
    backgroundColor: '#fef3c7',
  },
  statusBadgeResolved: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeRejected: {
    backgroundColor: '#fee2e2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  disputeDate: {
    fontSize: 12,
    color: '#666',
  },
  disputeReason: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  resolutionNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  resolutionNotesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  resolutionNotesText: {
    fontSize: 14,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contactTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 16,
    color: '#14b8a6',
    fontWeight: '600',
  },
});

