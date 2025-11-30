/**
 * Unleash Feature Flag Client
 *
 * Supports both web and mobile (Capacitor) platforms
 * Falls back to safe-off values if service is unreachable
 */

// Capacitor is only available in client-side native builds
// Import dynamically to avoid SSR issues

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  variant?: string;
  payload?: unknown;
}

export interface UnleashConfig {
  url: string;
  clientKey: string;
  appName?: string;
  environment?: string;
  refreshInterval?: number;
  disableMetrics?: boolean;
}

class UnleashClient {
  private config: UnleashConfig;
  private flags: Map<string, FeatureFlag> = new Map();
  private refreshInterval?: ReturnType<typeof setInterval>;
  private isInitialized = false;
  private cacheKey = "sparecarry_feature_flags";
  private lastFetchTime = 0;
  private fetchPromise?: Promise<void>;

  constructor(config: UnleashConfig) {
    this.config = {
      refreshInterval: 30000, // 30 seconds
      appName: "sparecarry",
      environment: "production",
      ...config,
    };
  }

  /**
   * Initialize the client
   */
  async initialize(
    userId?: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Load cached flags
    this.loadCachedFlags();

    // Fetch flags immediately
    await this.fetchFlags(userId, context);

    // Set up periodic refresh
    if (this.config.refreshInterval && this.config.refreshInterval > 0) {
      this.refreshInterval = setInterval(() => {
        this.fetchFlags(userId, context).catch((error) => {
          console.warn("[FeatureFlags] Failed to refresh flags:", error);
        });
      }, this.config.refreshInterval);
    }

    this.isInitialized = true;
  }

  /**
   * Fetch flags from Unleash server
   */
  private async fetchFlags(
    userId?: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    // Prevent concurrent fetches
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        const url = this.buildFetchUrl(userId, context);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: this.config.clientKey,
            "Content-Type": "application/json",
          },
          // Timeout after 5 seconds
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.parseFlags(data);
        this.lastFetchTime = Date.now();
        this.saveCachedFlags();
      } catch (error) {
        console.warn("[FeatureFlags] Failed to fetch flags:", error);
        // Keep using cached flags or defaults
        if (this.flags.size === 0) {
          this.loadCachedFlags();
        }
      } finally {
        this.fetchPromise = undefined;
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Build fetch URL for Unleash Proxy
   */
  private buildFetchUrl(
    userId?: string,
    context?: Record<string, unknown>
  ): string {
    const params = new URLSearchParams();

    if (userId) {
      params.append("userId", userId);
    }

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(`properties[${key}]`, String(value));
        }
      });
    }

    const queryString = params.toString();
    return `${this.config.url}/proxy?${queryString}`;
  }

  /**
   * Parse flags from Unleash response
   */
  private parseFlags(data: {
    toggles?: Array<{ name: string; enabled: boolean; variant?: string }>;
  }): void {
    this.flags.clear();

    if (data.toggles) {
      data.toggles.forEach((toggle) => {
        this.flags.set(toggle.name, {
          name: toggle.name,
          enabled: toggle.enabled,
          variant: toggle.variant,
        });
      });
    }
  }

  /**
   * Get a feature flag value
   */
  isEnabled(flagKey: string, defaultValue = false): boolean {
    const flag = this.flags.get(flagKey);
    return flag?.enabled ?? defaultValue;
  }

  /**
   * Get a feature flag with variant
   */
  getFlag(flagKey: string): FeatureFlag | null {
    return this.flags.get(flagKey) ?? null;
  }

  /**
   * Get all flags
   */
  getAllFlags(): Map<string, FeatureFlag> {
    return new Map(this.flags);
  }

  /**
   * Check if running on native platform (client-side only)
   */
  private isNativePlatform(): boolean {
    if (typeof window === "undefined") {
      return false; // SSR - always use web storage
    }

    // Check for Capacitor in a safe way
    try {
      // Dynamic check for Capacitor without importing at module level
      const capacitor = (window as any).Capacitor;
      return capacitor?.isNativePlatform?.() ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Load flags from cache (localStorage for web, Preferences for mobile)
   */
  private loadCachedFlags(): void {
    // Only run on client-side
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (this.isNativePlatform()) {
        // For mobile, use Capacitor Preferences (dynamic import, client-side only)
        // Use eval to prevent Next.js from statically analyzing the import
        try {
          // eslint-disable-next-line no-implied-eval
          const importPromise = new Function(
            'return import("@capacitor/preferences")'
          )() as Promise<any>;
          importPromise
            .then((module: any) => {
              const { Preferences } = module;
              Preferences.get({ key: this.cacheKey }).then((result: any) => {
                if (result.value) {
                  const cached = JSON.parse(result.value);
                  if (cached.flags && cached.timestamp) {
                    // Use cache if less than 1 hour old
                    if (Date.now() - cached.timestamp < 3600000) {
                      this.parseFlags({ toggles: cached.flags });
                    }
                  }
                }
              });
            })
            .catch(() => {
              // Fallback to localStorage if Capacitor not available
              this.loadCachedFlagsFromLocalStorage();
            });
        } catch {
          // Fallback to localStorage if dynamic import fails
          this.loadCachedFlagsFromLocalStorage();
        }
      } else {
        // For web, use localStorage
        this.loadCachedFlagsFromLocalStorage();
      }
    } catch (error) {
      console.warn("[FeatureFlags] Failed to load cached flags:", error);
    }
  }

  /**
   * Load flags from localStorage (web fallback)
   */
  private loadCachedFlagsFromLocalStorage(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.flags && parsed.timestamp) {
          // Use cache if less than 1 hour old
          if (Date.now() - parsed.timestamp < 3600000) {
            this.parseFlags({ toggles: parsed.flags });
          }
        }
      }
    } catch (error) {
      console.warn("[FeatureFlags] Failed to load from localStorage:", error);
    }
  }

  /**
   * Save flags to cache
   */
  private saveCachedFlags(): void {
    // Only run on client-side
    if (typeof window === "undefined") {
      return;
    }

    try {
      const flagsArray = Array.from(this.flags.values());
      const cacheData = {
        flags: flagsArray,
        timestamp: Date.now(),
      };

      if (this.isNativePlatform()) {
        // For mobile, use Capacitor Preferences (dynamic import, client-side only)
        // Use eval to prevent Next.js from statically analyzing the import
        try {
          // eslint-disable-next-line no-implied-eval
          const importPromise = new Function(
            'return import("@capacitor/preferences")'
          )() as Promise<any>;
          importPromise
            .then((module: any) => {
              const { Preferences } = module;
              Preferences.set({
                key: this.cacheKey,
                value: JSON.stringify(cacheData),
              });
            })
            .catch(() => {
              // Fallback to localStorage if Capacitor not available
              this.saveCachedFlagsToLocalStorage(cacheData);
            });
        } catch {
          // Fallback to localStorage if dynamic import fails
          this.saveCachedFlagsToLocalStorage(cacheData);
        }
      } else {
        // For web, use localStorage
        this.saveCachedFlagsToLocalStorage(cacheData);
      }
    } catch (error) {
      console.warn("[FeatureFlags] Failed to save cached flags:", error);
    }
  }

  /**
   * Save flags to localStorage (web fallback)
   */
  private saveCachedFlagsToLocalStorage(cacheData: {
    flags: FeatureFlag[];
    timestamp: number;
  }): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("[FeatureFlags] Failed to save to localStorage:", error);
    }
  }

  /**
   * Destroy the client and cleanup
   */
  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
    this.isInitialized = false;
  }
}

