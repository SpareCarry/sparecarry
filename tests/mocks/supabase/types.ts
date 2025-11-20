/**
 * Type definitions for Mock Supabase Client
 */

export interface MockSupabaseClient {
  auth: MockAuth;
  from: (table: string) => MockQueryBuilder;
  storage: MockStorage;
  rpc: (fnName: string, params?: Record<string, unknown>) => Promise<{ data: unknown; error: null }>;
  realtime: MockRealtime;
}

export interface MockAuth {
  getUser: () => Promise<{ data: { user: MockUser | null }; error: null }>;
  getSession: () => Promise<{ data: { session: MockSession | null }; error: null }>;
  signInWithOtp: (options: { email: string; options?: { emailRedirectTo?: string } }) => Promise<{ data: {}; error: null }>;
  signInWithOAuth: (options: { provider: 'google' | 'apple'; options?: { redirectTo?: string } }) => Promise<{ data: { url?: string }; error: null }>;
  signOut: () => Promise<{ error: null }>;
  onAuthStateChange: (callback: (event: string, session: MockSession | null) => void) => { data: { subscription: MockSubscription }; error: null };
}

export interface MockUser {
  id: string;
  email: string;
  created_at: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: MockUser;
}

export interface MockSubscription {
  unsubscribe: () => void;
}

export interface MockQueryBuilder {
  select: (columns?: string) => MockQueryBuilder;
  insert: (data: unknown | unknown[]) => MockQueryBuilder;
  update: (data: unknown) => MockQueryBuilder;
  upsert: (data: unknown | unknown[]) => MockQueryBuilder;
  delete: () => MockQueryBuilder;
  eq: (column: string, value: unknown) => MockQueryBuilder;
  neq: (column: string, value: unknown) => MockQueryBuilder;
  gt: (column: string, value: unknown) => MockQueryBuilder;
  gte: (column: string, value: unknown) => MockQueryBuilder;
  lt: (column: string, value: unknown) => MockQueryBuilder;
  lte: (column: string, value: unknown) => MockQueryBuilder;
  like: (column: string, pattern: string) => MockQueryBuilder;
  ilike: (column: string, pattern: string) => MockQueryBuilder;
  is: (column: string, value: unknown) => MockQueryBuilder;
  in: (column: string, values: unknown[]) => MockQueryBuilder;
  contains: (column: string, value: unknown) => MockQueryBuilder;
  or: (filter: string) => MockQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder;
  limit: (count: number) => MockQueryBuilder;
  range: (from: number, to: number) => MockQueryBuilder;
  single: () => Promise<{ data: unknown | null; error: null }>;
  maybeSingle: () => Promise<{ data: unknown | null; error: null }>;
  then: <T>(callback: (result: { data: T[] | null; error: null }) => T) => Promise<T>;
}

export interface MockStorage {
  from: (bucket: string) => MockStorageBucket;
}

export interface MockStorageBucket {
  upload: (path: string, file: File | Blob, options?: { upsert?: boolean }) => Promise<{ data: { path: string } | null; error: null }>;
  download: (path: string) => Promise<{ data: Blob | null; error: null }>;
  list: (path?: string, options?: { limit?: number; offset?: number }) => Promise<{ data: { name: string; id: string; updated_at: string; created_at: string; last_accessed_at: string; metadata: Record<string, unknown> }[] | null; error: null }>;
  remove: (paths: string[]) => Promise<{ data: { path: string }[] | null; error: null }>;
  getPublicUrl: (path: string) => { data: { publicUrl: string } };
  createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null; error: null }>;
}

export interface MockRealtime {
  channel: (name: string, config?: { config?: { broadcast?: { self?: boolean } } }) => MockRealtimeChannel;
  removeChannel: (channel: MockRealtimeChannel) => MockRealtime;
  removeAllChannels: () => MockRealtime;
  getChannels: () => MockRealtimeChannel[];
}

export interface MockRealtimeChannel {
  on: (event: string, filter: Record<string, string>, callback: (payload: unknown) => void) => MockRealtimeChannel;
  subscribe: (callback?: (status: string) => void) => MockRealtimeChannel;
  unsubscribe: () => Promise<'ok' | 'timed out' | 'error'>;
  send: (event: string, payload: unknown) => Promise<'ok' | 'timed out' | 'error'>;
}

