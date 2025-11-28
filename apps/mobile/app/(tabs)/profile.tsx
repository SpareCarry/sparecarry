/**
 * Profile Screen - Mobile
 * Enhanced profile with user management, subscription, and settings
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@sparecarry/lib/supabase';
import { useAuth } from '@sparecarry/hooks/useAuth';
import { usePushNotifications } from '@sparecarry/hooks/usePushNotifications';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ReferralCardMobile } from '../../components/referral/ReferralCardMobile';

type ProfileRecord = {
  phone?: string | null;
  bio?: string | null;
};

type UserRecord = {
  subscription_status?: string | null;
  supporter_status?: string | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const supabase = createClient();
  const { expoPushToken, registerToken, loading: pushLoading } = usePushNotifications();
  const [registering, setRegistering] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<ProfileRecord | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Error fetching profile:', error);
          return null;
        }
        return (data as ProfileRecord) || null;
      } catch (error) {
        console.warn('Exception fetching profile:', error);
        return null;
      }
    },
    enabled: !!user,
    retry: false,
  });

  const { data: userData } = useQuery<UserRecord | null>({
    queryKey: ['user-data', user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Error fetching user data:', error);
          return null;
        }
        return (data as UserRecord) || null;
      } catch (error) {
        console.warn('Exception fetching user data:', error);
        return null;
      }
    },
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (profile?.bio) {
      setBio(profile.bio);
    }
  }, [profile]);

  useEffect(() => {
    if (user && expoPushToken && !registering) {
      setRegistering(true);
      registerToken(user.id)
        .then(() => {
          console.log('Push token registered');
        })
        .catch((error) => {
          console.error('Failed to register push token:', error);
        })
        .finally(() => {
          setRegistering(false);
        });
    }
  }, [user, expoPushToken, registerToken, registering]);

  const handleSaveBio = async () => {
    if (!user) return;

    setSavingBio(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          bio: bio.trim() || null,
        });

      if (error) throw error;

      setEditingBio(false);
      Alert.alert('Success', 'Bio updated successfully');
    } catch (error: any) {
      console.error('Error saving bio:', error);
      Alert.alert('Error', error.message || 'Failed to save bio');
    } finally {
      setSavingBio(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  // Show loading only if auth is actually loading
  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If not logged in, show login prompt immediately (don't wait for profile)
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-off" size={64} color="#999" />
        <Text style={styles.errorText}>Not logged in</Text>
        <Text style={styles.errorSubtext}>
          Please log in to view and edit your profile.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show profile loading if user is logged in but profile is still loading
  if (profileLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const isPremium = userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing';
  const isSupporter = userData?.supporter_status === 'active';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialIcons name="account-circle" size={80} color="#14b8a6" />
        </View>
        <Text style={styles.name}>{user.email}</Text>
        {isPremium && (
          <View style={styles.badge}>
            <MaterialIcons name="star" size={16} color="#fff" />
            <Text style={styles.badgeText}>Pro</Text>
          </View>
        )}
        {isSupporter && (
          <View style={[styles.badge, styles.supporterBadge]}>
            <MaterialIcons name="favorite" size={16} color="#fff" />
            <Text style={styles.badgeText}>Supporter</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID:</Text>
          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
            {user.id}
          </Text>
        </View>
        {profile?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{profile.phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bio</Text>
          {!editingBio ? (
            <TouchableOpacity onPress={() => setEditingBio(true)}>
              <MaterialIcons name="edit" size={20} color="#14b8a6" />
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => {
                  setEditingBio(false);
                  setBio(profile?.bio || '');
                }}
              >
                <MaterialIcons name="close" size={20} color="#ef4444" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveBio} disabled={savingBio}>
                {savingBio ? (
                  <ActivityIndicator size="small" color="#14b8a6" />
                ) : (
                  <MaterialIcons name="check" size={20} color="#14b8a6" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        {editingBio ? (
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        ) : (
          <Text style={styles.bioText}>{profile?.bio || 'No bio yet'}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Push Notifications:</Text>
          {expoPushToken ? (
            <View style={styles.statusBadge}>
              <MaterialIcons name="check-circle" size={16} color="#14b8a6" />
              <Text style={styles.statusText}>Enabled</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusDisabled]}>
              <MaterialIcons name="cancel" size={16} color="#999" />
              <Text style={[styles.statusText, styles.statusTextDisabled]}>Disabled</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        {isPremium ? (
          <View style={styles.subscriptionCard}>
            <MaterialIcons name="star" size={24} color="#f59e0b" />
            <Text style={styles.subscriptionText}>Pro Member</Text>
            <Text style={styles.subscriptionSubtext}>
              Enjoy 0% platform fees and priority in feed
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => router.push('/subscription')}
          >
            <MaterialIcons name="star-outline" size={20} color="#fff" />
            <Text style={styles.subscribeButtonText}>Upgrade to Pro</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Referral Program */}
      <View style={styles.section}>
        <ReferralCardMobile />
      </View>

      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => router.push('/support')}
      >
        <MaterialIcons name="help-outline" size={20} color="#14b8a6" />
        <Text style={styles.supportButtonText}>Support & Disputes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <MaterialIcons name="logout" size={20} color="#ef4444" />
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  supporterBadge: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDisabled: {
    opacity: 0.6,
  },
  statusText: {
    fontSize: 14,
    color: '#14b8a6',
    fontWeight: '500',
  },
  statusTextDisabled: {
    color: '#999',
  },
  subscriptionCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  subscriptionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  subscriptionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    padding: 16,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#14b8a6',
  },
  supportButtonText: {
    color: '#14b8a6',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
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
});
