"use client";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { ExternalLink, Package, Copy, Check } from "lucide-react";
import { useState } from "react";
import { generatePurchaseLink, formatShippingAddress } from "../../lib/affiliate/affiliate-links";

interface PurchaseLinkButtonProps {
  retailer: "west_marine" | "svb" | "amazon";
  itemTitle: string;
  travelerAddress?: {
    name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  matchId: string;
}

const retailerNames = {
  west_marine: "West Marine",
  svb: "SVB",
  amazon: "Amazon",
};

export function PurchaseLinkButton({
  retailer,
  itemTitle,
  travelerAddress,
  matchId,
}: PurchaseLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const purchaseLink = generatePurchaseLink(retailer, itemTitle, travelerAddress);
  const formattedAddress = travelerAddress
    ? formatShippingAddress(travelerAddress)
    : null;

  const handleCopyAddress = async () => {
    if (formattedAddress) {
      await navigator.clipboard.writeText(formattedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenLink = () => {
    window.open(purchaseLink, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Purchase from {retailerNames[retailer]}
              </h4>
              <p className="text-sm text-slate-600 mt-1">
                Buy and ship directly to your traveler
              </p>
            </div>
          </div>

          {travelerAddress && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-slate-700">
                  Shipping Address:
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-6 px-2 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">
                {formattedAddress}
              </pre>
            </div>
          )}

          <Button
            onClick={handleOpenLink}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open {retailerNames[retailer]} & Purchase
          </Button>

          {!travelerAddress && (
            <p className="text-xs text-slate-500 text-center">
              Shipping address will be available after traveler confirms match
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

