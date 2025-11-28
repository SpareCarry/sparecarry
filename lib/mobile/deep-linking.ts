/**
 * Deep linking handler for Capacitor / mobile app
 * Handles authentication callbacks from Supabase magic links.
 *
 * NOTE:
 * - We removed the direct import of '@capacitor/app' so that web builds
 *   (Next.js) don't fail when Capacitor is not installed.
 * - At runtime on a true Capacitor shell, we rely on `window.Capacitor.App`
 *   if it exists. In Expo Go / web, this module simply no-ops.
 */

import { getAppScheme, createMobileClient } from "../supabase/mobile";

/**
 * Setup deep linking handler for authentication callbacks
 * Call this when your app starts (in app layout or root component)
 */
export async function setupDeepLinking() {
  if (typeof window === "undefined") {
    return;
  }

  // Check if we're in a mobile Capacitor environment
  const capacitor = (window as any).Capacitor;
  const isCapacitor = !!capacitor && !!capacitor.App;
  
  if (!isCapacitor) {
    // Not mobile, handle web auth normally
    return;
  }

  try {
    const App = capacitor.App;

    // Listen for app URL events (deep links)
    App.addListener("appUrlOpen", async (event: { url: string }) => {
      console.log("Deep link received:", event.url);
      
      // Parse the URL to extract auth parameters
      const url = new URL(event.url);
      
      // Check if this is an auth callback
      if (url.pathname === "/callback" || url.searchParams.has("code") || url.searchParams.has("token_hash")) {
        await handleAuthCallback(url);
      } else {
        // Handle other deep links here
        console.log("Non-auth deep link:", url.pathname);
      }
    });

    // Also check if app was opened via deep link on startup
    App.addListener("appStateChange", async (state: { isActive: boolean }) => {
      if (state.isActive) {
        // App became active, check for pending auth
        // This handles the case where the app was closed and reopened
        const supabase = createMobileClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Session restored on app activation");
        }
      }
    });

    console.log("Deep linking handler setup complete");
  } catch (error) {
    console.error("Error setting up deep linking:", error);
  }
}

/**
 * Handle authentication callback from deep link
 */
async function handleAuthCallback(url: URL) {
  try {
    const supabase = createMobileClient();
    
    // Extract auth parameters from URL
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    const redirectPath = url.searchParams.get("redirect") || "/home";

    console.log("Handling auth callback:", { code: !!code, tokenHash: !!tokenHash, type, redirectPath });

    if (code) {
      // PKCE flow - exchange code for session
      // This happens when user clicks magic link and gets redirected via web callback
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        // Navigate to login with error
        window.location.href = `/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`;
        return;
      }

      if (data.session) {
        console.log("Auth successful, redirecting to:", redirectPath);
        // Navigate to the intended page
        window.location.href = redirectPath;
      }
    } else if (tokenHash && type === "magiclink") {
      // Legacy magic link flow with token_hash
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "magiclink",
      });

      if (error) {
        console.error("Error verifying OTP:", error);
        // Navigate to login with error
        window.location.href = `/auth/login?error=auth_failed&message=${encodeURIComponent(error.message)}`;
        return;
      }

      if (data.session) {
        console.log("Auth successful, redirecting to:", redirectPath);
        // Navigate to the intended page
        window.location.href = redirectPath;
      }
    } else {
      console.warn("No valid auth parameters in deep link");
      // Navigate to login
      window.location.href = "/auth/login?error=no_code";
    }
  } catch (error: any) {
    console.error("Error handling auth callback:", error);
    // Navigate to login with error
    window.location.href = `/auth/login?error=auth_failed&message=${encodeURIComponent(error.message || "Authentication failed")}`;
  }
}

/**
 * Get the current deep link URL if app was opened via deep link
 */
export async function getInitialDeepLink(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const isCapacitor = !!(window as any).Capacitor;
  
  if (!isCapacitor) {
    return null;
  }

  try {
    // Check if app was opened via deep link
    // Note: Capacitor App plugin doesn't have a direct way to get initial URL
    // We'll check the current URL or use a different approach
    return window.location.href.startsWith(getAppScheme() || "") ? window.location.href : null;
  } catch (error) {
    console.error("Error getting initial deep link:", error);
    return null;
  }
}

