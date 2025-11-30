/**
 * Performance optimizations for RealtimeManager
 * Event batching and debouncing
 */

import { RealtimeManager } from "./RealtimeManager";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// Batch events within this time window (ms)
const BATCH_WINDOW = 100;
// Debounce rapid events (ms)
const DEBOUNCE_DELAY = 50;

interface BatchedEvent {
  payload: RealtimePostgresChangesPayload<any>;
  timestamp: number;
}

class EventBatcher {
  private events: Map<string, BatchedEvent[]> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  add(channelName: string, payload: RealtimePostgresChangesPayload<any>) {
    if (!this.events.has(channelName)) {
      this.events.set(channelName, []);
    }

    const events = this.events.get(channelName)!;
    events.push({ payload, timestamp: Date.now() });

    // Clear existing timer
    if (this.timers.has(channelName)) {
      clearTimeout(this.timers.get(channelName)!);
    }

    // Set new timer to flush events
    const timer = setTimeout(() => {
      this.flush(channelName);
    }, BATCH_WINDOW);

    this.timers.set(channelName, timer);
  }

  private flush(channelName: string) {
    const events = this.events.get(channelName);
    if (!events || events.length === 0) return;

    // Get the most recent event (or batch if needed)
    const latestEvent = events[events.length - 1];

    // Process the event
    // This would be called by RealtimeManager
    this.events.delete(channelName);
    this.timers.delete(channelName);

    return latestEvent.payload;
  }
}

// Export batcher for use in RealtimeManager if needed
export const eventBatcher = new EventBatcher();
