/**
 * My Stuff Screen - Mobile
 * Safe, clean implementation to unblock bundling.
 * Shows user's trips, requests, and matches.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@sparecarry/lib/supabase';
import { useAuth } from '@sparecarry/hooks/useAuth';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

type Trip = {
  id: string;
  from_location: string;
  to_location: string;
  departure_date?: string | null;
  eta_window_start?: string | null;
  eta_window_end?: string | null;
  status: string;
  type: string;
  spare_kg: number;
  created_at: string;
};

type Request = {
  id: string;
  title: string;
  from_location: string;
  to_location: string;
  deadline_latest: string;
  status: string;
  max_reward: number;
  created_at: string;
};

type Match = {
  id: string;
  status: string;
  reward_amount: number;
  updated_at: string;
  requests?: Request | Request[] | null;
  trips?: Trip | Trip[] | null;
};

type MyStuffData = {
  trips: Trip[];
  requests: Request[];
  matches: Match[];
};

function normalizeSingle<T>(value?: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

const matchStatusLabels: Record<string, string> = {
  pending: 'Pending',
  chatting: 'Chatting',
  escrow_paid: 'In Escrow',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

async function fetchMyStuff(userId: string): Promise<MyStuffData> {
  const supabase = createClient();

  const [tripsResult, requestsResult, matchesResult] = await Promise.all([
    supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('matches')
      .select(
        `
        *,
        requests(*),
        trips(*)
      `.trim(),
      )
      .or(`requester_id.eq.${userId},traveler_id.eq.${userId}`)
      .order('updated_at', { ascending: false }),
  ]);

  return {
    trips: (tripsResult.data as Trip[] | null) ?? [],
    requests: (requestsResult.data as Request[] | null) ?? [],
    matches: (matchesResult.data as Match[] | null) ?? [],
  };
}

export default function MyStuffScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery<MyStuffData>({
    queryKey: ['my-stuff', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('You need to be signed in to view this page.');
      }
      return fetchMyStuff(user.id);
    },
    enabled: !!user?.id,
    retry: 1,
    retryDelay: 1000,
  });

  const activeMatches = useMemo(() => {
    if (!data) return [];
    return data.matches.filter(
      (match) => match.status !== 'cancelled' && match.status !== 'completed',
    );
  }, [data]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="person-off" size={48} color="#999" />
          <Text style={styles.errorText}>Not logged in</Text>
          <Text style={styles.errorSubtext}>
            Please log in to view your trips, requests, and matches.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.retryButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text style={styles.loadingText}>Loading your stuff...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'Failed to load data'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#14b8a6"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Stuff</Text>
          <Text style={styles.subtitle}>
            Track everything you&apos;re carrying, requesting, and resolving.
          </Text>
        </View>

        {/* Overview */}
        <View style={styles.overviewRow}>
          <View style={styles.overviewCard}>
            <MaterialIcons name="inventory-2" size={24} color="#14b8a6" />
            <Text style={styles.overviewNumber}>{data.requests.length}</Text>
            <Text style={styles.overviewLabel}>Requests</Text>
          </View>
          <View style={styles.overviewCard}>
            <MaterialIcons name="flight" size={24} color="#14b8a6" />
            <Text style={styles.overviewNumber}>{data.trips.length}</Text>
            <Text style={styles.overviewLabel}>Trips</Text>
          </View>
          <View style={styles.overviewCard}>
            <MaterialIcons name="chat" size={24} color="#14b8a6" />
            <Text style={styles.overviewNumber}>{activeMatches.length}</Text>
            <Text style={styles.overviewLabel}>Active</Text>
          </View>
        </View>

        {/* Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Requests</Text>
          {data.requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No requests yet</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/post-request')}
              >
                <Text style={styles.actionButtonText}>Post Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            data.requests.map((request) => (
              <TouchableOpacity key={request.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{request.title}</Text>
                  <View style={[styles.statusBadge, styles.statusOpen]}>
                    <Text style={styles.statusText}>{request.status}</Text>
                  </View>
                </View>
                <Text style={styles.itemLocation}>
                  {request.from_location} → {request.to_location}
                </Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemReward}>${request.max_reward}</Text>
                  <Text style={styles.itemDate}>
                    {format(new Date(request.deadline_latest), 'MMM d, yyyy')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Trips</Text>
          {data.trips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No trips yet</Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/post-trip')}
              >
                <Text style={styles.actionButtonText}>Post Trip</Text>
              </TouchableOpacity>
            </View>
          ) : (
            data.trips.map((trip) => (
              <TouchableOpacity key={trip.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <MaterialIcons
                    name={trip.type === 'plane' ? 'flight' : 'directions-boat'}
                    size={20}
                    color="#14b8a6"
                  />
                  <Text style={styles.itemTitle}>
                    {trip.from_location} → {trip.to_location}
                  </Text>
                  <View style={[styles.statusBadge, styles.statusActive]}>
                    <Text style={styles.statusText}>{trip.status}</Text>
                  </View>
                </View>
                <Text style={styles.itemCapacity}>
                  {trip.spare_kg}kg available
                </Text>
                <Text style={styles.itemDate}>
                  {trip.departure_date
                    ? format(new Date(trip.departure_date), 'MMM d, yyyy')
                    : trip.eta_window_start
                      ? `${format(
                          new Date(trip.eta_window_start),
                          'MMM d',
                        )} - ${format(
                          new Date(
                            trip.eta_window_end || trip.eta_window_start,
                          ),
                          'MMM d',
                        )}`
                      : 'Flexible'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Matches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matches & Chats</Text>
          {data.matches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No matches yet</Text>
              <Text style={styles.emptySubtext}>
                Once someone connects with your request or trip, the chat will show up here.
              </Text>
            </View>
          ) : (
            data.matches.map((match) => {
              const request = normalizeSingle(match.requests);
              const trip = normalizeSingle(match.trips);
              return (
                <TouchableOpacity
                  key={match.id}
                  style={styles.itemCard}
                  onPress={() => router.push(`/messages/${match.id}`)}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>
                      {request
                        ? request.title
                        : `${trip?.from_location} → ${trip?.to_location}`}
                    </Text>
                    <View style={[styles.statusBadge, styles.statusChatting]}>
                      <Text style={styles.statusText}>
                        {matchStatusLabels[match.status] || match.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemReward}>${match.reward_amount}</Text>
                  <Text style={styles.itemDate}>
                    Updated {format(new Date(match.updated_at), 'MMM d, yyyy')}
                  </Text>
                </TouchableOpacity>
              );
            })
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  overviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#f0fdfa',
  },
  statusActive: {
    backgroundColor: '#eff6ff',
  },
  statusChatting: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  itemLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemCapacity: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemReward: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14b8a6',
  },
  itemDate: {
    fontSize: 12,
    color: '#666',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#14b8a6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


