/**
 * Tier-1 Features Integration Component
 * 
 * Integrates all Tier-1 features into listing forms:
 * - Safety Score
 * - Auto Category Detection
 * - Photo Verification
 * - ETA Estimator
 * - Allowed Rules Check
 */

"use client";

import React, { useMemo } from 'react';
import { SafetyBadge, AllowedWarningBox } from '../../modules/tier1Features/ui';
import { useSafetyScore, computeSafetyScore } from '../../modules/tier1Features/safety';
import { useAutoCategory } from '../../modules/tier1Features/categories';
import { useEtaEstimator, Location } from '../../modules/tier1Features/eta';
import { isAllowedToCarry, ItemDetails } from '../../modules/tier1Features/rules';
import { Card } from '../ui/card';

interface Tier1IntegrationProps {
  // Form values
  title?: string;
  description?: string;
  category?: string;
  onCategoryChange?: (category: string) => void;
  declaredValue?: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  photos?: (File | string)[];
  hasBatteries?: boolean;
  hasLiquids?: boolean;
  liquidVolume?: number;
  
  // ETA
  travelMethod?: 'plane' | 'boat';
  fromLocation?: Location;
  toLocation?: Location;
  manualBoatDays?: number;
  
  // Listing ID (if editing)
  listingId?: string | null;
}

export function Tier1Integration({
  title = '',
  description = '',
  category,
  onCategoryChange,
  declaredValue,
  weight,
  dimensions,
  photos = [],
  hasBatteries = false,
  hasLiquids = false,
  liquidVolume,
  travelMethod,
  fromLocation,
  toLocation,
  manualBoatDays,
  listingId = null,
}: Tier1IntegrationProps) {
  // Auto-detect category
  const categoryMatch = useAutoCategory(title, description);
  
  // Update category if auto-detected and no manual category set
  const displayCategory = category || categoryMatch.category;
  
  React.useEffect(() => {
    if (!category && categoryMatch.category !== 'other' && categoryMatch.confidence > 0.7 && onCategoryChange) {
      onCategoryChange(categoryMatch.category);
    }
  }, [category, categoryMatch, onCategoryChange]);

  // Compute safety score
  const listingDetails = useMemo(() => ({
    title,
    description,
    category: displayCategory,
    declaredValue,
    weight,
    dimensions,
    photoCount: photos.length,
    hasBatteries,
    hasLiquids,
  }), [title, description, displayCategory, declaredValue, weight, dimensions, photos.length, hasBatteries, hasLiquids]);

  const safetyScore = useSafetyScore(listingId, listingDetails);
  
  // Compute allowed check
  const allowedCheck = useMemo(() => {
    const itemDetails: ItemDetails = {
      category: displayCategory,
      title,
      description,
      hasBatteries,
      hasLiquids,
      liquidVolume,
      weight,
      value: declaredValue,
      isFood: displayCategory?.toLowerCase().includes('food'),
      isMedicine: displayCategory?.toLowerCase().includes('medicine'),
      containsAlcohol: title.toLowerCase().includes('alcohol') || description.toLowerCase().includes('alcohol'),
    };
    return isAllowedToCarry(itemDetails);
  }, [displayCategory, title, description, hasBatteries, hasLiquids, liquidVolume, weight, declaredValue]);

  // Compute ETA
  const etaResult = useEtaEstimator(
    travelMethod || 'plane',
    fromLocation,
    toLocation,
    manualBoatDays
  );

  return (
    <div className="space-y-4">
      {/* Auto-detected Category */}
      {categoryMatch.category !== 'other' && categoryMatch.confidence > 0.7 && !category && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="text-sm">
            <span className="font-medium">Suggested category:</span>{' '}
            <span className="text-blue-700">{categoryMatch.category}</span>
            <span className="text-blue-600 ml-1">({Math.round(categoryMatch.confidence * 100)}% confidence)</span>
          </div>
        </Card>
      )}

      {/* Safety Score */}
      {title && (
        <SafetyBadge
          score={safetyScore.score}
          reasons={safetyScore.reasons}
          collapsible={true}
        />
      )}

      {/* Allowed Check */}
      {(allowedCheck.warnings.length > 0 || allowedCheck.restrictions.length > 0) && (
        <AllowedWarningBox result={allowedCheck} />
      )}

    </div>
  );
}

