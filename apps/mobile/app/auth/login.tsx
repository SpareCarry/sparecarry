import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@sparecarry/hooks/useAuth';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signInWithOAuth, loading } = useAuth();

  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    if (error) {
      alert(error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'github') => {
    const { error } = await signInWithOAuth(provider);
    if (error) {
      alert(error.message);
    }
    // OAuth redirects to browser, then back to app via deep link
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Login'}</Text>
      </TouchableOpacity>
      
      <Text style={styles.divider}>or</Text>
      
      <TouchableOpacity style={styles.oauthButton} onPress={() => handleOAuthLogin('google')} disabled={loading}>
        <Text style={styles.oauthButtonText}>Sign in with Google</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    width: '100%',
    height: 40,
    backgroundColor: '#14b8a6',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
    textAlign: 'center',
    color: '#666',
  },
  oauthButton: {
    width: '100%',
    height: 40,
    backgroundColor: '#4285f4',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  oauthButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

