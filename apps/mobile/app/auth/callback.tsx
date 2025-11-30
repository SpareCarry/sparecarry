/**
 * Auth Callback Handler for Mobile (Expo)
 * Handles OAuth redirects, magic links, and deep links
 */

import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createClient } from "@sparecarry/lib/supabase";
import * as Linking from "expo-linking";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const processAuthUrl = useCallback(
    async (url: string) => {
      try {
        const parsedUrl = Linking.parse(url);
        const queryParams = parsedUrl.queryParams || {};
        const fragment = (
          parsedUrl as Linking.ParsedURL & { fragment?: Record<string, any> }
        ).fragment;

        // Check for errors first
        const errorParam =
          (queryParams as Record<string, any>).error || fragment?.error;
        if (errorParam) {
          const errorMsg =
            (queryParams as Record<string, any>).error_description ||
            fragment?.error_description ||
            String(errorParam) ||
            "Authentication failed";
          setError(String(errorMsg));
          setStatus("error");
          return;
        }

        // Try to get tokens directly (implicit flow or deep link from web callback)
        const accessToken =
          fragment?.access_token ||
          (queryParams as Record<string, any>).access_token;
        const refreshToken =
          fragment?.refresh_token ||
          (queryParams as Record<string, any>).refresh_token;

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: String(accessToken),
            refresh_token: String(refreshToken),
          });

          if (sessionError) {
            setError(sessionError.message);
            setStatus("error");
            return;
          }

          // Verify session was set
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            setError("Session not established");
            setStatus("error");
            return;
          }

          setStatus("success");
          // Get redirect path from params or default to tabs
          const redirectTo =
            (queryParams as Record<string, any>).redirect || "/(tabs)";
          setTimeout(() => {
            router.replace(redirectTo as any);
          }, 500);
          return;
        }

        // Try to get code (PKCE flow)
        const code =
          fragment?.code || (queryParams as Record<string, any>).code;
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(String(code));
          if (exchangeError) {
            setError(exchangeError.message);
            setStatus("error");
            return;
          }

          // Verify session was set
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            setError("Session not established after code exchange");
            setStatus("error");
            return;
          }

          setStatus("success");
          const redirectTo =
            (queryParams as Record<string, any>).redirect || "/(tabs)";
          setTimeout(() => {
            router.replace(redirectTo as any);
          }, 500);
          return;
        }

        // If no tokens or code, check if session already exists (might have been set automatically)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setStatus("success");
          const redirectTo =
            (queryParams as Record<string, any>).redirect || "/(tabs)";
          setTimeout(() => {
            router.replace(redirectTo as any);
          }, 500);
          return;
        }

        setError("No authentication code or tokens found");
        setStatus("error");
      } catch (err: any) {
        console.error("Auth callback processing error:", err);
        setError(err.message || "Failed to process authentication");
        setStatus("error");
      }
    },
    [router, supabase]
  );

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have params from deep link (access_token, refresh_token, code, etc.)
        const hasAuthParams =
          params.access_token ||
          params.refresh_token ||
          params.code ||
          params.error;

        if (hasAuthParams) {
          // Build URL from params for processing
          const url = `sparecarry://auth/callback?${Object.entries(params)
            .map(
              ([key, value]) => `${key}=${encodeURIComponent(String(value))}`
            )
            .join("&")}`;
          await processAuthUrl(url);
          return;
        }

        // Try to get URL from params.url (fallback)
        const url = params.url as string | undefined;
        if (url) {
          await processAuthUrl(url);
          return;
        }

        // Try to get initial URL (app opened from deep link)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && initialUrl.includes("auth/callback")) {
          await processAuthUrl(initialUrl);
          return;
        }

        // No auth params found - check if already authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setStatus("success");
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 500);
          return;
        }

        setError("No authentication information found");
        setStatus("error");
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed");
        setStatus("error");
      }
    };

    handleCallback();
  }, [params, processAuthUrl, router, supabase]);

  // Listen for deep links while app is running
  useEffect(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      processAuthUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [processAuthUrl]);

  if (status === "loading") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.text}>Completing authentication...</Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Authentication Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/auth/login")}
        >
          <Text style={styles.buttonText}>Return to Login</Text>
        </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  successText: {
    fontSize: 18,
    color: "#14b8a6",
    fontWeight: "bold",
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
