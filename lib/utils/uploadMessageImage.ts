/**
 * Utility for uploading images to Supabase Storage for messages
 */

import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadMessageImage(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient() as SupabaseClient;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error("Image must be less than 5MB");
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `messages/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("message-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("message-images").getPublicUrl(filePath);

  return publicUrl;
}
