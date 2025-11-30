// Supabase Realtime subscription for emergency requests
// This can be used in the mobile app to listen for emergency requests
// Now uses RealtimeManager for proper connection management

import { RealtimeManager } from "./RealtimeManager";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function subscribeToEmergencyRequests(
  userId: string,
  onEmergencyRequest: (payload: RealtimePostgresChangesPayload<any>) => void
): string {
  // Use RealtimeManager to prevent duplicates
  const channelName = RealtimeManager.listen(
    {
      table: "requests",
      event: "INSERT",
      filter: "emergency=eq.true",
    },
    onEmergencyRequest,
    `emergency-requests:${userId}` // Custom channel name for deduplication
  );

  return channelName;
}

export function unsubscribeFromEmergencyRequests(
  channelName: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  RealtimeManager.remove(channelName, callback);
}
