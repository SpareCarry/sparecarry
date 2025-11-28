"use client";

import { Label } from "./label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Info } from "lucide-react";
import { SIZE_TIERS, type SizeTier, getSizeTier } from "../../lib/utils/size-tier";

interface SizeTierSelectorProps {
  value?: SizeTier | null;
  onValueChange: (value: SizeTier) => void;
  weightKg?: number;
  className?: string;
}

export function SizeTierSelector({
  value,
  onValueChange,
  weightKg,
  className,
}: SizeTierSelectorProps) {
  // Auto-select based on weight if not manually set
  const selectedTier = value || (weightKg ? getSizeTier(weightKg) : null);
  const tierInfo = selectedTier ? SIZE_TIERS.find(t => t.id === selectedTier) : null;

  return (
    <div
      className={className}
      data-testid="size-tier-selector"
    >
      <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="size_tier">Package Size</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-slate-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">Select the size tier that best matches your package</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Select
        value={selectedTier || undefined}
        onValueChange={onValueChange}
      >
        <SelectTrigger id="size_tier">
          <SelectValue placeholder="Select size tier" />
        </SelectTrigger>
        <SelectContent>
          {SIZE_TIERS.map((tier) => (
            <SelectItem key={tier.id} value={tier.id}>
              <div className="flex flex-col">
                <span className="font-medium">{tier.label}</span>
                <span className="text-xs text-slate-500">{tier.weightRange}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {tierInfo && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-slate-500 mt-1 cursor-help">
                Examples: {tierInfo.examples}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-sm">{tierInfo.label}</p>
                <p className="text-xs">{tierInfo.weightRange}</p>
                <p className="text-xs text-slate-400">{tierInfo.examples}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

