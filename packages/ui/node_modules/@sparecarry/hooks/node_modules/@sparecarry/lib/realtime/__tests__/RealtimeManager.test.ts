/**
 * Tests for RealtimeManager
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { RealtimeManager } from "../RealtimeManager";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
const mockSupabaseClient = {
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn((callback) => {
        // Simulate subscription
        setTimeout(() => callback("SUBSCRIBED"), 10);
        return {
          unsubscribe: vi.fn(),
        };
      }),
    })),
  })),
  removeChannel: vi.fn(),
} as unknown as SupabaseClient;

describe("RealtimeManager", () => {
  beforeEach(() => {
    RealtimeManager.setSupabaseClient(mockSupabaseClient);
    // Reset channels
    const debugInfo = RealtimeManager.getDebugInfo();
    debugInfo.channels.forEach((channel) => {
      RealtimeManager.removeChannel(channel.name);
    });
  });

  it("should initialize with Supabase client", () => {
    expect(() => {
      RealtimeManager.setSupabaseClient(mockSupabaseClient);
    }).not.toThrow();
  });

  it("should create a channel", () => {
    const callback = vi.fn();
    const channelName = RealtimeManager.listen({ table: "messages" }, callback);

    expect(channelName).toBeDefined();
    expect(RealtimeManager.getConnectionCount()).toBe(1);
  });

  it("should reuse existing channel for same config", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const channel1 = RealtimeManager.listen({ table: "messages" }, callback1);
    const channel2 = RealtimeManager.listen({ table: "messages" }, callback2);

    expect(channel1).toBe(channel2);
    expect(RealtimeManager.getConnectionCount()).toBe(1);
  });

  it("should enforce MAX_CHANNELS limit", () => {
    // Create 5 channels (the limit)
    for (let i = 0; i < 5; i++) {
      RealtimeManager.listen({ table: `table${i}` }, vi.fn());
    }

    expect(RealtimeManager.getConnectionCount()).toBe(5);

    // Try to create 6th channel - should throw
    expect(() => {
      RealtimeManager.listen({ table: "table6" }, vi.fn());
    }).toThrow("Maximum channel limit");
  });

  it("should remove callback and cleanup channel", () => {
    const callback = vi.fn();
    const channelName = RealtimeManager.listen({ table: "messages" }, callback);

    expect(RealtimeManager.getConnectionCount()).toBe(1);

    RealtimeManager.remove(channelName, callback);

    expect(RealtimeManager.getConnectionCount()).toBe(0);
  });

  it("should get debug info", () => {
    RealtimeManager.listen({ table: "messages" }, vi.fn());

    const debugInfo = RealtimeManager.getDebugInfo();
    expect(debugInfo.totalChannels).toBe(1);
    expect(debugInfo.channels).toHaveLength(1);
    expect(debugInfo.channels[0].name).toBe("messages");
  });
});
