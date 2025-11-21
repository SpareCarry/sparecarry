"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Star } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

interface RatingModalProps {
  matchId: string;
  otherUserId: string;
  onClose: () => void;
}

export function RatingModal({
  matchId,
  otherUserId,
  onClose,
}: RatingModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user has already rated
  const { data: existingRating } = useQuery({
    queryKey: ["rating", matchId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("ratings")
        .select("*")
        .eq("match_id", matchId)
        .eq("rater_id", user.id)
        .single();

      return data;
    },
  });

  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || "");
    }
  }, [existingRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Create or update rating
      if (existingRating) {
        const { error } = await supabase
          .from("ratings")
          .update({
            rating,
            comment: comment || null,
          })
          .eq("id", existingRating.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("ratings").insert({
          match_id: matchId,
          rater_id: user.id,
          ratee_id: otherUserId,
          rating,
          comment: comment || null,
        });

        if (error) throw error;
      }

      // Note: Match status is already "completed" after delivery confirmation
      // Ratings are independent - both parties can rate

      onClose();
      router.refresh();
    } catch (error) {
      console.error("Error submitting rating:", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit rating";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience with this delivery?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
              placeholder="Share your experience..."
            />
          </div>

          <Button
            type="submit"
            disabled={rating === 0 || loading}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

