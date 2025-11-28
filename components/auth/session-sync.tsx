"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Component that syncs the session from localStorage to cookies
 * This ensures server-side API routes can read the session
 */
export function SessionSync() {
  useEffect(() => {
    const syncSession = async () => {
      try {
        const supabase = createClient();
        
        // Check if we have a session in localStorage
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Only sync if we have a valid session and no error
        if (session && !error && session.access_token) {
          // Sync session to cookies by calling the sync-session API
          const response = await fetch("/api/auth/sync-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              accessToken: session.access_token,
              refreshToken: session.refresh_token,
            }),
          });
          
          if (response.ok) {
            console.log("[SessionSync] Session synced to cookies successfully");
          } else {
            // Only log as warning if it's not a 401 (which means no session on server)
            if (response.status !== 401) {
              console.warn("[SessionSync] Failed to sync session to cookies:", response.status);
            }
            // Silently ignore 401 errors - they just mean the session isn't valid on the server
          }
        }
      } catch (error) {
        // Only log unexpected errors
        if (error instanceof Error && !error.message.includes("401")) {
          console.error("[SessionSync] Error syncing session:", error);
        }
      }
    };
    
    // Sync on mount
    syncSession();
    
    // Also sync when auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        syncSession();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return null; // This component doesn't render anything
}

