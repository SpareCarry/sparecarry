/**
 * Auth Callback Handler for Mobile (Expo)
 * Handles OAuth redirects and deep links
 */

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createClient } from '@sparecarry/lib/supabase';
import * as Linking from 'expo-linking';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const processAuthUrl = useCallback(async (url: string) => {
    const parsedUrl = Linking.parse(url);
    const queryParams = parsedUrl.queryParams || {};
    const fragment = (parsedUrl as Linking.ParsedURL & { fragment?: Record<string, any> }).fragment;

    if ((queryParams as Record<string, any>).error || fragment?.error) {
      const errorMsg =
        (queryParams as Record<string, any>).error_description ||
        fragment?.error_description ||
        'Authentication failed';
      setError(String(errorMsg));
      setStatus('error');
      return;
    }

    const accessToken = fragment?.access_token || queryParams?.access_token;
    const refreshToken = fragment?.refresh_token || queryParams?.refresh_token;

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: String(accessToken),
        refresh_token: String(refreshToken),
      });

      if (sessionError) {
        setError(sessionError.message);
        setStatus('error');
        return;
      }

      setStatus('success');
      router.replace('/(tabs)');
      return;
    }

    const code = fragment?.code || queryParams?.code;
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(String(code));
      if (exchangeError) {
        setError(exchangeError.message);
        setStatus('error');
        return;
      }

      setStatus('success');
      router.replace('/(tabs)');
      return;
    }

    setError('No authentication code found');
    setStatus('error');
  }, [router, supabase]);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = params.url as string | undefined;

        if (!url) {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            await processAuthUrl(initialUrl);
            return;
          }

          setError('No authentication URL found');
          setStatus('error');
          return;
        }

        await processAuthUrl(url);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [params, processAuthUrl]);

  // Listen for deep links while app is running
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      processAuthUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [processAuthUrl]);

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.text}>Completing authentication...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Authentication Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.link} onPress={() => router.replace('/auth/login')}>
          Return to Login
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.successText}>Authentication successful!</Text>
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
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  successText: {
    fontSize: 18,
    color: '#14b8a6',
    fontWeight: 'bold',
  },
  link: {
    color: '#14b8a6',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
});

