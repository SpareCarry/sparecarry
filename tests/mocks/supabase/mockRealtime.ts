/**
 * Mock Supabase Realtime Implementation
 *
 * Provides fake in-memory realtime events for testing
 */

import type { MockRealtime, MockRealtimeChannel } from "./types";

class MockRealtimeChannelImpl implements MockRealtimeChannel {
  private name: string;
  private eventHandlers: Map<string, Array<(payload: unknown) => void>> =
    new Map();
  private subscribed = false;
  private subscriptionCallback?: (status: string) => void;

  constructor(name: string) {
    this.name = name;
  }

  on(
    event: string,
    filter: Record<string, string>,
    callback: (payload: unknown) => void
  ): MockRealtimeChannel {
    const key = `${event}:${JSON.stringify(filter)}`;
    if (!this.eventHandlers.has(key)) {
      this.eventHandlers.set(key, []);
    }
    this.eventHandlers.get(key)!.push(callback);
    return this;
  }

  subscribe(callback?: (status: string) => void): MockRealtimeChannel {
    this.subscribed = true;
    this.subscriptionCallback = callback;
    callback?.("SUBSCRIBED");
    return this;
  }

  async unsubscribe(): Promise<"ok" | "timed out" | "error"> {
    this.subscribed = false;
    this.eventHandlers.clear();
    return "ok";
  }

  async send(
    event: string,
    payload: unknown
  ): Promise<"ok" | "timed out" | "error"> {
    if (!this.subscribed) {
      return "error";
    }

    // Trigger handlers for this event
    const handlers = this.eventHandlers.get(`${event}:{}`) || [];
    handlers.forEach((handler) => handler(payload));

    return "ok";
  }

  // Internal method to trigger events
  triggerEvent(
    event: string,
    filter: Record<string, string>,
    payload: unknown
  ): void {
    if (!this.subscribed) return;

    const key = `${event}:${JSON.stringify(filter)}`;
    const handlers = this.eventHandlers.get(key) || [];
    handlers.forEach((handler) => handler(payload));
  }
}

class MockRealtimeImpl implements MockRealtime {
  private channels: Map<string, MockRealtimeChannelImpl> = new Map();

  channel(
    name: string,
    config?: { config?: { broadcast?: { self?: boolean } } }
  ): MockRealtimeChannel {
    if (!this.channels.has(name)) {
      this.channels.set(name, new MockRealtimeChannelImpl(name));
    }
    return this.channels.get(name)!;
  }

  removeChannel(channel: MockRealtimeChannel): MockRealtime {
    const channelImpl = channel as MockRealtimeChannelImpl;
    this.channels.forEach((ch, name) => {
      if (ch === channelImpl) {
        this.channels.delete(name);
      }
    });
    return this;
  }

  removeAllChannels(): MockRealtime {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    return this;
  }

  getChannels(): MockRealtimeChannel[] {
    return Array.from(this.channels.values());
  }

  // Helper to trigger realtime events for testing
  triggerRealtimeEvent(
    channelName: string,
    event: string,
    filter: Record<string, string>,
    payload: unknown
  ): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      (channel as MockRealtimeChannelImpl).triggerEvent(event, filter, payload);
    }
  }
}

export function createMockRealtime(): MockRealtime {
  return new MockRealtimeImpl();
}

/**
 * Get realtime instance for triggering events in tests
 */
let globalRealtimeInstance: MockRealtimeImpl | null = null;

export function getMockRealtimeInstance(): MockRealtimeImpl | null {
  return globalRealtimeInstance;
}

export function setMockRealtimeInstance(instance: MockRealtimeImpl): void {
  globalRealtimeInstance = instance;
}
