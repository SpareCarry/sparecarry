/**
 * Utility for uploading voice messages (audio files) to Supabase Storage
 */

import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB max
const MAX_DURATION_SECONDS = 120; // 2 minutes max

export async function uploadVoiceMessage(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient() as SupabaseClient;

  // Validate file type
  if (!file.type.startsWith("audio/")) {
    throw new Error("File must be an audio file");
  }

  // Validate file size
  if (file.size > MAX_AUDIO_SIZE) {
    throw new Error(
      `Audio file must be less than ${MAX_AUDIO_SIZE / 1024 / 1024}MB`
    );
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop() || "webm";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `messages/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("voice-messages")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Failed to upload audio: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("voice-messages").getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Get audio duration in seconds (client-side only)
 * Note: This is an approximation. For exact duration, you'd need server-side processing.
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });

    audio.addEventListener("error", (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load audio file"));
    });

    audio.src = url;
  });
}

export { MAX_AUDIO_SIZE, MAX_DURATION_SECONDS };
