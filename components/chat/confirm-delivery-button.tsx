"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

interface ConfirmDeliveryButtonProps {
  matchId: string;
}

export function ConfirmDeliveryButton({ matchId }: ConfirmDeliveryButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!confirm("Confirm delivery and release payment to traveler?")) return;

    setLoading(true);
    try {
      const response = await fetch("/api/payments/confirm-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to confirm delivery");
      }

      // Invalidate queries to refresh match status
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      
      // Refresh to show rating modal
      router.refresh();
    } catch (error: any) {
      console.error("Error confirming delivery:", error);
      alert(error.message || "Failed to confirm delivery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4">
      <Button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm Delivery & Release Payment
          </>
        )}
      </Button>
    </div>
  );
}

