/**
 * Browse/Feed Screen - Mobile
 * Shows trips and requests with infinite scroll
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { createClient } from '@sparecarry/lib/supabase';
import { useAuth } from '@sparecarry/hooks/useAuth';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

interface FeedItem {
  id: string;
  type: 'trip' | 'request';
  from_location: string;
  to_location: string;
  departure_date?: string;
  eta_window_start?: string;
  eta_window_end?: string;
  deadline_earliest?: string;
  deadline_latest?: string;
  reward_amount?: number;
  spare_kg?: number;
  spare_volume_liters?: number;
  max_reward?: number;
  match_score?: number;
  user_id: string;
  created_at: string;
  user_verified_sailor?: boolean;
  user_verified_identity?: boolean;
  user_subscribed?: boolean;
  user_supporter?: boolean;
  emergency?: boolean;
}

async function fetchFeed(page: number = 0, userId?: string): Promise<{
  items: FeedItem[];
  hasMore: boolean;
}> {
  try {
    const supabase = createClient();
    const pageSize = 10;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const [tripsResult, requestsResult] = await Promise.allSettled([
      supabase
        .from('trips')
        .select(`
          *,
          users!trips_user_id_fkey(subscription_status, supporter_status)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to),
      supabase
        .from('requests')
        .select(`
          *,
          users!requests_user_id_fkey(subscription_status, supporter_status)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .range(from, to),
    ]);

    const trips = tripsResult.status === 'fulfilled' ? tripsResult.value.data || [] : [];
    const requests = requestsResult.status === 'fulfilled' ? requestsResult.value.data || [] : [];

    // Fetch profiles for verification badges
    const userIds = [
      ...(trips || []).map((t: any) => t.user_id),
      ...(requests || []).map((r: any) => r.user_id),
    ];
    const uniqueUserIds = [...new Set(userIds)];

    let profilesMap = new Map();
    if (uniqueUserIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, verified_sailor_at, stripe_identity_verified_at')
          .in('user_id', uniqueUserIds);

        profilesMap = new Map(
          (profiles || []).map((p: any) => [
            p.user_id,
            {
              verified_sailor: !!p.verified_sailor_at,
              verified_identity: !!p.stripe_identity_verified_at,
            },
          ])
        );
      } catch (error) {
        console.warn('Error fetching profiles:', error);
      }
    }

    const tripItems: FeedItem[] = (trips || [])
      .filter((trip: any) => trip && trip.id && trip.user_id)
      .map((trip: any) => {
        const profile = profilesMap.get(trip.user_id);
        const user = Array.isArray(trip.users) ? trip.users[0] : trip.users;
        const isSubscriber = user?.subscription_status === 'active' || user?.subscription_status === 'trialing';
        const isSupporter = user?.supporter_status === 'active';
        return {
          id: trip.id,
          type: 'trip' as const,
          from_location: trip.from_location || '',
          to_location: trip.to_location || '',
          departure_date: trip.departure_date,
          eta_window_start: trip.eta_window_start,
          eta_window_end: trip.eta_window_end,
          spare_kg: trip.spare_kg,
          spare_volume_liters: trip.spare_volume_liters,
          user_id: trip.user_id,
          created_at: trip.created_at || new Date().toISOString(),
          match_score: isSupporter ? 2000 : isSubscriber ? 1000 : 0,
          user_verified_sailor: profile?.verified_sailor || false,
          user_verified_identity: profile?.verified_identity || false,
          user_subscribed: isSubscriber || false,
          user_supporter: isSupporter || false,
        };
      });

    const requestItems: FeedItem[] = (requests || [])
      .filter((request: any) => request && request.id && request.user_id)
      .map((request: any) => {
        const profile = profilesMap.get(request.user_id);
        const user = Array.isArray(request.users) ? request.users[0] : request.users;
        const isSubscriber = user?.subscription_status === 'active' || user?.subscription_status === 'trialing';
        const isSupporter = user?.supporter_status === 'active';
        return {
          id: request.id,
          type: 'request' as const,
          from_location: request.from_location || '',
          to_location: request.to_location || '',
          deadline_earliest: request.deadline_earliest,
          deadline_latest: request.deadline_latest,
          max_reward: request.max_reward,
          user_id: request.user_id,
          created_at: request.created_at || new Date().toISOString(),
          match_score: isSupporter ? 2000 : isSubscriber ? 1000 : 0,
          user_verified_sailor: profile?.verified_sailor || false,
          user_verified_identity: profile?.verified_identity || false,
          emergency: request.emergency || false,
          user_subscribed: isSubscriber || false,
          user_supporter: isSupporter || false,
        };
      });

    const allItems = [...tripItems, ...requestItems].sort((a, b) => {
      if (a.user_supporter && !b.user_supporter) return -1;
      if (!a.user_supporter && b.user_supporter) return 1;
      if (a.user_subscribed && !b.user_subscribed) return -1;
      if (!a.user_subscribed && b.user_subscribed) return 1;
      if (a.match_score && b.match_score) {
        return b.match_score - a.match_score;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return {
      items: allItems.slice(0, pageSize),
      hasMore: allItems.length >= pageSize,
    };
  } catch (error) {
    console.error('Error in fetchFeed:', error);
    return {
      items: [],
      hasMore: false,
    };
  }
}

const FeedItemCard = React.memo(({ item, onPress }: { item: FeedItem; onPress: () => void }) => {
  const isTrip = item.type === 'trip';
  const dateStr = isTrip
    ? item.departure_date
      ? format(new Date(item.departure_date), 'MMM d, yyyy')
      : item.eta_window_start
        ? `${format(new Date(item.eta_window_start), 'MMM d')} - ${format(new Date(item.eta_window_end || item.eta_window_start), 'MMM d')}`
        : 'Flexible'
    : item.deadline_latest
      ? `Deadline: ${format(new Date(item.deadline_latest), 'MMM d, yyyy')}`
      : 'No deadline';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <MaterialIcons
            name={isTrip ? 'flight' : 'inventory-2'}
            size={24}
            color="#14b8a6"
          />
          <View style={styles.badgeContainer}>
            {item.user_supporter ? (
              <View style={[styles.badge, styles.supporterBadge]}>
                <MaterialIcons name="star" size={12} color="#fff" />
              </View>
            ) : null}
            {item.user_verified_identity ? (
              <View style={[styles.badge, styles.verifiedBadge]}>
                <MaterialIcons name="verified" size={12} color="#fff" />
              </View>
            ) : null}
            {item.emergency ? (
              <View style={[styles.badge, styles.emergencyBadge]}>
                <MaterialIcons name="flash-on" size={12} color="#fff" />
              </View>
            ) : null}
          </View>
        </View>
        {item.match_score && item.match_score > 0 ? (
          <View style={styles.matchScore}>
            <Text style={styles.matchScoreText}>{item.match_score}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.locationText}>
          {item.from_location || 'Unknown'} → {item.to_location || 'Unknown'}
        </Text>
        <Text style={styles.dateText}>{dateStr || 'No date'}</Text>

        {isTrip ? (
          <View style={styles.capacityRow}>
            <Text style={styles.capacityText}>
              {item.spare_kg ? `${item.spare_kg}kg` : 'Capacity available'}
            </Text>
            {item.spare_volume_liters ? (
              <Text style={styles.capacityText}>
                {item.spare_volume_liters}L
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.rewardRow}>
            <MaterialIcons name="attach-money" size={16} color="#14b8a6" />
            <Text style={styles.rewardText}>
              ${item.max_reward?.toFixed(0) || '0'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function BrowseScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery<{
    items: FeedItem[];
    hasMore: boolean;
  }>({
    queryKey: ['feed', user?.id],
    queryFn: ({ pageParam = 0 }) => fetchFeed(pageParam as number, user?.id),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // Memoize items processing to avoid recalculating on every render
  const items = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) || [];
  }, [data?.pages]);

  const handleItemPress = useCallback(
    (item: FeedItem) => {
      // Navigate to detail screen
      router.push({
        pathname: '/feed-detail',
        params: {
          id: item.id,
          type: item.type,
        },
      } as any);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <FeedItemCard item={item} onPress={() => handleItemPress(item)} />
    ),
    [handleItemPress]
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#14b8a6" />
      </View>
    );
  }, [isFetchingNextPage]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load feed</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="inbox" size={64} color="#999" />
        <Text style={styles.emptyText}>No items found</Text>
        <Text style={styles.emptySubtext}>
          Be the first to post a request or trip!
        </Text>
        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={() => router.push('/(tabs)/post-request')}
          >
            <MaterialIcons name="add-circle" size={20} color="#fff" />
            <Text style={styles.emptyActionButtonText}>Post Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emptyActionButton, styles.emptyActionButtonSecondary]}
            onPress={() => router.push('/(tabs)/post-trip')}
          >
            <MaterialIcons name="flight-takeoff" size={20} color="#14b8a6" />
            <Text
              style={[
                styles.emptyActionButtonText,
                styles.emptyActionButtonTextSecondary,
              ]}
            >
              Post Trip
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#14b8a6"
          />
        }
      />
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supporterBadge: {
    backgroundColor: '#f59e0b',
  },
  verifiedBadge: {
    backgroundColor: '#14b8a6',
  },
  emergencyBadge: {
    backgroundColor: '#ef4444',
  },
  matchScore: {
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  matchScoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  capacityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f7fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capacityText: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '500',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14b8a6',
  },
  emergencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emergencyTagText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
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
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#14b8a6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyActionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  emptyActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyActionButtonTextSecondary: {
    color: '#14b8a6',
  },
});
