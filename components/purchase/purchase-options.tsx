"use client";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ExternalLink, ShoppingCart, Package } from "lucide-react";
import { useState } from "react";

interface PurchaseOptionsProps {
  itemTitle: string;
  itemDescription?: string;
  selectedRetailer?: "west_marine" | "svb" | "amazon" | null;
  onSelectRetailer?: (retailer: "west_marine" | "svb" | "amazon" | undefined) => void;
}

export function PurchaseOptions({
  itemTitle,
  itemDescription,
  selectedRetailer: externalSelectedRetailer,
  onSelectRetailer,
}: PurchaseOptionsProps) {
  const [internalSelectedRetailer, setInternalSelectedRetailer] = useState<
    "west_marine" | "svb" | "amazon" | null
  >(null);
  
  const selectedRetailer = externalSelectedRetailer !== undefined 
    ? externalSelectedRetailer 
    : internalSelectedRetailer;

  const handleRetailerClick = (retailer: "west_marine" | "svb" | "amazon") => {
    // Toggle selection - if same retailer clicked, deselect
    const newSelection = selectedRetailer === retailer ? null : retailer;
    setInternalSelectedRetailer(newSelection);
    onSelectRetailer?.(newSelection || undefined);
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Buy & Ship Directly
            </h4>
            <p className="text-sm text-slate-600">
              Purchase from these retailers and ship directly to your traveler when match is confirmed
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRetailerClick("west_marine")}
              className={`w-full justify-start h-auto py-3 ${
                selectedRetailer === "west_marine"
                  ? "border-teal-600 bg-teal-50"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">West Marine</div>
                  <div className="text-xs text-slate-500">
                    Marine equipment & parts
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleRetailerClick("svb")}
              className={`w-full justify-start h-auto py-3 ${
                selectedRetailer === "svb" ? "border-teal-600 bg-teal-50" : ""
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-md flex items-center justify-center">
                  <Package className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">SVB (Sailing Yacht Parts)</div>
                  <div className="text-xs text-slate-500">
                    Sailing equipment & rigging
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleRetailerClick("amazon")}
              className={`w-full justify-start h-auto py-3 ${
                selectedRetailer === "amazon"
                  ? "border-teal-600 bg-teal-50"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-md flex items-center justify-center">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Amazon</div>
                  <div className="text-xs text-slate-500">
                    General items & electronics
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </div>
            </Button>
          </div>

          {selectedRetailer && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-md">
              <p className="text-xs text-teal-800">
                <strong>Note:</strong> When your request is matched, we&apos;ll provide a
                pre-filled shipping link with your traveler&apos;s address. You can purchase
                now or wait until match confirmation.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

