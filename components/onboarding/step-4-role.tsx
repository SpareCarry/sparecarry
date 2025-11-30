"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Loader2, Plane, Ship, Package, Users } from "lucide-react";
import { CURRENCIES } from "../../lib/utils/currency";
import { COUNTRIES, COUNTRY_TO_CURRENCY } from "../../lib/utils/countries";

interface OnboardingStep4Props {
  onComplete: () => void;
}

const roles = [
  {
    id: "traveler",
    title: "Plane Traveler",
    description: "I travel by plane and want to earn money carrying items",
    icon: Plane,
    color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
  },
  {
    id: "sailor",
    title: "Sailor",
    description: "I sail by boat and want to earn money carrying items",
    icon: Ship,
    color: "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100",
  },
  {
    id: "requester",
    title: "Need Stuff Delivered",
    description: "I need items delivered and want to save on shipping",
    icon: Package,
    color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100",
  },
  {
    id: "all",
    title: "All of the Above",
    description: "I want to both travel and request deliveries",
    icon: Users,
    color: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100",
  },
];

export function OnboardingStep4({ onComplete }: OnboardingStep4Props) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient() as SupabaseClient;

  // Auto-set currency when country changes
  useEffect(() => {
    if (selectedCountry && COUNTRY_TO_CURRENCY[selectedCountry]) {
      setSelectedCurrency(COUNTRY_TO_CURRENCY[selectedCountry]);
    }
  }, [selectedCountry]);

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not found");

      // Update user role
      const { error: updateError } = await supabase
        .from("users")
        .update({ role: selectedRole })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update profile with country and currency (if provided)
      if (selectedCountry || selectedCurrency) {
        const profileUpdates: {
          country_of_residence?: string;
          preferred_currency?: string;
        } = {};
        if (selectedCountry) {
          profileUpdates.country_of_residence = selectedCountry;
        }
        if (selectedCurrency) {
          profileUpdates.preferred_currency = selectedCurrency;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("user_id", user.id);

        if (profileError) {
          console.warn(
            "Failed to update profile with country/currency:",
            profileError
          );
          // Don't block onboarding if this fails
        }
      }

      onComplete();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save role";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">
          Choose Your Primary Role
        </h3>
        <p className="text-slate-600">
          Select how you&apos;ll primarily use CarrySpace. You can change this
          later.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-teal-600 ring-2 ring-teal-600"
                  : "border-slate-200 hover:border-slate-300"
              } ${role.color}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-lg p-2 ${
                      isSelected ? "bg-teal-600 text-white" : "bg-white/50"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-semibold">{role.title}</h4>
                    <p className="text-sm opacity-80">{role.description}</p>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Country and Currency Selection (Optional) */}
      <div className="space-y-4 border-t border-slate-200 pt-4">
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium">
            Country of Residence{" "}
            <span className="font-normal text-slate-400">(Optional)</span>
          </Label>
          <p className="text-xs text-slate-500">
            This helps us show prices in your local currency. You can change
            this anytime in settings.
          </p>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger id="country">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCurrency && (
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium">
              Preferred Currency
            </Label>
            <Select
              value={selectedCurrency}
              onValueChange={setSelectedCurrency}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(CURRENCIES).map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Auto-selected based on your country. You can change it if needed.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        className="w-full bg-teal-600 hover:bg-teal-700"
        disabled={loading || !selectedRole}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Complete Onboarding"
        )}
      </Button>
    </div>
  );
}
