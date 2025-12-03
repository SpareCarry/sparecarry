"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription } from "../ui/card";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Loader2, Ship, CheckCircle2 } from "lucide-react";

interface OnboardingStep3Props {
  onComplete: () => void;
}

export function OnboardingStep3({ onComplete }: OnboardingStep3Props) {
  const [isSailor, setIsSailor] = useState<boolean | null>(null);
  const [boatName, setBoatName] = useState("");
  const [boatType, setBoatType] = useState("");
  const [boatLength, setBoatLength] = useState("");
  const [boatPhoto, setBoatPhoto] = useState<File | null>(null);
  const [boatPapers, setBoatPapers] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient() as SupabaseClient;

  const handleFileUpload = async (
    file: File,
    path: string
  ): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("boat-documents")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("boat-documents").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not found");

      let boatPhotoUrl = null;
      let boatPapersUrl = null;

      if (isSailor) {
        if (boatPhoto) {
          boatPhotoUrl = await handleFileUpload(boatPhoto, "photos");
        }
        if (boatPapers) {
          boatPapersUrl = await handleFileUpload(boatPapers, "papers");
        }

        // Update profile with boat information
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            boat_name: boatName || null,
            boat_type: boatType || null,
            boat_length_ft: boatLength ? parseInt(boatLength) : null,
            // Note: verified_sailor_at will be set by admin later
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      }

      onComplete();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save information";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isSailor === null) {
    return (
      <div className="space-y-4">
        <Card className="border-teal-200 bg-teal-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Ship className="mt-1 h-8 w-8 flex-shrink-0 text-teal-600" />
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">
                  Do you have a boat?
                </h3>
                <CardDescription>
                  Get verified as a sailor to build trust in the yacht community. Verified sailors get priority in the feed and are trusted by yachties looking for reliable deliveries. You can add this information later if needed.
                </CardDescription>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={() => setIsSailor(true)}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            Yes, I Have a Boat
          </Button>
          <Button
            onClick={() => setIsSailor(false)}
            variant="outline"
            className="flex-1"
          >
            Skip for Now
          </Button>
        </div>
      </div>
    );
  }

  if (!isSailor) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-slate-600">
          You can add boat information later in your profile.
        </p>
        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="boatName">Boat Name (Optional)</Label>
          <Input
            id="boatName"
            value={boatName}
            onChange={(e) => setBoatName(e.target.value)}
            placeholder="e.g., Sea Breeze"
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="boatType">Boat Type (Optional)</Label>
          <Input
            id="boatType"
            value={boatType}
            onChange={(e) => setBoatType(e.target.value)}
            placeholder="e.g., Catamaran, Sailboat, Motorboat"
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="boatLength">Boat Length (ft) (Optional)</Label>
          <Input
            id="boatLength"
            type="number"
            value={boatLength}
            onChange={(e) => setBoatLength(e.target.value)}
            placeholder="e.g., 42"
            className="bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="boatPhoto">Boat Photo (Optional)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="boatPhoto"
              type="file"
              accept="image/*"
              onChange={(e) => setBoatPhoto(e.target.files?.[0] || null)}
              className="bg-white"
            />
            {boatPhoto && (
              <span className="flex items-center gap-1 text-sm text-teal-600">
                <CheckCircle2 className="h-4 w-4" />
                Selected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Upload a photo of your boat for verification
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="boatPapers">Boat Papers/Documents (Optional)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="boatPapers"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setBoatPapers(e.target.files?.[0] || null)}
              className="bg-white"
            />
            {boatPapers && (
              <span className="flex items-center gap-1 text-sm text-teal-600">
                <CheckCircle2 className="h-4 w-4" />
                Selected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Upload boat registration or ownership documents
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your sailor verification will be reviewed
              by our admin team. You&apos;ll receive a &quot;Verified
              Sailor&quot; badge once approved.
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsSailor(null)}
          className="flex-1"
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-teal-600 hover:bg-teal-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save & Continue"
          )}
        </Button>
      </div>
    </form>
  );
}
