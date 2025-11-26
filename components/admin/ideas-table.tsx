"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { CheckCircle2, XCircle, Loader2, Search, Lightbulb, Mail } from "lucide-react";
import { format } from "date-fns";
import { adminGetAllIdeas, adminAcceptIdea, adminRejectIdea, IdeaSuggestionWithUser } from "../../lib/services/ideas";
import { trackAnalyticsEvent } from "../../lib/analytics/track-event";

export function IdeasTable() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["admin-ideas", searchQuery],
    queryFn: async () => {
      const result = await adminGetAllIdeas();
      if (!result.success || !result.ideas) {
        throw new Error(result.error || "Failed to fetch ideas");
      }

      // Filter by search query if provided
      let filtered = result.ideas;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (idea) =>
            idea.title.toLowerCase().includes(query) ||
            idea.description.toLowerCase().includes(query) ||
            (idea.users?.email || "").toLowerCase().includes(query)
        );
      }

      return filtered;
    },
  });

  const acceptIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      // Find the idea to get user_id for analytics
      const idea = ideas?.find((i) => i.id === ideaId);
      
      const result = await adminAcceptIdea(ideaId);
      if (!result.success) {
        throw new Error(result.error || "Failed to accept idea");
      }

      // Track analytics
      if (idea) {
        await trackAnalyticsEvent("idea_accepted", {
          idea_id: ideaId,
          user_id: idea.user_id,
          reward_granted: true,
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ideas"] });
    },
  });

  const rejectIdeaMutation = useMutation({
    mutationFn: async (ideaId: string) => {
      const result = await adminRejectIdea(ideaId);
      if (!result.success) {
        throw new Error(result.error || "Failed to reject idea");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ideas"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const getStatusBadge = (status: string, rewardGranted: boolean) => {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Accepted {rewardGranted && "✓ Rewarded"}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "reviewing":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            Reviewing
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-teal-600" />
          <h2 className="text-xl font-semibold">Idea Suggestions</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
        </div>
      </div>

      {ideas && ideas.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p>No idea suggestions yet.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas?.map((idea: IdeaSuggestionWithUser) => (
                <TableRow key={idea.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {idea.title}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate text-sm text-slate-600">
                      {idea.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">
                        {idea.users?.email || "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {format(new Date(idea.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(idea.status, idea.reward_granted)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {idea.status === "pending" || idea.status === "reviewing" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acceptIdeaMutation.mutate(idea.id)}
                            disabled={
                              acceptIdeaMutation.isPending ||
                              rejectIdeaMutation.isPending
                            }
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            {acceptIdeaMutation.isPending &&
                            acceptIdeaMutation.variables === idea.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Accept
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectIdeaMutation.mutate(idea.id)}
                            disabled={
                              acceptIdeaMutation.isPending ||
                              rejectIdeaMutation.isPending
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {rejectIdeaMutation.isPending &&
                            rejectIdeaMutation.variables === idea.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {idea.status === "accepted"
                            ? "Accepted"
                            : "Rejected"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

