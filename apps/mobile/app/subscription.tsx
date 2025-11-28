/**
 * Subscription Management Page - Mobile
 * Manage SpareCarry Pro subscription
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@sparecarry/lib/supabase';
import { useAuth } from '@sparecarry/hooks/useAuth';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type SubscriptionStatus = {
  subscription_status?: 'active' | 'trialing' | 'canceled' | 'past_due' | null;
  subscription_current_period_end?: string | null;
  supporter_status?: 'active' | 'inactive' | null;
  supporter_expires_at?: string | null;
};

type LifetimeStatus = {
  lifetime_active?: boolean | null;
  lifetime_purchase_at?: string | null;
};

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  // Fetch subscription status
  const { data: userData, isLoading: userLoading } = useQuery<SubscriptionStatus | null>({
    queryKey: ['user-subscription-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('users')
        .select('subscription_status, subscription_current_period_end, supporter_status, supporter_expires_at')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching subscription status:', error);
        return null;
      }
      return (data ?? null) as SubscriptionStatus | null;
    },
    enabled: !!user,
    retry: false,
  });

  // Fetch lifetime status
  const { data: profileData } = useQuery<LifetimeStatus | null>({
    queryKey: ['profile-lifetime-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('lifetime_active, lifetime_purchase_at')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching lifetime status:', error);
        return null;
      }
      return (data ?? null) as LifetimeStatus | null;
    },
    enabled: !!user,
    retry: false,
  });

  const isSubscribed = userData?.subscription_status === 'active';
  const isTrialing = userData?.subscription_status === 'trialing';
  const isSupporter = userData?.supporter_status === 'active';
  const isLifetime = profileData?.lifetime_active === true;
  const hasPro = isSubscribed || isTrialing || isSupporter || isLifetime;

  const handleSubscribe = async (priceId: 'monthly' | 'yearly' | 'lifetime') => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to subscribe');
      router.push('/auth/login');
      return;
    }

    setLoading(priceId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'Please log in to subscribe');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscriptions/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ priceId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout');
      }

      const { url } = await response.json();
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open payment page');
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Failed to start subscription');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('manage');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'Please log in');
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscriptions/customer-portal`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();
      if (data.url) {
        const canOpen = await Linking.canOpenURL(data.url);
        if (canOpen) {
          await Linking.openURL(data.url);
        } else {
          Alert.alert('Error', 'Cannot open subscription portal');
        }
      } else {
        throw new Error(data.error || 'Failed to open portal');
      }
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Failed to open subscription portal');
    } finally {
      setLoading(null);
    }
  };

  if (userLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text style={styles.loadingText}>Loading...</Text>
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
          <Text style={styles.headerTitle}>SpareCarry Pro</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.description}>
          Unlock premium features and support the community courier ecosystem
        </Text>

        {hasPro ? (
          <View style={styles.statusCard}>
            {isLifetime ? (
              <>
                <MaterialIcons name="all-inclusive" size={32} color="#2563eb" />
                <Text style={styles.statusTitle}>You have Lifetime Access 🎉</Text>
                <Text style={styles.statusText}>
                  You've unlocked lifetime access to all Pro features. Thank you for supporting SpareCarry!
                </Text>
              </>
            ) : (
              <>
                <MaterialIcons name="check-circle" size={32} color="#10b981" />
                <Text style={styles.statusTitle}>
                  {isSupporter ? 'Supporter Active' : 'Active Subscription'}
                </Text>
                <Text style={styles.statusText}>
                  {isSupporter
                    ? `Your benefits are active until ${
                        userData?.supporter_expires_at
                          ? new Date(userData.supporter_expires_at).toLocaleDateString()
                          : 'next year'
                      }`
                    : `${isTrialing ? 'Trial' : 'Subscribed'} • Renews ${
                        userData?.subscription_current_period_end
                          ? new Date(userData.subscription_current_period_end).toLocaleDateString()
                          : 'soon'
                      }`}
                </Text>
              </>
            )}

            <View style={styles.benefitsList}>
              <Text style={styles.benefitsTitle}>Your Benefits:</Text>
              {[
                '0% platform fees',
                'Priority in feed',
                'Blue check badge',
                'Priority support',
                'Early access to features',
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={20} color="#14b8a6" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {!isLifetime && (isSubscribed || isTrialing) && (
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleManageSubscription}
                disabled={loading === 'manage'}
              >
                {loading === 'manage' ? (
                  <ActivityIndicator color="#14b8a6" />
                ) : (
                  <>
                    <MaterialIcons name="credit-card" size={20} color="#14b8a6" />
                    <Text style={styles.manageButtonText}>Manage Subscription</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.pricingCard}>
              <View style={styles.pricingHeader}>
                <MaterialIcons name="star" size={32} color="#14b8a6" />
                <Text style={styles.pricingTitle}>Monthly</Text>
                <Text style={styles.pricingPrice}>$6.99</Text>
                <Text style={styles.pricingPeriod}>per month</Text>
              </View>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => handleSubscribe('monthly')}
                disabled={loading === 'monthly'}
              >
                {loading === 'monthly' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.subscribeButtonText}>Subscribe Monthly</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.pricingCard}>
              <View style={styles.pricingHeader}>
                <MaterialIcons name="star" size={32} color="#14b8a6" />
                <Text style={styles.pricingTitle}>Yearly</Text>
                <Text style={styles.pricingPrice}>$59</Text>
                <Text style={styles.pricingPeriod}>per year</Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save 30%</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.subscribeButton}
                onPress={() => handleSubscribe('yearly')}
                disabled={loading === 'yearly'}
              >
                {loading === 'yearly' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.subscribeButtonText}>Subscribe Yearly</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.pricingCard, styles.lifetimeCard]}>
              <View style={styles.pricingHeader}>
                <MaterialIcons name="all-inclusive" size={32} color="#2563eb" />
                <Text style={styles.pricingTitle}>Lifetime</Text>
                <Text style={styles.pricingPrice}>$100</Text>
                <Text style={styles.pricingPeriod}>one-time payment</Text>
              </View>
              <TouchableOpacity
                style={[styles.subscribeButton, styles.lifetimeButton]}
                onPress={() => handleSubscribe('lifetime')}
                disabled={loading === 'lifetime'}
              >
                {loading === 'lifetime' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.subscribeButtonText}>Get Lifetime Access</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What is SpareCarry Pro?</Text>
            <Text style={styles.faqAnswer}>
              SpareCarry Pro is a subscription that gives you 0% platform fees, priority placement in search results, and a verified blue check badge.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How does priority in feed work?</Text>
            <Text style={styles.faqAnswer}>
              Your trips and requests appear at the top of search results, giving you better visibility and faster matches.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can cancel your subscription at any time through the subscription management portal. Your benefits will continue until the end of your billing period.
            </Text>
          </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  benefitsList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#14b8a6',
    width: '100%',
  },
  manageButtonText: {
    color: '#14b8a6',
    fontSize: 16,
    fontWeight: '600',
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lifetimeCard: {
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginTop: 8,
  },
  pricingPeriod: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  savingsBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  subscribeButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  lifetimeButton: {
    backgroundColor: '#2563eb',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  faqSection: {
    marginTop: 32,
    gap: 20,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  faqItem: {
    gap: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

