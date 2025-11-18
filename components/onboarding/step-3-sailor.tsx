"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();

  const handleFileUpload = async (file: File, path: string): Promise<string> => {
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
    } catch (err: any) {
      setError(err.message || "Failed to save information");
    } finally {
      setLoading(false);
    }
  };

  if (isSailor === null) {
    return (
      <div className="space-y-4">
        <Card className="bg-teal-50 border-teal-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Ship className="h-8 w-8 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Are you a sailor?</h3>
                <CardDescription>
                  If you plan to deliver items by boat, you can get verified as a sailor. This is
                  optional and can be done later.
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
            Yes, I'm a Sailor
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
        <p className="text-slate-600">You can add boat information later in your profile.</p>
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
              <span className="text-sm text-teal-600 flex items-center gap-1">
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
              <span className="text-sm text-teal-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Selected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Upload boat registration or ownership documents
          </p>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your sailor verification will be reviewed by our admin team.
              You'll receive a "Verified Sailor" badge once approved.
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-800 border border-red-200 text-sm">
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

