/**
 * Auth routes layout
 * Handles login and callback screens
 */

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="callback" 
        options={{ 
          title: 'Auth Callback',
          headerShown: true,
        }}
      />
    </Stack>
  );
}

