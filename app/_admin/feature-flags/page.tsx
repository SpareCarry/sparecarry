/**
 * Feature Flags Admin Page
 *
 * Admin interface for managing feature flags
 */

"use client";

import { useState, useEffect } from "react";
import { useFeatureFlags } from "@/app/providers/FeatureFlagProvider";
import { getAllFeatureFlags } from "@/lib/flags/unleashClient";

interface FlagDefinition {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
}

// Default feature flags
const DEFAULT_FLAGS: FlagDefinition[] = [
  {
    key: "enable_push_notifications",
    name: "Push Notifications",
    description: "Enable push notifications for users",
    defaultValue: false,
  },
  {
    key: "email_notifications",
    name: "Email Notifications",
    description: "Enable email notifications",
    defaultValue: false,
  },
  {
    key: "dispute_refund_flow",
    name: "Dispute Refund Flow",
    description: "Enable dispute and refund flow",
    defaultValue: false,
  },
  {
    key: "emergency_toggle_push",
    name: "Emergency Toggle Push",
    description: "Emergency toggle for push notifications (disable all)",
    defaultValue: false,
  },
];

export default function FeatureFlagsPage() {
  const { flags, isEnabled, isLoading, refresh } = useFeatureFlags();
  const [localFlags, setLocalFlags] = useState<Map<string, boolean>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Initialize local flags from context
    const initialFlags = new Map<string, boolean>();
    DEFAULT_FLAGS.forEach((flag) => {
      initialFlags.set(flag.key, isEnabled(flag.key, flag.defaultValue));
    });
    setLocalFlags(initialFlags);
  }, [flags, isEnabled]);

  const handleToggle = (flagKey: string) => {
    setLocalFlags((prev) => {
      const updated = new Map(prev);
      updated.set(flagKey, !updated.get(flagKey));
      return updated;
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // In a real implementation, this would call your backend API
      // to update flags in Unleash server
      const unleashUrl = process.env.NEXT_PUBLIC_UNLEASH_URL;
      const adminKey = process.env.NEXT_PUBLIC_UNLEASH_ADMIN_KEY;

      if (!unleashUrl || !adminKey) {
        throw new Error("Unleash not configured");
      }

      // Update each flag
      for (const [flagKey, enabled] of localFlags.entries()) {
        const response = await fetch(
          `${unleashUrl}/api/admin/projects/default/features/${flagKey}/environments/production/on`,
          {
            method: enabled ? "POST" : "DELETE",
            headers: {
              Authorization: adminKey,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update flag: ${flagKey}`);
        }
      }

      setSaveSuccess(true);
      await refresh(); // Refresh flags from server
    } catch (error) {
      console.error("[FeatureFlags] Failed to save:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save flags"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const resetFlags = new Map<string, boolean>();
    DEFAULT_FLAGS.forEach((flag) => {
      resetFlags.set(flag.key, flag.defaultValue);
    });
    setLocalFlags(resetFlags);
    setSaveError(null);
    setSaveSuccess(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-teal-600"></div>
          <p className="text-gray-600">Loading feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage feature flags for the application
            </p>
          </div>

          <div className="px-6 py-4">
            {saveError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                Feature flags saved successfully!
              </div>
            )}

            <div className="space-y-4">
              {DEFAULT_FLAGS.map((flag) => {
                const enabled = localFlags.get(flag.key) ?? flag.defaultValue;
                const serverEnabled = isEnabled(flag.key, flag.defaultValue);
                const hasChanges = enabled !== serverEnabled;

                return (
                  <div
                    key={flag.key}
                    className={`rounded-lg border p-4 ${hasChanges ? "border-yellow-300 bg-yellow-50" : "border-gray-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {flag.name}
                          </h3>
                          {hasChanges && (
                            <span className="ml-2 rounded bg-yellow-200 px-2 py-1 text-xs font-medium text-yellow-800">
                              Unsaved
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {flag.description}
                        </p>
                        <p className="mt-1 font-mono text-xs text-gray-400">
                          {flag.key}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(flag.key)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                            enabled ? "bg-teal-600" : "bg-gray-200"
                          }`}
                          role="switch"
                          aria-checked={enabled}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              enabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-md border border-transparent bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-medium text-gray-900">
              Current Server State
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-2">
              {DEFAULT_FLAGS.map((flag) => {
                const serverEnabled = isEnabled(flag.key, flag.defaultValue);
                return (
                  <div
                    key={flag.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">{flag.name}</span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        serverEnabled
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {serverEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
