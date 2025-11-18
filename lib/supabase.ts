// Legacy client - use lib/supabase/client.ts or lib/supabase/server.ts instead
// This file is kept for backward compatibility with existing code

import { createClient as createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