// Default safe-off flags (used when service is unreachable)
const DEFAULT_FLAGS: Record<string, boolean> = {
  enable_push_notifications: false,
  email_notifications: false,
  dispute_refund_flow: false,
  emergency_toggle_push: false,
};

// Singleton instance
let clientInstance: UnleashClient | null = null;

/**
 * Initialize Unleash client
 */
export function initializeUnleash(
  config: UnleashConfig,
  userId?: string,
  context?: Record<string, unknown>
): Promise<void> {
  if (!clientInstance) {
    clientInstance = new UnleashClient(config);
  }
  return clientInstance.initialize(userId, context);
}

/**
 * Get feature flag value
 */
export function isFeatureEnabled(
  flagKey: string,
  defaultValue?: boolean
): boolean {
  if (!clientInstance) {
    // Return safe-off default if client not initialized
    return DEFAULT_FLAGS[flagKey] ?? defaultValue ?? false;
  }
  return clientInstance.isEnabled(
    flagKey,
    DEFAULT_FLAGS[flagKey] ?? defaultValue ?? false
  );
}

/**
 * Get feature flag with variant
 */
export function getFeatureFlag(flagKey: string): FeatureFlag | null {
  if (!clientInstance) {
    return null;
  }
  return clientInstance.getFlag(flagKey);
}

/**
 * Get all feature flags
 */
export function getAllFeatureFlags(): Map<string, FeatureFlag> {
  if (!clientInstance) {
    return new Map();
  }
  return clientInstance.getAllFlags();
}

/**
 * Destroy Unleash client
 */
export function destroyUnleash(): void {
  if (clientInstance) {
    clientInstance.destroy();
    clientInstance = null;
  }
}
