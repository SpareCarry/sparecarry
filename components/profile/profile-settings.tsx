"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Anchor, Loader2, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
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
import {
  COUNTRIES,
  COUNTRY_TO_CURRENCY,
  getCurrencyForCountry,
} from "../../lib/utils/countries";
import type { ProfileUpdate } from "../../types/supabase";

export function ProfileSettings() {
  const supabase = createClient() as SupabaseClient;
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [passwordSectionOpen, setPasswordSectionOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
    current: false,
  });
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  type ProfileSettingsData = {
    is_boater?: boolean;
    boat_name?: string | null;
    prefer_imperial_units?: boolean;
    notify_route_matches?: boolean;
    preferred_currency?: string;
    country_of_residence?: string | null;
    phone?: string | null;
  };

  const { data: profile, isLoading } = useQuery<ProfileSettingsData | null>({
    queryKey: ["profile-settings", user?.id],
    queryFn: async (): Promise<ProfileSettingsData | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "is_boater, boat_name, prefer_imperial_units, notify_route_matches, preferred_currency, country_of_residence, phone"
        )
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.warn("Error fetching profile settings:", error);
        return null;
      }
      return (data as ProfileSettingsData | null) ?? null;
    },
    enabled: !!user,
  });

  const { data: userData } = useQuery<{
    completed_deliveries_count?: number;
  } | null>({
    queryKey: ["user-completed-deliveries", user?.id],
    queryFn: async (): Promise<{
      completed_deliveries_count?: number;
    } | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("users")
        .select("completed_deliveries_count")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
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
    country_of_residence?: string | null;
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
          country_of_residence: updates.country_of_residence ?? undefined,
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

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "Password must be at least 6 characters long",
      });
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Passwords do not match",
      });
      setPasswordLoading(false);
      return;
    }

    try {
      // Update user password using Supabase auth
      // Note: If user doesn't have a password, we can set it directly
      // If they do have a password, we need the current password (but Supabase doesn't require it for updateUser)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordMessage({
        type: "success",
        text: "Password set successfully! You can now use password login.",
      });

      // Clear form
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setPasswordSectionOpen(false);

      // Clear message after 5 seconds
      setTimeout(() => setPasswordMessage(null), 5000);
    } catch (error: any) {
      setPasswordMessage({
        type: "error",
        text: error.message || "Failed to set password. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
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
                Show your boat name and get the golden anchor badge after 5+
                deliveries
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
                  updateProfileMutation.mutate({
                    boat_name: e.target.value || null,
                  });
                }}
                placeholder="e.g., Sea Breeze"
              />
            </div>
          )}

          {hasGoldenAnchor && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <Anchor className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                🏆 Golden Anchor Badge: You&apos;ve completed{" "}
                {completedDeliveries} deliveries!
              </span>
            </div>
          )}
        </div>

        {/* Imperial Units Preference */}
        <div className="flex items-center justify-between border-t pt-4">
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
        <div className="flex items-center justify-between border-t pt-4">
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

        {/* Country of Residence */}
        <div className="space-y-2 border-t pt-4">
          <Label htmlFor="country_of_residence">Country of Residence</Label>
          <Select
            value={profile?.country_of_residence || ""}
            onValueChange={(value) => {
              const currency = getCurrencyForCountry(value);
              updateProfileMutation.mutate({
                country_of_residence: value,
                // Auto-update currency if country has a default currency
                ...(currency ? { preferred_currency: currency } : {}),
              });
            }}
          >
            <SelectTrigger id="country_of_residence">
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
          <p className="text-xs text-slate-500">
            Your country of residence helps us provide better service and may
            auto-set your currency preference.
          </p>
        </div>

        {/* Preferred Currency */}
        <div className="space-y-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="preferred_currency">Preferred Currency</Label>
            <span className="text-xs text-slate-500">
              Stays the same worldwide
            </span>
          </div>
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
          <p className="text-xs text-slate-500">
            Your preferred currency will be used for all prices, regardless of
            your current location. Set this to your home currency (e.g., AUD if
            you&apos;re from Australia) to keep prices consistent.
          </p>
        </div>

        {/* Password Management */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4" />
                Password Login
              </Label>
              <p className="text-sm text-slate-500">
                {passwordSectionOpen
                  ? "Set a password to enable password login (in addition to magic link and Google OAuth)"
                  : "Set a password to enable password login. You can still use magic link or Google OAuth."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPasswordSectionOpen(!passwordSectionOpen);
                setPasswordMessage(null);
                setNewPassword("");
                setConfirmPassword("");
                setCurrentPassword("");
              }}
            >
              {passwordSectionOpen ? "Cancel" : "Set Password"}
            </Button>
          </div>

          {passwordSectionOpen && (
            <form
              onSubmit={handleSetPassword}
              className="space-y-4 rounded-lg border bg-slate-50 p-4"
            >
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    disabled={passwordLoading}
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={passwordLoading}
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={`rounded-md p-3 text-sm ${
                    passwordMessage.type === "success"
                      ? "border border-green-200 bg-green-50 text-green-800"
                      : "border border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {passwordMessage.text}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700"
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Set Password
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-500">
                After setting a password, you can log in using:
                <br />
                • Password login
                <br />
                • Magic link (passwordless)
                <br />• Google OAuth
              </p>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
