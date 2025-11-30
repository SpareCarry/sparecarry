"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
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
import { CheckCircle2, XCircle, Loader2, Search, Ship } from "lucide-react";
import { format } from "date-fns";

export function UsersTable() {
  const supabase = createClient() as SupabaseClient;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("users")
        .select(
          `
          *,
          profiles(*)
        `
        )
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(
          `email.ilike.%${searchQuery}%,profiles.boat_name.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const verifySailorMutation = useMutation({
    mutationFn: async ({
      userId,
      verified,
    }: {
      userId: string;
      verified: boolean;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          verified_sailor_at: verified ? new Date().toISOString() : null,
        })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
          <Input
            placeholder="Search by email or boat name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Boat Info</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Sailor Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user: any) => {
              const profile = Array.isArray(user.profiles)
                ? user.profiles[0]
                : user.profiles;
              const isVerifiedSailor = !!profile?.verified_sailor_at;
              const hasBoatInfo = !!profile?.boat_name;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-slate-500">
                        {user.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {hasBoatInfo ? (
                      <div>
                        <div className="font-medium">{profile.boat_name}</div>
                        {profile.boat_type && (
                          <div className="text-xs text-slate-500">
                            {profile.boat_type}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        No boat info
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile?.stripe_identity_verified_at ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">
                        Not Verified
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isVerifiedSailor ? (
                      <Badge className="bg-teal-100 text-teal-800">
                        <Ship className="mr-1 h-3 w-3" />
                        Verified Sailor
                      </Badge>
                    ) : hasBoatInfo ? (
                      <Badge variant="outline" className="text-amber-600">
                        Pending Review
                      </Badge>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {hasBoatInfo && !isVerifiedSailor && (
                      <Button
                        size="sm"
                        onClick={() =>
                          verifySailorMutation.mutate({
                            userId: user.id,
                            verified: true,
                          })
                        }
                        disabled={verifySailorMutation.isPending}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {verifySailorMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Verify Sailor
                          </>
                        )}
                      </Button>
                    )}
                    {isVerifiedSailor && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          verifySailorMutation.mutate({
                            userId: user.id,
                            verified: false,
                          })
                        }
                        disabled={verifySailorMutation.isPending}
                      >
                        {verifySailorMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="mr-1 h-4 w-4" />
                            Revoke
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {users?.length === 0 && (
        <div className="py-12 text-center text-slate-500">No users found</div>
      )}
    </div>
  );
}
