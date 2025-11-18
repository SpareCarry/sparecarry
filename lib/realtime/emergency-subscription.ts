// Supabase Realtime subscription for emergency requests
// This can be used in the mobile app to listen for emergency requests

import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function subscribeToEmergencyRequests(
  userId: string,
  onEmergencyRequest: (payload: any) => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel(`emergency-requests:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "requests",
        filter: `emergency=eq.true`,
      },
      (payload) => {
        // Check if this request matches user's active trips
        onEmergencyRequest(payload);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromEmergencyRequests(channel: RealtimeChannel) {
  const supabase = createClient();
  supabase.removeChannel(channel);
}

