// Legacy client - use lib/supabase/client.ts or lib/supabase/server.ts instead
// This file is kept for backward compatibility with existing code

import { createClient } from "@supabase/supabase-js";

// Lazy initialization to avoid errors during static export build
// During build, environment variables may not be set, so we create a client with empty strings
// This will fail at runtime if env vars aren't set, but allows the build to proceed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create client if we have the required env vars, otherwise create a dummy client
// that will fail gracefully at runtime
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key");

