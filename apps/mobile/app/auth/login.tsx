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
import { useState, useEffect } from "react";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

type LoginMethod = "magic" | "password";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("magic");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkCooldown, setMagicLinkCooldown] = useState(0);
  const { signIn, signInWithOAuth, signInWithMagicLink, loading } = useAuth();

  // Magic link cooldown timer
  useEffect(() => {
    if (magicLinkCooldown <= 0) return;
    const timer = setInterval(() => {
      setMagicLinkCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [magicLinkCooldown]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordLogin = async () => {
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

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(
        signInError.message || "Login failed. Please check your credentials."
      );
    } else {
      // Wait a moment for session to be established
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 300);
    }
  };

  const handleMagicLogin = async () => {
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    const { error: magicLinkError } = await signInWithMagicLink(email);
    if (magicLinkError) {
      setError(magicLinkError.message || "Failed to send magic link. Please try again.");
    } else {
      setMagicLinkCooldown(60); // 60 second cooldown
      Alert.alert(
        "Check your email",
        "We sent you a magic link to log in. Click the link in your email to continue. The link expires in 1 hour.",
        [{ text: "OK" }]
      );
    }
  };

  const handleOAuthLogin = async (provider: "google" | "apple" | "github") => {
    setError(null);
    const { error: oauthError } = await signInWithOAuth(provider);
    if (oauthError) {
      setError(
        oauthError.message ||
          `Failed to sign in with ${provider}. Please try again.`
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Login method toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMethod === "magic" && styles.toggleButtonActive,
            ]}
            onPress={() => {
              setLoginMethod("magic");
              setError(null);
            }}
            disabled={loading}
          >
            <Text
              style={[
                styles.toggleText,
                loginMethod === "magic" && styles.toggleTextActive,
              ]}
            >
              Magic link
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              loginMethod === "password" && styles.toggleButtonActive,
            ]}
            onPress={() => {
              setLoginMethod("password");
              setError(null);
            }}
            disabled={loading}
          >
            <Text
              style={[
                styles.toggleText,
                loginMethod === "password" && styles.toggleTextActive,
              ]}
            >
              Password
            </Text>
          </TouchableOpacity>
        </View>

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

        {loginMethod === "password" && (
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput, error && !password && styles.inputError]}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError(null);
              }}
              secureTextEntry={!showPassword}
              autoComplete="password"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={20}
                color="#6b7280"
              />
            </TouchableOpacity>
          </View>
        )}

        {loginMethod === "password" ? (
          <>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handlePasswordLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.push("/auth/reset-password")}
              disabled={loading}
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, (loading || magicLinkCooldown > 0) && styles.buttonDisabled]}
            onPress={handleMagicLogin}
            disabled={loading || magicLinkCooldown > 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : magicLinkCooldown > 0 ? (
              <Text style={styles.buttonText}>Resend in {magicLinkCooldown}s</Text>
            ) : (
              <Text style={styles.buttonText}>Send Magic Link</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.oauthButton, loading && styles.buttonDisabled]}
          onPress={() => handleOAuthLogin("google")}
          disabled={loading}
        >
          <Text style={styles.oauthButtonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace("/auth/signup")}
          disabled={loading}
        >
          <Text style={styles.linkText}>Need an account? Sign up</Text>
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
  toggleRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  toggleTextActive: {
    fontWeight: "bold",
    color: "#14b8a6",
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
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
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
