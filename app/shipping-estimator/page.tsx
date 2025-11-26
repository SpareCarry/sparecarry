/**
 * Shipping Cost Estimator Screen
 * 
 * Allows users to compare courier prices with SpareCarry prices
 */

"use client";

import React, { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Calculator, TrendingDown, AlertCircle, ArrowRight, Heart, CheckCircle2, Info, Crown, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { calculateShippingEstimate, ShippingEstimateInput, getAvailableCouriers } from '../../lib/services/shipping';
import { getCountryPreset } from '../../src/utils/countryPresets';
import { CountrySelect } from '../../components/CountrySelect';
import { Country } from '../../src/constants/countries';
import { isValidIso2 } from '../../src/utils/validateCountry';
import { checkSubscriptionStatus } from '../../src/utils/subscriptionUtils';
import { calculateKarma } from '../../src/utils/karma';
import { useUser } from '../../hooks/useUser';
import { createClient } from '../../lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { trackShippingEstimatorUsed, trackEmergencySelected } from '../../lib/analytics/tracking';
import { TopRoutes } from '../../components/TopRoutes';
import { TipsTooltip } from '../../components/TipsTooltip';
import { getDaysLeft } from '@/utils/getDaysLeft';
import { PLATFORM_FEE_PERCENT } from '../../config/platformFees';
import { TrustedBadge } from '../../components/promo/TrustedBadge';
import { SavingsCounter } from '../../components/promo/SavingsCounter';
import { PromoScrollIndicator } from '../../components/promo/PromoScrollIndicator';
import { useSearchParams } from 'next/navigation';
import { SizeTierSelector } from '../../components/ui/size-tier-selector';
import { getSizeTier } from '../../lib/utils/size-tier';

function ShippingEstimatorContent() {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  
  // Form state - using ISO2 codes
  const [originCountryIso2, setOriginCountryIso2] = useState<string>('');
  const [destinationCountryIso2, setDestinationCountryIso2] = useState<string>('');
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [declaredValue, setDeclaredValue] = useState<string>('');
  const [selectedCourier, setSelectedCourier] = useState<string>('DHL');
  const [errors, setErrors] = useState<{ origin?: string; destination?: string }>({});
  const [wantsKarma, setWantsKarma] = useState<boolean>(true);
  const [showKarmaNotification, setShowKarmaNotification] = useState<boolean>(false);
  const [karmaPoints, setKarmaPoints] = useState<number>(0);
  const [suggestedReward, setSuggestedReward] = useState<number | null>(null);
  const [sizeTier, setSizeTier] = useState<'small' | 'medium' | 'large' | 'extra_large' | null>(null);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  // Check subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', user?.id],
    queryFn: () => checkSubscriptionStatus(user?.id),
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  const isPremium = subscriptionStatus?.isPremium ?? false;

  // Get available options
  const availableCouriers = getAvailableCouriers();

  // Pre-fill from query params
  useEffect(() => {
    const from = searchParams?.get('from');
    const to = searchParams?.get('to');
    const weightParam = searchParams?.get('weight');
    const lengthParam = searchParams?.get('length');
    const widthParam = searchParams?.get('width');
    const heightParam = searchParams?.get('height');
    const suggestedRewardParam = searchParams?.get('suggestedReward');
    
    if (from) {
      // Try to find country from location name
      // This is simplified - in production, you'd use a geocoding service
      setOriginCountryIso2('');
    }
    if (to) {
      setDestinationCountryIso2('');
    }
    if (weightParam) setWeight(weightParam);
    if (lengthParam) setLength(lengthParam);
    if (widthParam) setWidth(widthParam);
    if (heightParam) setHeight(heightParam);
    if (suggestedRewardParam) {
      const reward = parseFloat(suggestedRewardParam);
      if (!isNaN(reward)) setSuggestedReward(reward);
    }
    
    // Clean URL after reading params
    if (searchParams && (from || to || weightParam || suggestedRewardParam)) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Auto-fill when destination country changes
  const handleDestinationChange = useCallback((country: Country) => {
    setDestinationCountryIso2(country.iso2);
    setErrors((prev) => ({ ...prev, destination: undefined }));
    
    // Auto-fill dimensions from preset if available
    const preset = getCountryPreset(country.iso2);
    if (preset) {
      setLength(preset.length.toString());
      setWidth(preset.width.toString());
      setHeight(preset.height.toString());
      setWeight(preset.weight.toString());
    }
  }, []);

  // Handle origin country change
  const handleOriginChange = useCallback((country: Country) => {
    setOriginCountryIso2(country.iso2);
    setErrors((prev) => ({ ...prev, origin: undefined }));
  }, []);

  // Calculate estimate
  // Memoize premium savings message to prevent re-renders
  const premiumSavingsMessage = useMemo(() => {
    const daysLeft = getDaysLeft();
    if (!isPremium && daysLeft > 0) {
      return (
        <div key="early-supporter" className="p-3 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg mb-3">
          <div className="flex items-center gap-2 text-sm text-teal-800">
            <Sparkles className="h-4 w-4 text-teal-600" />
            <span>
              <strong>Early Supporter Reward:</strong> You&apos;re paying 0% platform fees (normally {Math.round(PLATFORM_FEE_PERCENT * 100)}%) until Feb 18, 2026!
            </span>
          </div>
        </div>
      );
    }
    return null;
  }, [isPremium]);

  const estimate = useMemo(() => {
    // Validate countries
    if (!originCountryIso2 || !isValidIso2(originCountryIso2)) {
      return null;
    }
    if (!destinationCountryIso2 || !isValidIso2(destinationCountryIso2)) {
      return null;
    }
    
    // Parse numeric values
    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const declaredValueNum = parseFloat(declaredValue) || 0;
    
    // Validate that required numeric fields are present and > 0
    if (!length || isNaN(lengthNum) || lengthNum <= 0) {
      return null;
    }
    if (!width || isNaN(widthNum) || widthNum <= 0) {
      return null;
    }
    if (!height || isNaN(heightNum) || heightNum <= 0) {
      return null;
    }
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      return null;
    }

    const input: ShippingEstimateInput = {
      originCountry: originCountryIso2,
      destinationCountry: destinationCountryIso2,
      length: lengthNum,
      width: widthNum,
      height: heightNum,
      weight: weightNum,
      declaredValue: declaredValueNum,
      selectedCourier,
      isPremium, // Pass subscription status
    };

    const result = calculateShippingEstimate(input);
    
    // Calculate karma points if estimate is available and user wants karma
    if (result && wantsKarma && weightNum > 0) {
      // Use average platform fee for karma calculation
      const avgPlatformFee = (result.platformFeePlane + result.platformFeeBoat) / 2;
      const karma = calculateKarma({
        weight: weightNum,
        platformFee: avgPlatformFee,
      });
      setKarmaPoints(karma);
      
      // Show notification if karma points > 0
      if (karma > 0 && !showKarmaNotification) {
        setShowKarmaNotification(true);
        // Auto-hide after 5 seconds
        setTimeout(() => setShowKarmaNotification(false), 5000);
      }
    } else {
      setKarmaPoints(0);
    }

    return result;
  }, [originCountryIso2, destinationCountryIso2, length, width, height, weight, declaredValue, selectedCourier, isPremium, wantsKarma, showKarmaNotification]);

  // Handle create job
  const handleCreateJob = useCallback(() => {
    // Validate before proceeding
    const validationErrors: { origin?: string; destination?: string } = {};
    
    if (!originCountryIso2 || !isValidIso2(originCountryIso2)) {
      validationErrors.origin = "Please select a valid origin country.";
    }
    if (!destinationCountryIso2 || !isValidIso2(destinationCountryIso2)) {
      validationErrors.destination = "Please select a valid destination country.";
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!estimate) return;

    // Determine which price to prefill (prefer boat if available, otherwise plane)
    const prefilledMaxReward = estimate.spareCarryBoatPrice > 0 
      ? Math.round(estimate.spareCarryBoatPrice) 
      : Math.round(estimate.spareCarryPlanePrice);

    const prefillData = {
      from_location: originCountryIso2,
      to_location: destinationCountryIso2,
      originCountryIso2,
      destinationCountryIso2,
      length_cm: parseFloat(length) || 0,
      width_cm: parseFloat(width) || 0,
      height_cm: parseFloat(height) || 0,
      weight_kg: parseFloat(weight) || 0,
      value_usd: parseFloat(declaredValue) || 0,
      max_reward: prefilledMaxReward, // Prefill with estimated SpareCarry price
      selectedCourier,
      courierPrice: estimate.courierPrice,
      spareCarryPlanePrice: estimate.spareCarryPlanePrice,
      spareCarryBoatPrice: estimate.spareCarryBoatPrice,
      platformFeePlane: estimate.platformFeePlane,
      platformFeeBoat: estimate.platformFeeBoat,
      stripeFeePlane: estimate.stripeFeePlane,
      stripeFeeBoat: estimate.stripeFeeBoat,
      netRevenuePlane: estimate.netRevenuePlane,
      netRevenueBoat: estimate.netRevenueBoat,
      customsCost: estimate.customsCost, // Include customs cost
      karmaPoints: wantsKarma ? karmaPoints : 0,
      wantsKarma,
      size_tier: sizeTier,
    };

    // Track analytics
    trackShippingEstimatorUsed(originCountryIso2, destinationCountryIso2, false);

    // Navigate to post request page with prefill data
    router.push(`/home/post-request?prefill=${encodeURIComponent(JSON.stringify(prefillData))}`);
  }, [estimate, originCountryIso2, destinationCountryIso2, length, width, height, weight, declaredValue, selectedCourier, router, karmaPoints, wantsKarma, sizeTier]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6 min-h-screen">
      <PromoScrollIndicator />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Calculator className="h-8 w-8 text-teal-600" />
          Shipping Cost Estimator
        </h1>
        <p className="text-slate-600">
          Compare courier prices with SpareCarry delivery options and see your savings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Package Details
              <TipsTooltip tipId="shipping-estimator-1" context="shipping-estimator" />
            </CardTitle>
            <CardDescription>Enter your shipment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CountrySelect
                id="origin_country"
                label="Origin Country"
                placeholder="Search country or ISO"
                value={originCountryIso2}
                onChange={(iso2) => {
                  setOriginCountryIso2(iso2);
                  setErrors((prev) => ({ ...prev, origin: undefined }));
                }}
                onSelect={handleOriginChange}
                required
                error={errors.origin}
                showIso2={true}
              />
              <CountrySelect
                id="destination_country"
                label="Destination Country"
                placeholder="Search country or ISO"
                value={destinationCountryIso2}
                onChange={(iso2) => {
                  setDestinationCountryIso2(iso2);
                  setErrors((prev) => ({ ...prev, destination: undefined }));
                }}
                onSelect={handleDestinationChange}
                required
                error={errors.destination}
                showIso2={true}
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length (cm) *</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (cm) *</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  const weightNum = parseFloat(e.target.value);
                  if (!isNaN(weightNum) && weightNum > 0) {
                    setSizeTier(getSizeTier(weightNum));
                  }
                }}
                placeholder="1.0"
              />
            </div>

            {/* Size Tier Selector */}
            <SizeTierSelector
              value={sizeTier || undefined}
              onValueChange={(tier) => setSizeTier(tier)}
              weightKg={parseFloat(weight) || undefined}
            />

            {/* Declared Value */}
            <div className="space-y-2">
              <Label htmlFor="declared_value">Declared Value ($ USD)</Label>
              <Input
                id="declared_value"
                type="number"
                step="0.01"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500">Optional - for customs calculation</p>
            </div>

            {/* Courier Selection */}
            <div className="space-y-2">
              <Label htmlFor="courier">Compare with Courier</Label>
              <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                <SelectTrigger id="courier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCouriers.map((courier) => (
                    <SelectItem key={courier} value={courier}>
                      {courier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Price Comparison</CardTitle>
            <CardDescription>See how much you can save</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {estimate ? (
              <>
                {/* Courier Price */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Courier ({selectedCourier})</div>
                  <div className="text-2xl font-bold text-slate-900">
                    ${estimate.courierTotal.toFixed(2)}
                  </div>
                  {estimate.customsCost > 0 && (
                    <div className="text-xs text-slate-500 mt-1">
                      Shipping: ${estimate.courierPrice.toFixed(2)} + Customs: ${estimate.customsCost.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* SpareCarry Plane */}
                <div className="p-4 bg-teal-50 border-2 border-teal-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-teal-900">SpareCarry Plane</div>
                    <div className="text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded">
                      Save {estimate.savingsPercentagePlane}%
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-teal-900 mb-1">
                    ${estimate.spareCarryPlanePrice.toFixed(2)}
                  </div>
                  {isPremium && (
                    <div className="text-xs text-teal-700 font-medium mb-1">
                      Premium discount applied
                    </div>
                  )}
                  <div className="text-sm font-semibold text-green-600">
                    You save ${estimate.savingsPlane.toFixed(2)}
                  </div>
                </div>

                {/* SpareCarry Boat */}
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-blue-900">SpareCarry Boat</div>
                    <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                      Save {estimate.savingsPercentageBoat}%
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mb-1">
                    ${estimate.spareCarryBoatPrice.toFixed(2)}
                  </div>
                  {isPremium && (
                    <div className="text-xs text-blue-700 font-medium mb-1">
                      Premium discount applied
                    </div>
                  )}
                  <SavingsCounter 
                    savings={estimate.savingsBoat} 
                    className="text-sm font-semibold"
                  />
                </div>

                {/* Premium Savings Message - Show during promo period */}
                {premiumSavingsMessage}

                {/* Premium CTA Card - Only show for non-premium users */}
                {!isPremium && estimate.premiumPlanePrice && estimate.premiumBoatPrice && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <div className="text-sm font-semibold text-purple-900">Upgrade to SpareCarry Pro for extra savings!</div>
                      </div>
                      <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        Premium
                      </div>
                    </div>
                    
                    {/* Premium Savings Calculation */}
                    {(() => {
                      const estimatedPremiumSavings = Math.max(
                        estimate.premiumSavingsPercentagePlane || 0,
                        estimate.premiumSavingsPercentageBoat || 0
                      );
                      return estimatedPremiumSavings > 0 ? (
                        <div className="mb-3 text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded inline-block">
                          ⭐ Premium saves you up to {estimatedPremiumSavings}% on this delivery.
                        </div>
                      ) : null;
                    })()}
                    
                    {/* Premium Plane Price */}
                    <div className="mb-3 pb-3 border-b border-purple-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium text-purple-800">SpareCarry Plane (Premium)</div>
                        {estimate.premiumSavingsPercentagePlane && (
                          <div className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            Save {estimate.premiumSavingsPercentagePlane}%
                          </div>
                        )}
                      </div>
                      <div className="text-xl font-bold text-purple-900 mb-1">
                        ${estimate.premiumPlanePrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-purple-700 font-medium mb-1">
                        Premium discount applied
                      </div>
                      {estimate.premiumSavingsPlane && (
                        <div className="text-xs font-semibold text-green-600">
                          You save ${estimate.premiumSavingsPlane.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Premium Boat Price */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium text-purple-800">SpareCarry Boat (Premium)</div>
                        {estimate.premiumSavingsPercentageBoat && (
                          <div className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            Save {estimate.premiumSavingsPercentageBoat}%
                          </div>
                        )}
                      </div>
                      <div className="text-xl font-bold text-purple-900 mb-1">
                        ${estimate.premiumBoatPrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-purple-700 font-medium mb-1">
                        Premium discount applied
                      </div>
                      {estimate.premiumSavingsBoat && (
                        <div className="text-xs font-semibold text-green-600">
                          You save ${estimate.premiumSavingsBoat.toFixed(2)}
                        </div>
                      )}
                    </div>
                    
                    {/* Premium Savings Note */}
                    {estimate.premiumSavingsPlane && estimate.premiumSavingsBoat && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-xs text-purple-700">
                          Most users save ${Math.min(estimate.premiumSavingsPlane, estimate.premiumSavingsBoat).toFixed(2)} when they upgrade!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Karma Toggle */}
                {user && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantsKarma}
                        onChange={(e) => setWantsKarma(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-purple-900 flex items-center gap-1">
                        <Heart className="h-4 w-4 text-purple-600" />
                        I want to earn karma points
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="ml-auto text-purple-600 hover:text-purple-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm text-purple-900">Why I earned this</h4>
                            <p className="text-xs text-slate-600">
                              You helped a traveller! Karma points reflect your contributions and encourage return usage.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </label>
                    {wantsKarma && karmaPoints > 0 && (
                      <div className="mt-2 text-xs text-purple-700">
                        Estimated karma: +{karmaPoints} points
                      </div>
                    )}
                  </div>
                )}

                {/* Karma Notification */}
                {showKarmaNotification && karmaPoints > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-green-900">
                        You helped a traveller!
                      </div>
                      <div className="text-xs text-green-700">
                        +{karmaPoints} karma points
                      </div>
                    </div>
                    <button
                      onClick={() => setShowKarmaNotification(false)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Karma Info near Create Job Button */}
                {user && wantsKarma && karmaPoints > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-purple-700">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
                        >
                          <Info className="h-3 w-3" />
                          <span>About karma points</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-purple-900">Why I earned this</h4>
                          <p className="text-xs text-slate-600">
                            You helped a traveller! Karma points reflect your contributions and encourage return usage.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Suggested Reward Buttons */}
                {suggestedReward !== null && estimate && (
                  <div className="space-y-2 mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-sm font-medium text-teal-900 mb-2">
                      Suggested reward: ${suggestedReward.toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const prefilledMaxReward = estimate.spareCarryBoatPrice > 0 
                            ? Math.round(estimate.spareCarryBoatPrice) 
                            : Math.round(estimate.spareCarryPlanePrice);
                          const prefillData = {
                            from_location: originCountryIso2,
                            to_location: destinationCountryIso2,
                            originCountryIso2,
                            destinationCountryIso2,
                            length_cm: parseFloat(length) || 0,
                            width_cm: parseFloat(width) || 0,
                            height_cm: parseFloat(height) || 0,
                            weight_kg: parseFloat(weight) || 0,
                            value_usd: parseFloat(declaredValue) || 0,
                            max_reward: suggestedReward,
                            selectedCourier,
                            courierPrice: estimate.courierPrice,
                            spareCarryPlanePrice: estimate.spareCarryPlanePrice,
                            spareCarryBoatPrice: estimate.spareCarryBoatPrice,
                            platformFeePlane: estimate.platformFeePlane,
                            platformFeeBoat: estimate.platformFeeBoat,
                            size_tier: sizeTier,
                          };
                          router.push(`/home/post-request?prefill=${encodeURIComponent(JSON.stringify(prefillData))}`);
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                        size="lg"
                      >
                        Use ${suggestedReward.toFixed(0)}
                      </Button>
                      <Button
                        onClick={() => {
                          setSuggestedReward(null);
                          handleCreateJob();
                        }}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                      >
                        I&apos;ll set my own
                      </Button>
                    </div>
                  </div>
                )}

                {/* Create Job Button */}
                {suggestedReward === null && (
                  <Button
                    onClick={handleCreateJob}
                    className="w-full bg-teal-600 hover:bg-teal-700 mt-4"
                    size="lg"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Create SpareCarry Job from This Estimate
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Fill in the form to see price comparison
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="mt-6 bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>Estimate only.</strong> Actual customs/courier costs may vary. Please verify with your local customs authority and courier provider. SpareCarry prices are estimates and may vary based on route, availability, and other factors.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ShippingEstimatorFallback() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Calculator className="h-8 w-8 text-teal-600" />
          Shipping Cost Estimator
        </h1>
        <p className="text-slate-600">
          Compare courier prices with SpareCarry delivery options and see your savings
        </p>
      </div>
      <div className="flex items-center justify-center py-8">
        <div className="text-slate-500">Loading...</div>
      </div>
    </div>
  );
}

export default function ShippingEstimatorPage() {
  return (
    <Suspense fallback={<ShippingEstimatorFallback />}>
      <ShippingEstimatorContent />
    </Suspense>
  );
}

