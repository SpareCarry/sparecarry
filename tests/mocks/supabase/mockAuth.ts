/**
 * Mock Supabase Auth Implementation
 */

import type {
  MockAuth,
  MockUser,
  MockSession,
  MockSubscription,
} from "./types";
import { mockAuthState } from "./mockAuthState";

export function createMockAuth(): MockAuth {
  return {
    getUser: async () => {
      const user = mockAuthState.currentUser;
      return {
        data: { user },
        error: null,
      };
    },

    getSession: async () => {
      const session = mockAuthState.currentSession;
      return {
        data: { session },
        error: null,
      };
    },

    signInWithOtp: async (options) => {
      // Simulate sending magic link
      mockAuthState.pendingEmail = options.email;
      return { data: {}, error: null };
    },

    signInWithOAuth: async (options) => {
      // Simulate OAuth redirect
      const redirectUrl =
        options.options?.redirectTo || "http://localhost:3000/auth/callback";
      return {
        data: {
          url: `https://oauth.provider.com/auth?redirect=${encodeURIComponent(redirectUrl)}`,
        },
        error: null,
      };
    },

    signOut: async () => {
      mockAuthState.currentUser = null;
      mockAuthState.currentSession = null;
      // Trigger auth state change
      mockAuthState.notifyListeners("SIGNED_OUT", null);
      return { error: null };
    },

    onAuthStateChange: (callback) => {
      const subscription = mockAuthState.addListener(callback);
      return {
        data: { subscription },
        error: null,
      };
    },
  };
}
