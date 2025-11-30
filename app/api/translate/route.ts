/**
 * Translation API Route
 *
 * Provides server-side translation using:
 * 1. LibreTranslate (if self-hosted instance available)
 * 2. Google Translate API (if API key configured)
 * 3. Fallback to simple detection
 *
 * This runs as part of the Next.js app, no separate service needed
 */

import { NextRequest, NextResponse } from "next/server";

interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

// Simple language detection (improved)
function detectLanguage(text: string): string {
  // Common patterns for major languages
  const patterns = {
    es: /[áéíóúñ¿¡]/i,
    fr: /[àâäéèêëïîôùûüÿç]/i,
    de: /[äöüß]/i,
    it: /[àèéìíîòóùú]/i,
    pt: /[ãõáéíóúç]/i,
    ru: /[а-яё]/i,
    zh: /[\u4e00-\u9fff]/i,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/i,
    ko: /[\uac00-\ud7a3]/i,
    ar: /[\u0600-\u06ff]/i,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  // Default to English
  return "en";
}

// Translate using Google Translate API (via @google-cloud/translate)
async function translateWithGoogle(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return null;

  try {
    // Use Google Translate REST API (simpler than SDK)
    const source = sourceLanguage || "auto";
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source,
        target: targetLanguage,
        format: "text",
      }),
    });

    if (!response.ok) {
      console.warn("Google Translate API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.data?.translations?.[0]?.translatedText || null;
  } catch (error) {
    console.warn("Google Translate API error:", error);
    return null;
  }
}

// Translate using LibreTranslate (self-hosted)
async function translateWithLibreTranslate(
  text: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<string | null> {
  const libreTranslateUrl =
    process.env.LIBRETRANSLATE_URL ||
    process.env.NEXT_PUBLIC_LIBRETRANSLATE_URL;
  if (!libreTranslateUrl) return null;

  try {
    const source = sourceLanguage || "auto";
    const response = await fetch(`${libreTranslateUrl}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source,
        target: targetLanguage,
        format: "text",
      }),
    });

    if (!response.ok) {
      console.warn("LibreTranslate API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.translatedText || null;
  } catch (error) {
    console.warn("LibreTranslate API error:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: TranslateRequest = await req.json();
    const { text, targetLanguage, sourceLanguage } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "text and targetLanguage are required" },
        { status: 400 }
      );
    }

    // Detect source language if not provided
    const detectedSource = sourceLanguage || detectLanguage(text);

    // If same language, return original
    if (detectedSource === targetLanguage) {
      return NextResponse.json({
        translatedText: text,
        sourceLanguage: detectedSource,
        targetLanguage,
        confidence: 1.0,
      });
    }

    // Try translation services in order of preference
    let translatedText: string | null = null;
    let confidence = 0.8;

    // 1. Try LibreTranslate first (free, self-hosted)
    translatedText = await translateWithLibreTranslate(
      text,
      targetLanguage,
      detectedSource
    );

    // 2. Fallback to Google Translate API
    if (!translatedText) {
      translatedText = await translateWithGoogle(
        text,
        targetLanguage,
        detectedSource
      );
      confidence = 0.9; // Google Translate is more accurate
    }

    // 3. If both fail, return original with low confidence
    if (!translatedText) {
      return NextResponse.json({
        translatedText: text,
        sourceLanguage: detectedSource,
        targetLanguage,
        confidence: 0.3,
        warning: "Translation service unavailable, returning original text",
      });
    }

    return NextResponse.json({
      translatedText,
      sourceLanguage: detectedSource,
      targetLanguage,
      confidence,
    });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
