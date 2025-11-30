"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
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
import { Loader2, Search, Plane, Ship } from "lucide-react";
import { format } from "date-fns";

export function RequestsTripsTable() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "requests" | "trips">(
    "all"
  );

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["admin-requests", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("requests")
        .select(
          `
          *,
          users(email)
        `
        )
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,from_location.ilike.%${searchQuery}%,to_location.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: filterType === "all" || filterType === "requests",
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["admin-trips", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("trips")
        .select(
          `
          *,
          users(email)
        `
        )
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(
          `from_location.ilike.%${searchQuery}%,to_location.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: filterType === "all" || filterType === "trips",
  });

  const isLoading = requestsLoading || tripsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
          <Input
            placeholder="Search by title, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`rounded-md px-4 py-2 text-sm ${
              filterType === "all"
                ? "bg-teal-600 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("requests")}
            className={`rounded-md px-4 py-2 text-sm ${
              filterType === "requests"
                ? "bg-teal-600 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setFilterType("trips")}
            className={`rounded-md px-4 py-2 text-sm ${
              filterType === "trips"
                ? "bg-teal-600 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            Trips
          </button>
        </div>
      </div>

      {/* Requests Table */}
      {(filterType === "all" || filterType === "requests") && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="font-semibold">Requests</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.map((request: any) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.title}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {request.from_location} → {request.to_location}
                    </div>
                  </TableCell>
                  <TableCell>${request.max_reward?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {request.users?.email || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {format(new Date(request.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Trips Table */}
      {(filterType === "all" || filterType === "trips") && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="font-semibold">Trips</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips?.map((trip: any) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    {trip.type === "plane" ? (
                      <Badge className="bg-blue-100 text-blue-800">
                        <Plane className="mr-1 h-3 w-3" />
                        Plane
                      </Badge>
                    ) : (
                      <Badge className="bg-teal-100 text-teal-800">
                        <Ship className="mr-1 h-3 w-3" />
                        Boat
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {trip.from_location} → {trip.to_location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {trip.spare_kg}kg / {trip.spare_volume_liters}L
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{trip.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {trip.users?.email || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {format(new Date(trip.created_at), "MMM d, yyyy")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {((filterType === "all" || filterType === "requests") &&
        requests?.length === 0) ||
      ((filterType === "all" || filterType === "trips") &&
        trips?.length === 0) ? (
        <div className="py-12 text-center text-slate-500">No data found</div>
      ) : null}
    </div>
  );
}
