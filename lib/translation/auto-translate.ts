/**
 * Auto-Translate Service
 *
 * Provides message translation using free translation APIs
 * Falls back to client-side translation if available
 */

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

/**
 * Detect language of text
 */
export async function detectLanguage(text: string): Promise<string> {
  // Simple detection based on common patterns
  // In production, use a proper language detection library
  const spanishPattern = /[áéíóúñ¿¡]/i;
  const frenchPattern = /[àâäéèêëïîôùûüÿç]/i;

  if (spanishPattern.test(text)) return "es";
  if (frenchPattern.test(text)) return "fr";
  return "en";
}

/**
 * Translate text using Next.js API route (runs as part of the app)
 * Uses LibreTranslate (self-hosted) or Google Translate API as fallback
 */
export async function translateText(
  text: string,
  targetLanguage: string = "en",
  sourceLanguage?: string
): Promise<TranslationResult> {
  // If source language not provided, detect it
  if (!sourceLanguage) {
    sourceLanguage = await detectLanguage(text);
  }

  // If same language, return original
  if (sourceLanguage === targetLanguage) {
    return {
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 1.0,
    };
  }

  // Use Next.js API route (runs as part of the app, no separate service needed)
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        translatedText: data.translatedText || text,
        sourceLanguage: data.sourceLanguage || sourceLanguage,
        targetLanguage: data.targetLanguage || targetLanguage,
        confidence: data.confidence || 0.8,
      };
    } else {
      console.warn("Translation API error:", response.statusText);
    }
  } catch (error) {
    console.warn("Translation API error:", error);
  }

  // Fallback: Return original if translation fails
  return {
    translatedText: text,
    sourceLanguage,
    targetLanguage,
    confidence: 0.3,
  };
}

/**
 * Get user's preferred language from browser/profile
 */
export function getUserLanguage(): string {
  if (typeof window === "undefined") return "en";

  // Check browser language
  const browserLang = navigator.language || navigator.languages?.[0] || "en";
  return browserLang.split("-")[0]; // Get language code (e.g., 'en' from 'en-US')
}

/**
 * Check if auto-translate is enabled for user
 */
export async function isAutoTranslateEnabled(userId: string): Promise<boolean> {
  if (!userId || typeof window === "undefined") return false;

  try {
    // Check user's profile setting from Supabase
    const { createClient } = await import("../supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("auto_translate_messages")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.warn("Error checking auto-translate setting:", error);
      return false;
    }

    return (data as any)?.auto_translate_messages ?? false;
  } catch (error) {
    console.warn("Error checking auto-translate setting:", error);
    return false;
  }
}
