/**
 * Mock Auth State Management
 * 
 * Manages authentication state for mock Supabase client
 */

import type { MockUser, MockSession, MockSubscription } from './types';

interface AuthStateChangeCallback {
  (event: string, session: MockSession | null): void;
}

class MockAuthStateManager {
  currentUser: MockUser | null = null;
  currentSession: MockSession | null = null;
  pendingEmail: string | null = null;
  private listeners: Map<number, AuthStateChangeCallback> = new Map();
  private listenerIdCounter = 0;

  addListener(callback: AuthStateChangeCallback): MockSubscription {
    const id = this.listenerIdCounter++;
    this.listeners.set(id, callback);

    // Immediately call with current state
    callback(this.currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', this.currentSession);

    return {
      unsubscribe: () => {
        this.listeners.delete(id);
      },
    };
  }

  notifyListeners(event: string, session: MockSession | null): void {
    this.listeners.forEach((callback) => {
      callback(event, session);
    });
  }

  setUser(user: MockUser, session: MockSession): void {
    this.currentUser = user;
    this.currentSession = session;
    this.notifyListeners('SIGNED_IN', session);
  }

  clearUser(): void {
    this.currentUser = null;
    this.currentSession = null;
    this.notifyListeners('SIGNED_OUT', null);
  }

  reset(): void {
    this.currentUser = null;
    this.currentSession = null;
    this.pendingEmail = null;
    this.listeners.clear();
    this.listenerIdCounter = 0;
  }
}

export const mockAuthState = new MockAuthStateManager();

