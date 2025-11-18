"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { generateBoatDeclarationPDF, type BoatDeclarationData } from "@/lib/pdf/boat-declaration";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface BoatDeclarationButtonProps {
  matchId: string;
}

export function BoatDeclarationButton({ matchId }: BoatDeclarationButtonProps) {
  const supabase = createClient();
  const [generating, setGenerating] = useState(false);

  const { data: match } = useQuery({
    queryKey: ["match-for-declaration", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          trips!inner(
            from_location,
            to_location,
            eta_window_start,
            eta_window_end,
            type,
            users(email),
            profiles(boat_name, boat_type)
          ),
          requests!inner(
            title,
            description,
            weight_kg,
            value_usd,
            dimensions_cm,
            users(email)
          )
        `
        )
        .eq("id", matchId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ["current-user-for-declaration"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const handleGeneratePDF = () => {
    if (!match || !currentUser) return;

    setGenerating(true);

    try {
      const trip = match.trips;
      const request = match.requests;
      const profile = Array.isArray(trip.profiles) ? trip.profiles[0] : trip.profiles;

      // Parse dimensions if available
      let dimensions: any = {};
      if (request.dimensions_cm) {
        try {
          dimensions = JSON.parse(request.dimensions_cm);
        } catch (e) {
          // Ignore parse errors
        }
      }

      const declarationData: BoatDeclarationData = {
        vesselName: profile?.boat_name || "Vessel Name",
        vesselRegistration: profile?.boat_name || "REG-XXXX",
        captainName: trip.users?.email?.split("@")[0] || "Captain Name",
        departurePort: trip.from_location,
        arrivalPort: trip.to_location,
        departureDate: format(new Date(trip.eta_window_start), "MMMM d, yyyy"),
        arrivalDate: format(new Date(trip.eta_window_end), "MMMM d, yyyy"),
        items: [
          {
            description: request.title || "Item",
            quantity: 1,
            value: request.value_usd?.toString() || "0",
            purpose: "spare_parts",
          },
        ],
        requesterName: request.users?.email?.split("@")[0] || "Requester",
        requesterEmail: request.users?.email || "",
      };

      generateBoatDeclarationPDF(declarationData);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (!match || match.trips?.type !== "boat") {
    return null;
  }

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={generating}
      variant="outline"
      className="w-full"
    >
      {generating ? (
        <>
          <FileText className="mr-2 h-4 w-4 animate-pulse" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download Boat Spare Parts Declaration PDF
        </>
      )}
    </Button>
  );
}

