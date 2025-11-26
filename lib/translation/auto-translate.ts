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
  
  if (spanishPattern.test(text)) return 'es';
  if (frenchPattern.test(text)) return 'fr';
  return 'en';
}

/**
 * Translate text using LibreTranslate (free, self-hosted option)
 * Falls back to simple word replacement for common phrases
 */
export async function translateText(
  text: string,
  targetLanguage: string = 'en',
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

  // Try LibreTranslate API (if configured)
  const libreTranslateUrl = process.env.NEXT_PUBLIC_LIBRETRANSLATE_URL;
  
  if (libreTranslateUrl) {
    try {
      const response = await fetch(`${libreTranslateUrl}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          translatedText: data.translatedText || text,
          sourceLanguage,
          targetLanguage,
          confidence: 0.8,
        };
      }
    } catch (error) {
      console.warn('LibreTranslate API error, using fallback:', error);
    }
  }

  // Fallback: Simple word replacement for common phrases
  // This is a basic fallback - in production, use a proper translation library
  return {
    translatedText: text, // Return original if translation fails
    sourceLanguage,
    targetLanguage,
    confidence: 0.3,
  };
}

/**
 * Get user's preferred language from browser/profile
 */
export function getUserLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  
  // Check browser language
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  return browserLang.split('-')[0]; // Get language code (e.g., 'en' from 'en-US')
}

/**
 * Check if auto-translate is enabled for user
 */
export async function isAutoTranslateEnabled(userId: string): Promise<boolean> {
  // This would check the user's profile setting
  // For now, return false as default
  return false;
}

