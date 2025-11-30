"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Lightbulb, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { submitIdea } from "../../../lib/services/ideas";
import { createClient } from "../../../lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { trackAnalyticsEvent } from "../../../lib/analytics/track-event";
import { useUser } from "../../../hooks/useUser";

const ideaSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

type IdeaFormData = z.infer<typeof ideaSchema>;

export default function SuggestIdeaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
  });

  const onSubmit = async (data: IdeaFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Track analytics event
      await trackAnalyticsEvent("idea_opened", {
        user_id: user?.id,
        platform: typeof window !== "undefined" ? "web" : "unknown",
      });

      const result = await submitIdea(data.title, data.description);

      if (result.success) {
        // Track submission
        await trackAnalyticsEvent("idea_submitted", {
          idea_id: result.id,
          user_id: user?.id,
          platform: typeof window !== "undefined" ? "web" : "unknown",
        });

        setSubmitSuccess(true);
        reset();

        // Navigate back to profile after 2 seconds
        setTimeout(() => {
          router.push("/home/profile");
        }, 2000);
      } else {
        setSubmitError(result.error || "Failed to submit idea");
      }
    } catch (error: any) {
      console.error("Error submitting idea:", error);
      setSubmitError(error.message || "Failed to submit idea");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 lg:pb-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-green-900">
                  Idea Submitted!
                </h2>
                <p className="mt-2 text-green-700">
                  Thank you for your idea. We&apos;ll review it and get back to
                  you if it&apos;s chosen.
                </p>
              </div>
              <Button
                onClick={() => router.push("/home/profile")}
                variant="outline"
                className="mt-4"
              >
                Back to Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24 lg:pb-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-teal-600" />
            Suggest an Idea
          </CardTitle>
          <CardDescription>
            Share your ideas to improve SpareCarry. If your idea is chosen,
            you&apos;ll receive a lifetime Pro subscription!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Title *
              </label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Brief description of your idea"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Description *
              </label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your idea in detail (at least 20 characters)"
                rows={6}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {submitError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-teal-600 text-white hover:bg-teal-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Submit Idea
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
