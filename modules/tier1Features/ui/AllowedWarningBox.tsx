/**
 * Allowed Warning Box Component
 *
 * Displays warnings and restrictions from the "Is this Allowed?" rules engine
 */

"use client";

import React from "react";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { AllowedResult } from "../rules/isAllowedRules";

interface AllowedWarningBoxProps {
  result: AllowedResult;
  className?: string;
}

export function AllowedWarningBox({
  result,
  className = "",
}: AllowedWarningBoxProps) {
  if (!result.warnings.length && !result.restrictions.length) {
    return null; // Nothing to show
  }

  const isBlocked = !result.allowed || result.restrictions.length > 0;

  return (
    <Card
      className={`border-2 ${isBlocked ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"} ${className}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {isBlocked ? (
            <XCircle className="h-5 w-5 text-red-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          <CardTitle
            className={`text-base ${isBlocked ? "text-red-900" : "text-yellow-900"}`}
          >
            {isBlocked ? "⚠️ Restrictions" : "⚠️ Important Warnings"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {result.restrictions.length > 0 && (
          <div className="space-y-1">
            {result.restrictions.map((restriction, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-red-800"
              >
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{restriction}</span>
              </div>
            ))}
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((warning, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-yellow-800"
              >
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {result.allowed && !isBlocked && (
          <div className="border-t border-yellow-200 pt-2">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Item is allowed to carry, but review warnings above</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
