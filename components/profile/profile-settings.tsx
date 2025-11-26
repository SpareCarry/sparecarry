"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Anchor, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useUser } from "../../hooks/useUser";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CURRENCIES } from "../../lib/utils/currency";
import type { ProfileUpdate } from "../../types/supabase";

export function ProfileSettings() {
  const supabase = createClient() as SupabaseClient;
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  type ProfileSettingsData = {
    is_boater?: boolean;
    boat_name?: string | null;
    prefer_imperial_units?: boolean;
    notify_route_matches?: boolean;
    preferred_currency?: string;
    phone?: string | null;
  };

  const { data: profile, isLoading } = useQuery<ProfileSettingsData | null>({
    queryKey: ["profile-settings", user?.id],
    queryFn: async (): Promise<ProfileSettingsData | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("is_boater, boat_name, prefer_imperial_units, notify_route_matches, preferred_currency, phone")
        .eq("user_id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Error fetching profile settings:", error);
        return null;
      }
      return (data as ProfileSettingsData | null) ?? null;
    },
    enabled: !!user,
  });

  const { data: userData } = useQuery<{ completed_deliveries_count?: number } | null>({
    queryKey: ["user-completed-deliveries", user?.id],
    queryFn: async (): Promise<{ completed_deliveries_count?: number } | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("completed_deliveries_count")
        .eq("id", user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.warn("Error fetching user data:", error);
        return null;
      }
      return (data as { completed_deliveries_count?: number } | null) ?? null;
    },
    enabled: !!user,
  });

  type ProfileUpdateLocal = {
    is_boater?: boolean;
    boat_name?: string | null;
    prefer_imperial_units?: boolean;
    notify_route_matches?: boolean;
    preferred_currency?: string;
  };

  const updateProfileMutation = useMutation<void, Error, ProfileUpdateLocal>({
    mutationFn: async (updates: ProfileUpdateLocal): Promise<void> => {
      if (!user) throw new Error("Not authenticated");
      // Use the same pattern as step-3-sailor.tsx - direct update with object
      const { error } = await supabase
        .from("profiles")
        .update({
          is_boater: updates.is_boater ?? undefined,
          boat_name: updates.boat_name ?? undefined,
          prefer_imperial_units: updates.prefer_imperial_units ?? undefined,
          notify_route_matches: updates.notify_route_matches ?? undefined,
          preferred_currency: updates.preferred_currency ?? undefined,
        })
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile-settings"] });
      setSaving(false);
    },
    onError: () => {
      setSaving(false);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    // Get current form values (would need form state management)
    // For now, this is a placeholder
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedDeliveries = userData?.completed_deliveries_count || 0;
  const hasGoldenAnchor = completedDeliveries >= 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your profile preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Yachtie / Digital Nomad Mode */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_boater" className="text-base">
                I live on a boat or I&apos;m a digital nomad
              </Label>
              <p className="text-sm text-slate-500">
                Show your boat name and get the golden anchor badge after 5+ deliveries
              </p>
            </div>
            <Switch
              id="is_boater"
              checked={profile?.is_boater || false}
              onCheckedChange={(checked) => {
                updateProfileMutation.mutate({ is_boater: checked });
              }}
            />
          </div>
          
          {profile?.is_boater && (
            <div className="space-y-2">
              <Label htmlFor="boat_name">Boat Name (Optional)</Label>
              <Input
                id="boat_name"
                value={profile?.boat_name || ""}
                onChange={(e) => {
                  updateProfileMutation.mutate({ boat_name: e.target.value || null });
                }}
                placeholder="e.g., Sea Breeze"
              />
            </div>
          )}

          {hasGoldenAnchor && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Anchor className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                🏆 Golden Anchor Badge: You&apos;ve completed {completedDeliveries} deliveries!
              </span>
            </div>
          )}
        </div>

        {/* Imperial Units Preference */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <Label htmlFor="prefer_imperial" className="text-base">
              Prefer Imperial Units
            </Label>
            <p className="text-sm text-slate-500">
              Show lbs and ft/in first, with metric in parentheses
            </p>
          </div>
          <Switch
            id="prefer_imperial"
            checked={profile?.prefer_imperial_units || false}
            onCheckedChange={(checked) => {
              updateProfileMutation.mutate({ prefer_imperial_units: checked });
            }}
          />
        </div>

        {/* Route Match Notifications */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <Label htmlFor="notify_route_matches" className="text-base">
              Notify me when someone needs something on routes I travel
            </Label>
            <p className="text-sm text-slate-500">
              Get instant push notifications for matching requests
            </p>
          </div>
          <Switch
            id="notify_route_matches"
            checked={profile?.notify_route_matches || false}
            onCheckedChange={(checked) => {
              updateProfileMutation.mutate({ notify_route_matches: checked });
            }}
          />
        </div>

        {/* Preferred Currency */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="preferred_currency">Preferred Currency</Label>
          <Select
            value={profile?.preferred_currency || "USD"}
            onValueChange={(value) => {
              updateProfileMutation.mutate({ preferred_currency: value });
            }}
          >
            <SelectTrigger id="preferred_currency">
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
        </div>
      </CardContent>
    </Card>
  );
}

