/**
 * 404 Not Found screen for Expo Router
 * This catches all unmatched routes
 */

import { View, Text, StyleSheet, Button } from 'react-native';
import { useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    // Log 404 to console (appears in Metro terminal - Expo Go)
    const routeInfo = {
      pathname: pathname || 'unknown',
      segments: segments.join('/') || '(empty)',
      timestamp: new Date().toISOString(),
    };

    // Make it VERY visible in Metro terminal - use console.error for visibility
    console.error('');
    console.error('========================================');
    console.error('❌❌❌ 404 PAGE NOT FOUND ❌❌❌');
    console.error('========================================');
    console.error('');
    console.error('Pathname:', pathname || '(no pathname)');
    console.error('Segments:', segments.length > 0 ? segments.join('/') : '(empty array)');
    console.error('Full route:', routeInfo.segments);
    console.error('Timestamp:', routeInfo.timestamp);
    console.error('');
    console.error('💡 CHECK METRO TERMINAL FOR THIS ERROR');
    console.error('💡 This should appear in the terminal where you ran pnpm start');
    console.error('');
    console.error('Available routes:');
    console.error('  - / (index.tsx)');
    console.error('  - /(tabs)');
    console.error('  - /(tabs)/index');
    console.error('  - /(tabs)/profile');
    console.error('  - /auth/login');
    console.error('  - /auth/callback');
    console.error('');
    console.error('========================================');
    console.error('');
    
    // Also log via mobileLogger (import if needed)
    try {
      const { mobileLogger } = require('../lib/logger');
      mobileLogger.error('404 Page Not Found', {
        route: routeInfo.segments,
        pathname: routeInfo.pathname,
      });
    } catch (e) {
      console.error('Could not load mobileLogger:', e);
    }
  }, [pathname, segments]);

  const routeDisplay = pathname || segments.join('/') || '(empty)';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>Page Not Found</Text>
      <Text style={styles.message}>
        The page you're looking for doesn't exist.
      </Text>
      
      {/* Make route info VERY visible */}
      <View style={styles.routeBox}>
        <Text style={styles.routeLabel}>Failing Route:</Text>
        <Text style={styles.route} selectable>
          {routeDisplay}
        </Text>
        {segments.length > 0 && (
          <>
            <Text style={styles.routeLabel}>Segments:</Text>
            <Text style={styles.route} selectable>
              {segments.join(' → ')}
            </Text>
          </>
        )}
      </View>

      <Text style={styles.helpText}>
        Please share this route information so we can fix it!
      </Text>

      <View style={styles.buttons}>
        <Button title="Go Home" onPress={() => router.replace('/(tabs)')} />
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  routeBox: {
    width: '90%',
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginTop: 8,
    marginBottom: 4,
  },
  route: {
    fontSize: 16,
    color: '#78350f',
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
});

