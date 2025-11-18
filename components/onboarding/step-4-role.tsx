"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plane, Ship, Package, Users } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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

      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">Choose Your Primary Role</h3>
        <p className="text-slate-600">
          Select how you'll primarily use CarrySpace. You can change this later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-teal-600 border-teal-600"
                  : "border-slate-200 hover:border-slate-300"
              } ${role.color}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? "bg-teal-600 text-white" : "bg-white/50"
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{role.title}</h4>
                    <p className="text-sm opacity-80">{role.description}</p>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-teal-600 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm">
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

