/**
 * Auto Category Detection Hook
 */

import { useMemo } from 'react';
import { autoDetectCategory, CategoryMatch } from './categoryRules';

/**
 * Hook to auto-detect category from title and description
 */
export function useAutoCategory(title?: string, description?: string): CategoryMatch {
  return useMemo(() => {
    const combinedText = [title, description].filter(Boolean).join(' ');
    return autoDetectCategory(combinedText);
  }, [title, description]);
}

