"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  userType: z.string().min(1, "Please select a user type"),
  tripFrom: z.string().optional(),
  tripTo: z.string().optional(),
  approximateDates: z.string().optional(),
  spareCapacity: z.string().optional(),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  travelType?: "plane" | "boat";
}

export function WaitlistForm({
  open,
  onOpenChange,
  travelType,
}: WaitlistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      userType:
        travelType === "plane"
          ? "Plane traveler"
          : travelType === "boat"
            ? "Sailor"
            : "",
    },
  });

  const userType = watch("userType");

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          userType: data.userType,
          tripFrom: data.tripFrom,
          tripTo: data.tripTo,
          approximateDates: data.approximateDates,
          spareCapacity: data.spareCapacity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      setSubmitStatus("success");
      reset();
      setTimeout(() => {
        onOpenChange(false);
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Join the Waitlist</DialogTitle>
          <DialogDescription>
            Be among the first to experience CarrySpace. We&apos;ll notify you
            when we launch!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="userType">I am mostly *</Label>
            <Select
              value={userType}
              onValueChange={(value) => setValue("userType", value)}
            >
              <SelectTrigger id="userType">
                <SelectValue placeholder="Select one" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Plane traveler">Plane traveler</SelectItem>
                <SelectItem value="Sailor">Sailor</SelectItem>
                <SelectItem value="Need stuff delivered">
                  Need stuff delivered
                </SelectItem>
                <SelectItem value="All of the above">
                  All of the above
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.userType && (
              <p className="text-sm text-destructive">
                {errors.userType.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tripFrom">From</Label>
              <Input
                id="tripFrom"
                placeholder="Miami"
                {...register("tripFrom")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tripTo">To</Label>
              <Input
                id="tripTo"
                placeholder="St. Martin"
                {...register("tripTo")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approximateDates">Approximate dates</Label>
            <Input
              id="approximateDates"
              placeholder="March 2024"
              {...register("approximateDates")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spareCapacity">Spare capacity (optional)</Label>
            <Input
              id="spareCapacity"
              placeholder="20 kg"
              {...register("spareCapacity")}
            />
          </div>

          {submitStatus === "success" && (
            <p className="text-sm text-green-600">
              Success! Check your email for confirmation.
            </p>
          )}
          {submitStatus === "error" && (
            <p className="text-sm text-destructive">
              Something went wrong. Please try again.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Join Waitlist"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
