/**
 * RealtimeManager - Centralized Supabase Realtime Connection Manager
 *
 * Prevents duplicate connections, tracks all channels, and provides logging.
 *
 * Features:
 * - Deduplication: Same channel name = reuse existing channel
 * - Global tracking: Know exactly how many channels are active
 * - Automatic cleanup: Channels auto-close when not needed
 * - Connection limits: Hard limit to prevent runaway connections
 * - Verbose logging: See every create/destroy event
 *
 * Usage:
 * ```typescript
 * // In a component
 * const channel = RealtimeManager.listen('table-name', callback);
 *
 * // Cleanup
 * RealtimeManager.remove('table-name', callback);
 * ```
 */

import { createClient } from "../supabase/client";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

type ChannelCallback = (
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>
) => void;
type ChannelConfig = {
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  schema?: string;
  table: string;
  filter?: string;
};
type PostgresChangesFilter = Parameters<RealtimeChannel["on"]>[1];

interface ChannelInfo {
  channel: RealtimeChannel;
  callbacks: Set<ChannelCallback>;
  createdAt: number;
  lastUsed: number;
  config: ChannelConfig;
}

class RealtimeManagerClass {
  private channels: Map<string, ChannelInfo> = new Map();
  private supabase = createClient();
  private readonly MAX_CHANNELS = 10; // Hard limit
  private readonly INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private isLoggingEnabled = true;

  constructor() {
    // Start cleanup interval
    if (typeof window !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanupInactiveChannels();
      }, 60000); // Check every minute

