import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // During static export build, env vars may not be set
  // Return a client with placeholder values that will fail gracefully at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }
  
  // Create client with localStorage storage for PKCE code verifier
  // This ensures the code verifier is stored and can be retrieved when clicking magic link
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      flowType: "pkce", // Explicitly enable PKCE flow
    },
  });
}

