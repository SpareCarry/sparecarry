import { createClient } from "@supabase/supabase-js";

/**
 * Get Supabase admin client with service role key
 * This client bypasses Row Level Security (RLS) and should only be used server-side
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables are not set");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

