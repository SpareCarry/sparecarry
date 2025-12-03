/**
 * Types for PostRequestForm components
 */

import { Place } from "../../../lib/services/location";
import { WeightEstimate, WeightFeel } from "../../../lib/utils/weight-estimation";
import { ItemTemplate } from "../../../lib/data/item-templates";

// PlaceResult is used for Google Places API autocomplete results
export interface PlaceResult {
  description: string;
  place_id: string;
}

// Form state types
export interface PostRequestFormState {
  photos: File[];
  fromPlace: PlaceResult | null;
  toPlace: PlaceResult | null;
  departurePlace: Place | null;
  arrivalPlace: Place | null;
  fromPredictions: PlaceResult[];
  toPredictions: PlaceResult[];
  showFromSuggestions: boolean;
  showToSuggestions: boolean;
  distance: number | null;
  suggestedReward: number;
  shippingEstimate: ReturnType<typeof import("../../../lib/services/shipping").calculateShippingEstimate> | null;
  originCountryIso2: string;
  destinationCountryIso2: string;
  loading: boolean;
  showTemplateSelector: boolean;
  isAutoEstimated: boolean;
  detectedWeight: WeightEstimate | null;
  weightFeel: WeightFeel | null;
  weightValidation: {
    isValid: boolean;
    message?: string;
  } | null;
  showReferenceItems: boolean;
  estimatedWeightFromDimensions: number | null;
  weightManuallySet: boolean;
  lastWeightFeel: WeightFeel | null;
  deadlineUrgency: "3" | "7" | "14" | "14+";
}

// Props for sub-components
export interface BasicSectionProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  showTemplateSelector: boolean;
  onShowTemplateSelector: () => void;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  loading: boolean;
  onTemplateSelect: (template: ItemTemplate, specs: any) => void;
}

export interface LocationsSectionProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  fromPlace: PlaceResult | null;
  toPlace: PlaceResult | null;
  departurePlace: Place | null;
  arrivalPlace: Place | null;
  fromPredictions: PlaceResult[];
  toPredictions: PlaceResult[];
  showFromSuggestions: boolean;
  showToSuggestions: boolean;
  onFromPlaceChange: (place: PlaceResult | null) => void;
  onToPlaceChange: (place: PlaceResult | null) => void;
  onDeparturePlaceChange: (place: Place | null) => void;
  onArrivalPlaceChange: (place: Place | null) => void;
  onFromPredictionsChange: (predictions: PlaceResult[]) => void;
  onToPredictionsChange: (predictions: PlaceResult[]) => void;
  onShowFromSuggestionsChange: (show: boolean) => void;
  onShowToSuggestionsChange: (show: boolean) => void;
  distance: number | null;
  deadlineUrgency: "3" | "7" | "14" | "14+";
  onDeadlineUrgencyChange: (urgency: "3" | "7" | "14" | "14+") => void;
}

export interface DimensionsSectionProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  isAutoEstimated: boolean;
  onAutoMeasureComplete: (dimensions: { length_cm: number; width_cm: number; height_cm: number }, photos?: File[]) => void;
  detectedWeight: WeightEstimate | null;
  weightFeel: WeightFeel | null;
  onWeightFeelChange: (feel: WeightFeel | null) => void;
  weightValidation: { isValid: boolean; message?: string } | null;
  showReferenceItems: boolean;
  onShowReferenceItemsChange: (show: boolean) => void;
  estimatedWeightFromDimensions: number | null;
  preferredMethod: "plane" | "boat" | "any" | "quickest" | "best_fit";
  restrictedItems: boolean;
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
}

export interface OptionsSectionProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  preferredMethod: "plane" | "boat" | "any" | "quickest" | "best_fit";
  restrictedItems: boolean;
  fragile: boolean;
  emergency: boolean;
  isPremium: boolean;
}

export interface EstimateSectionProps {
  shippingEstimate: ReturnType<typeof import("../../../lib/services/shipping").calculateShippingEstimate> | null;
  suggestedReward: number;
  maxReward: number;
  preferredMethod: "plane" | "boat" | "any" | "quickest" | "best_fit";
  isPremium: boolean;
  distance: number | null;
  onMaxRewardChange: (value: number) => void;
}

