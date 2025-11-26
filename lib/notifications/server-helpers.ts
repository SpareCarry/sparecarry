import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

type TypedSupabaseClient = SupabaseClient<Database>;

interface MatchParticipants {
  matchId: string;
  tripOwnerId?: string | null;
  requesterId?: string | null;
}

type RelationField =
  | { user_id?: string | null }
  | { user_id?: string | null }[]
  | null;

const extractUserId = (relation: RelationField): string | null => {
  if (Array.isArray(relation)) {
    return relation[0]?.user_id ?? null;
  }
  return relation?.user_id ?? null;
};

export async function fetchMatchParticipants(
  supabase: TypedSupabaseClient,
  matchId: string
): Promise<MatchParticipants | null> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
        id,
        trips ( user_id ),
        requests ( user_id )
      `
    )
    .eq('id', matchId)
    .single<{
      id: string;
      trips: RelationField;
      requests: RelationField;
    }>();

  if (error || !data) {
    return null;
  }

  return {
    matchId: data.id,
    tripOwnerId: extractUserId(data.trips),
    requesterId: extractUserId(data.requests),
  };
}

export async function fetchNotificationProfile(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<{
  user_id: string;
  full_name: string | null;
  expo_push_token: string | null;
  push_notifications_enabled: boolean | null;
} | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, expo_push_token, push_notifications_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}


