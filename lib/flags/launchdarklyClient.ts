/**
 * LaunchDarkly Feature Flag Client (Alternative)
 * 
 * Optional alternative to Unleash
 * Use this if you prefer LaunchDarkly over Unleash
 */

import { isNativePlatform } from '@/lib/utils/capacitor-safe';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  variant?: string;
  payload?: unknown;
}

export interface LaunchDarklyConfig {
  clientSideId: string;
  user?: {
    key: string;
    email?: string;
    name?: string;
    custom?: Record<string, unknown>;
  };
  options?: {
    streaming?: boolean;
    pollingInterval?: number;
  };
}

class LaunchDarklyClient {
  private config: LaunchDarklyConfig;
  private flags: Map<string, FeatureFlag> = new Map();
  private isInitialized = false;
  private cacheKey = 'sparecarry_ld_flags';
  private ldClient: any = null;

  constructor(config: LaunchDarklyConfig) {
    this.config = config;
  }

  /**
   * Initialize LaunchDarkly client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Dynamic import to avoid bundling if not used
      const { initialize } = await import('launchdarkly-js-client-sdk');

      const user = this.config.user || {
        key: 'anonymous',
        anonymous: true,
      };

      this.ldClient = initialize(this.config.clientSideId, user, this.config.options);

      // Wait for client to be ready
      await this.ldClient.waitForInitialization();

      // Set up flag change listener
      this.ldClient.on('change', (settings: any) => {
        this.updateFlags(settings);
      });

      // Load initial flags
      this.updateFlags(this.ldClient.allFlags());

      // Load cached flags as fallback
      this.loadCachedFlags();

      this.isInitialized = true;
    } catch (error) {
      console.warn('[FeatureFlags] Failed to initialize LaunchDarkly:', error);
      // Fall back to cached flags
      this.loadCachedFlags();
    }
  }

  /**
   * Update flags from LaunchDarkly
   */
  private updateFlags(flags: Record<string, unknown>): void {
    this.flags.clear();

    Object.entries(flags).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        this.flags.set(key, {
          name: key,
          enabled: value,
        });
      } else if (typeof value === 'object' && value !== null) {
        const flagValue = value as { value?: boolean; variation?: number };
        this.flags.set(key, {
          name: key,
          enabled: flagValue.value ?? false,
          variant: flagValue.variation?.toString(),
        });
      }
    });

    this.saveCachedFlags();
  }

  /**
   * Get a feature flag value
   */
  isEnabled(flagKey: string, defaultValue = false): boolean {
    if (this.ldClient) {
      return this.ldClient.variation(flagKey, defaultValue);
    }
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
   * Load flags from cache
   */
  private loadCachedFlags(): void {
    try {
      if (isNativePlatform()) {
        import('@capacitor/preferences').then(({ Preferences }) => {
          Preferences.get({ key: this.cacheKey }).then((result) => {
            if (result.value) {
              const cached = JSON.parse(result.value);
              if (cached.flags && cached.timestamp) {
                if (Date.now() - cached.timestamp < 3600000) {
                  cached.flags.forEach((flag: FeatureFlag) => {
                    this.flags.set(flag.name, flag);
                  });
                }
              }
            }
          });
        });
      } else {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.flags && parsed.timestamp) {
            if (Date.now() - parsed.timestamp < 3600000) {
              parsed.flags.forEach((flag: FeatureFlag) => {
                this.flags.set(flag.name, flag);
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('[FeatureFlags] Failed to load cached flags:', error);
    }
  }

  /**
   * Save flags to cache
   */
  private saveCachedFlags(): void {
    try {
      const flagsArray = Array.from(this.flags.values());
      const cacheData = {
        flags: flagsArray,
        timestamp: Date.now(),
      };

      if (isNativePlatform()) {
        import('@capacitor/preferences').then(({ Preferences }) => {
          Preferences.set({
            key: this.cacheKey,
            value: JSON.stringify(cacheData),
          });
        });
      } else {
        localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.warn('[FeatureFlags] Failed to save cached flags:', error);
    }
  }

  /**
   * Destroy the client
   */
  destroy(): void {
    if (this.ldClient) {
      this.ldClient.close();
      this.ldClient = null;
    }
    this.isInitialized = false;
  }
}

// Default safe-off flags
const DEFAULT_FLAGS: Record<string, boolean> = {
  enable_push_notifications: false,
  email_notifications: false,
  dispute_refund_flow: false,
  emergency_toggle_push: false,
};

// Singleton instance
let clientInstance: LaunchDarklyClient | null = null;

/**
 * Initialize LaunchDarkly client
 */
export function initializeLaunchDarkly(config: LaunchDarklyConfig): Promise<void> {
  if (!clientInstance) {
    clientInstance = new LaunchDarklyClient(config);
  }
  return clientInstance.initialize();
}

/**
 * Get feature flag value
 */
export function isFeatureEnabled(flagKey: string, defaultValue?: boolean): boolean {
  if (!clientInstance) {
    return DEFAULT_FLAGS[flagKey] ?? defaultValue ?? false;
  }
  return clientInstance.isEnabled(flagKey, DEFAULT_FLAGS[flagKey] ?? defaultValue ?? false);
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
 * Destroy LaunchDarkly client
 */
export function destroyLaunchDarkly(): void {
  if (clientInstance) {
    clientInstance.destroy();
    clientInstance = null;
  }
}

