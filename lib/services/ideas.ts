/**
 * Ideas Service
 * Handles idea suggestion submissions and admin operations
 */

import { createClient } from "../supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface IdeaSuggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: "pending" | "reviewing" | "accepted" | "rejected";
  reward_granted: boolean;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface IdeaSuggestionWithUser extends IdeaSuggestion {
  users?: {
    email: string;
  };
}

/**
 * Submit a new idea suggestion
 */
export async function submitIdea(
  title: string,
  description: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = createClient() as SupabaseClient;

    // Validate input
    if (!title || title.trim().length < 5) {
      return {
        success: false,
        error: "Title must be at least 5 characters",
      };
    }

    if (!description || description.trim().length < 20) {
      return {
        success: false,
        error: "Description must be at least 20 characters",
      };
    }

    // Call RPC function
    const { data, error } = await supabase.rpc("submit_idea", {
      idea_title: title.trim(),
      idea_description: description.trim(),
    });

    if (error) {
      console.error("Error submitting idea:", error);
      return {
        success: false,
        error: error.message || "Failed to submit idea",
      };
    }

    return {
      success: true,
      id: data,
    };
  } catch (error: any) {
    console.error("Exception submitting idea:", error);
    return {
      success: false,
      error: error.message || "Failed to submit idea",
    };
  }
}

/**
 * Get all ideas submitted by the current user
 */
export async function getMyIdeas(): Promise<{
  success: boolean;
  ideas?: IdeaSuggestion[];
  error?: string;
}> {
  try {
    const supabase = createClient() as SupabaseClient;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const { data, error } = await supabase
      .from("idea_suggestions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ideas:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch ideas",
      };
    }

    return {
      success: true,
      ideas: data as IdeaSuggestion[],
    };
  } catch (error: any) {
    console.error("Exception fetching ideas:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch ideas",
    };
  }
}

/**
 * Admin: Get all idea suggestions (requires admin privileges)
 */
export async function adminGetAllIdeas(): Promise<{
  success: boolean;
  ideas?: IdeaSuggestionWithUser[];
  error?: string;
}> {
  try {
    const supabase = createClient() as SupabaseClient;

    // This will use service role key or admin RLS bypass
    // Admins should call this via an API route that uses service role
    // Join with users table to get email (via the foreign key relationship)
    const { data, error } = await supabase
      .from("idea_suggestions")
      .select(
        `
        *,
        users(email)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all ideas:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch ideas",
      };
    }

    return {
      success: true,
      ideas: data as IdeaSuggestionWithUser[],
    };
  } catch (error: any) {
    console.error("Exception fetching all ideas:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch ideas",
    };
  }
}

/**
 * Admin: Accept an idea (calls Edge Function)
 */
export async function adminAcceptIdea(
  ideaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/accept-idea-and-grant-reward`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ idea_id: ideaId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to accept idea",
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Exception accepting idea:", error);
    return {
      success: false,
      error: error.message || "Failed to accept idea",
    };
  }
}

/**
 * Admin: Reject an idea
 */
export async function adminRejectIdea(
  ideaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient() as SupabaseClient;

    // Get current user to set reviewed_by
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("idea_suggestions")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
      } as Record<string, unknown>)
      .eq("id", ideaId);

    if (error) {
      console.error("Error rejecting idea:", error);
      return {
        success: false,
        error: error.message || "Failed to reject idea",
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Exception rejecting idea:", error);
    return {
      success: false,
      error: error.message || "Failed to reject idea",
    };
  }
}