      // Cleanup on page unload
      window.addEventListener("beforeunload", () => {
        this.destroyAll();
      });
    }
  }

  /**
   * Enable/disable verbose logging
   */
  setLogging(enabled: boolean) {
    this.isLoggingEnabled = enabled;
  }

  /**
   * Get current connection count
   */
  getConnectionCount(): number {
    return this.channels.size;
  }

  /**
   * Get all active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Log a message if logging is enabled
   */
  private log(message: string, data?: any) {
    if (this.isLoggingEnabled) {
      const timestamp = new Date().toISOString();
      const prefix = "[RT]";
      if (data) {
        console.log(`${prefix} [${timestamp}] ${message}`, data);
      } else {
        console.log(`${prefix} [${timestamp}] ${message}`);
      }
    }
  }

  /**
   * Generate a unique channel name from config
   */
  private getChannelName(config: ChannelConfig, customName?: string): string {
    if (customName) {
      return customName;
    }
    // Generate name from table + filter
    const filterPart = config.filter
      ? `:${config.filter.replace(/[^a-zA-Z0-9]/g, "_")}`
      : "";
    return `${config.table}${filterPart}`;
  }

  /**
   * Listen to a table with a callback
   * Returns the channel name for cleanup
   */
  listen(
    config: ChannelConfig | string,
    callback: ChannelCallback,
    customChannelName?: string
  ): string {
    // Handle string shorthand (just table name)
    const fullConfig: ChannelConfig =
      typeof config === "string" ? { table: config } : config;

    const channelName = this.getChannelName(fullConfig, customChannelName);

    // Check if channel already exists
    const existing = this.channels.get(channelName);

    if (existing) {
      // Channel exists - just add callback
      existing.callbacks.add(callback);
      existing.lastUsed = Date.now();
      this.log(
        `channel reused: ${channelName} (${existing.callbacks.size} callbacks)`
      );
      return channelName;
    }

    // Check connection limit
    if (this.channels.size >= this.MAX_CHANNELS) {
      const error = new Error(
        `RealtimeManager: Maximum channel limit (${this.MAX_CHANNELS}) reached. ` +
          `Active channels: ${this.getActiveChannels().join(", ")}`
      );
      this.log("ERROR: Connection limit reached", {
        limit: this.MAX_CHANNELS,
        active: this.getActiveChannels(),
      });
      throw error;
    }

    const filterOptions: PostgresChangesFilter = {
      event: fullConfig.event || "*",
      schema: fullConfig.schema || "public",
      table: fullConfig.table,
      filter: fullConfig.filter,
    };

    // Create new channel
    const channel = this.supabase.channel(channelName) as RealtimeChannel;

    channel
      .on(
        "postgres_changes" as Parameters<RealtimeChannel["on"]>[0],
        filterOptions as Parameters<RealtimeChannel["on"]>[1],
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Call all registered callbacks
          const channelInfo = this.channels.get(channelName);
          if (channelInfo) {
            channelInfo.lastUsed = Date.now();
            channelInfo.callbacks.forEach((cb) => {
              try {
                cb(payload);
              } catch (error) {
                console.error(
                  `[RT] Error in callback for ${channelName}:`,
                  error
                );
              }
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          this.log(`channel subscribed: ${channelName}`);
        } else if (status === "CHANNEL_ERROR") {
          this.log(`ERROR: channel error: ${channelName}`, status);
        }
      });

    // Store channel info
    const now = Date.now();
    this.channels.set(channelName, {
      channel,
      callbacks: new Set([callback]),
      createdAt: now,
      lastUsed: now,
      config: fullConfig,
    });

    this.log(`channel created: ${channelName} (total: ${this.channels.size})`);

    return channelName;
  }

  /**
   * Remove a callback from a channel
   * If no callbacks remain, unsubscribe the channel
   */
  remove(channelName: string, callback: ChannelCallback): void {
    const channelInfo = this.channels.get(channelName);

    if (!channelInfo) {
      this.log(
        `WARNING: Attempted to remove non-existent channel: ${channelName}`
      );
      return;
    }

    // Remove callback
    channelInfo.callbacks.delete(callback);

    // If no callbacks left, unsubscribe and remove channel
    if (channelInfo.callbacks.size === 0) {
      this.log(`channel unsubscribed: ${channelName} (no callbacks remaining)`);
      channelInfo.channel.unsubscribe();
      this.channels.delete(channelName);
    } else {
      this.log(
        `callback removed from: ${channelName} (${channelInfo.callbacks.size} callbacks remaining)`
      );
    }
  }

  /**
   * Remove all callbacks for a channel and unsubscribe
   */
  removeChannel(channelName: string): void {
    const channelInfo = this.channels.get(channelName);

    if (!channelInfo) {
      return;
    }

    this.log(`channel force removed: ${channelName}`);
    channelInfo.channel.unsubscribe();
    this.channels.delete(channelName);
  }

  /**
   * Clean up channels that haven't been used recently
   */
  private cleanupInactiveChannels(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.channels.forEach((info, channelName) => {
      const inactiveTime = now - info.lastUsed;
      if (inactiveTime > this.INACTIVE_TIMEOUT) {
        toRemove.push(channelName);
      }
    });

    toRemove.forEach((channelName) => {
      this.log(
        `channel auto-cleaned: ${channelName} (inactive for ${Math.round((now - (this.channels.get(channelName)?.lastUsed || 0)) / 1000)}s)`
      );
      this.removeChannel(channelName);
    });
  }

  /**
   * Destroy all channels (use on app exit)
   */
  destroyAll(): void {
    this.log(`destroying all channels (${this.channels.size} active)`);

    this.channels.forEach((info, channelName) => {
      try {
        info.channel.unsubscribe();
        this.log(`channel destroyed: ${channelName}`);
      } catch (error) {
        console.error(`[RT] Error destroying channel ${channelName}:`, error);
      }
    });

    this.channels.clear();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get debug info
   */
  getDebugInfo() {
    return {
      totalChannels: this.channels.size,
      channels: Array.from(this.channels.entries()).map(([name, info]) => ({
        name,
        callbacks: info.callbacks.size,
        createdAt: new Date(info.createdAt).toISOString(),
        lastUsed: new Date(info.lastUsed).toISOString(),
        inactiveTime: Date.now() - info.lastUsed,
        config: info.config,
      })),
    };
  }
}

// Export singleton instance
export const RealtimeManager = new RealtimeManagerClass();

// Expose in dev tools for debugging
if (typeof window !== "undefined") {
  (window as any).__REALTIME_MANAGER__ = RealtimeManager;
}
