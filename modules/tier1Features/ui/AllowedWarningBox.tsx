/**
 * Allowed Warning Box Component
 * 
 * Displays warnings and restrictions from the "Is this Allowed?" rules engine
 */

"use client";

import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { AllowedResult } from '../rules/isAllowedRules';

interface AllowedWarningBoxProps {
  result: AllowedResult;
  className?: string;
}

export function AllowedWarningBox({ result, className = '' }: AllowedWarningBoxProps) {
  if (!result.warnings.length && !result.restrictions.length) {
    return null; // Nothing to show
  }

  const isBlocked = !result.allowed || result.restrictions.length > 0;

  return (
    <Card className={`border-2 ${isBlocked ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {isBlocked ? (
            <XCircle className="w-5 h-5 text-red-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          )}
          <CardTitle className={`text-base ${isBlocked ? 'text-red-900' : 'text-yellow-900'}`}>
            {isBlocked ? '⚠️ Restrictions' : '⚠️ Important Warnings'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {result.restrictions.length > 0 && (
          <div className="space-y-1">
            {result.restrictions.map((restriction, index) => (
              <div key={index} className="text-sm text-red-800 flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{restriction}</span>
              </div>
            ))}
          </div>
        )}
        
        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((warning, index) => (
              <div key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {result.allowed && !isBlocked && (
          <div className="pt-2 border-t border-yellow-200">
            <div className="text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Item is allowed to carry, but review warnings above</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

