import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { router } from "expo-router";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signUp, signInWithOAuth, loading } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    setError(null);

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const { error: signUpError } = await signUp(email, password);
    if (signUpError) {
      setError(signUpError.message || "Sign up failed. Please try again.");
      return;
    }

    Alert.alert(
      "Check your email",
      "We sent you a confirmation link. Please confirm your email, then log in.",
      [{ text: "OK", onPress: () => router.replace("/auth/login") }]
    );
  };

  const handleOAuthSignup = async (provider: "google" | "apple" | "github") => {
    setError(null);
    const { error: oauthError } = await signInWithOAuth(provider);
    if (oauthError) {
      setError(
        oauthError.message ||
          `Failed to sign up with ${provider}. Please try again.`
      );
    }
    // OAuth opens browser - user will be redirected back via deep link
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={[styles.input, error && !email && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />
        <TextInput
          style={[styles.input, error && !password && styles.inputError]}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(null);
          }}
          secureTextEntry
          autoComplete="password-new"
          editable={!loading}
        />
        <TextInput
          style={[
            styles.input,
            error && password !== confirmPassword && styles.inputError,
          ]}
          placeholder="Confirm Password"
          placeholderTextColor="#9ca3af"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setError(null);
          }}
          secureTextEntry
          autoComplete="password-new"
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.oauthButton, loading && styles.buttonDisabled]}
          onPress={() => handleOAuthSignup("google")}
          disabled={loading}
        >
          <Text style={styles.oauthButtonText}>Sign up with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace("/auth/login")}
          disabled={loading}
        >
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 32,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#14b8a6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#6b7280",
    fontSize: 14,
  },
  oauthButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  oauthButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 16,
  },
  linkButton: {
    marginTop: 8,
    paddingVertical: 12,
  },
  linkText: {
    color: "#14b8a6",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "500",
  },
});
