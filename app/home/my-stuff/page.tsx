"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Package,
  Plane,
  ShieldCheck,
  Mail,
} from "lucide-react";

import { createClient } from "../../../lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { useUser } from "../../../hooks/useUser";
import { ContactSupportForm } from "../../../components/support/contact-support-form";

type Trip = {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  departure_date?: string | null;
  eta_window_start?: string | null;
  eta_window_end?: string | null;
  status: string;
  type: string;
  spare_kg: number;
  created_at: string;
};

type Request = {
  id: string;
  user_id: string;
  title: string;
  from_location: string;
  to_location: string;
  deadline_latest: string;
  status: string;
  max_reward: number;
  created_at: string;
};

type Delivery = {
  dispute_opened_at?: string | null;
  delivered_at?: string | null;
};

type MatchRecord = {
  id: string;
  status: string;
  reward_amount: number;
  updated_at: string;
  requests?: Request | Request[] | null;
  trips?: Trip | Trip[] | null;
  deliveries?: Delivery[] | null;
};

type DisputeRecord = {
  id: string;
  match_id: string;
  reason: string;
  status: "open" | "resolved" | "rejected";
  opened_by: string;
  resolution_notes?: string | null;
  created_at: string;
};

type MyStuffData = {
  userId: string;
  trips: Trip[];
  requests: Request[];
  matches: MatchRecord[];
  disputes: DisputeRecord[];
};

const matchStatusCopy: Record<string, string> = {
  pending: "Pending",
  chatting: "Chatting",
  escrow_paid: "In Escrow",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

function normalizeSingle<T>(value?: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function fetchMyStuff(userId: string): Promise<MyStuffData> {
  const supabase = createClient();

  if (!userId) {
    throw new Error("You need to be signed in to view this page.");
  }

  const [tripsResult, requestsResult] = await Promise.all([
    supabase
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (tripsResult.error) throw tripsResult.error;
  if (requestsResult.error) throw requestsResult.error;

  const trips = (tripsResult.data ?? []) as Trip[];
  const requests = (requestsResult.data ?? []) as Request[];

  const tripIds = trips.map((trip) => trip.id);
  const requestIds = requests.map((request) => request.id);

  const [matchesFromTrips, matchesFromRequests] = await Promise.all([
    tripIds.length
      ? supabase
          .from("matches")
          .select(
            `
          *,
          trips(*),
          requests(*),
          deliveries(dispute_opened_at, delivered_at)
        `
          )
          .in("trip_id", tripIds)
      : Promise.resolve({ data: [], error: null }),
    requestIds.length
      ? supabase
          .from("matches")
          .select(
            `
          *,
          trips(*),
          requests(*),
          deliveries(dispute_opened_at, delivered_at)
        `
          )
          .in("request_id", requestIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (matchesFromTrips.error) throw matchesFromTrips.error;
  if (matchesFromRequests.error) throw matchesFromRequests.error;

  const matchesFromTripsData = (matchesFromTrips.data ?? []) as MatchRecord[];
  const matchesFromRequestsData = (matchesFromRequests.data ??
    []) as MatchRecord[];

  const matchMap = new Map<string, MatchRecord>();
  [...matchesFromTripsData, ...matchesFromRequestsData].forEach((match) => {
    matchMap.set(match.id, match as MatchRecord);
  });

  const matches = Array.from(matchMap.values()).sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const matchIds = matches.map((match) => match.id);

  const disputesResult = matchIds.length
    ? await supabase
        .from("disputes")
        .select("*")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (disputesResult.error) throw disputesResult.error;

  return {
    userId: userId,
    trips,
    requests,
    matches,
    disputes: (disputesResult.data ?? []) as DisputeRecord[],
  };
}

function StatusBadge({ status }: { status: string }) {
  const label = matchStatusCopy[status] || status;
  const color =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : status === "disputed"
        ? "bg-amber-50 text-amber-700 border border-amber-100"
        : status === "cancelled"
          ? "bg-slate-100 text-slate-600 border border-slate-200"
          : "bg-teal-50 text-teal-700 border border-teal-100";

  return (
    <Badge className={color} variant="outline">
      {label}
    </Badge>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-8 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export default function MyStuffPage() {
  const { user } = useUser();
  const [supportFormOpen, setSupportFormOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-stuff", user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error("You need to be signed in to view this page.");
      }
      return fetchMyStuff(user.id);
    },
    enabled: !!user?.id,
    retry: false,
    throwOnError: false,
  });

  const activeMatches = useMemo(() => {
    if (!data) return [];
    return data.matches.filter(
      (match) => match.status !== "cancelled" && match.status !== "completed"
    );
  }, [data]);

  const openDisputes = useMemo(() => {
    if (!data) return [];
    return data.disputes.filter((dispute) => dispute.status === "open");
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Unable to load your data
            </CardTitle>
            <CardDescription>
              Something went wrong while fetching your trips and requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const matchLookup = new Map(data.matches.map((match) => [match.id, match]));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 pb-24 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Stuff</h1>
        <p className="mt-1 text-slate-600">
          Track everything you&apos;re carrying, requesting, and resolving.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Package className="h-4 w-4" />
              Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">
              {data.requests.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              You&apos;ve posted {data.requests.length} delivery needs.
            </p>
            <div className="mt-4">
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/home/post-request">Post another request</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Plane className="h-4 w-4" />
              Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">
              {data.trips.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Share upcoming trips to earn when you have spare capacity.
            </p>
            <div className="mt-4">
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/home/post-trip">Post a trip</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <MessageSquare className="h-4 w-4" />
              Active matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">
              {activeMatches.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {activeMatches.length
                ? "Keep the conversation going."
                : "No chats in progress right now."}
            </p>
            <div className="mt-4">
              <Button asChild size="sm" className="w-full">
                <Link href="/home">Browse new matches</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Matches & chats</CardTitle>
            <CardDescription>
              All of your conversations and escrowed deliveries in one place.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.matches.length === 0 && (
            <EmptyState
              title="No matches yet"
              description="Once someone connects with your request or trip, the chat will show up here."
              action={
                <Button asChild>
                  <Link href="/home">Return to browse</Link>
                </Button>
              }
            />
          )}

          {data.matches.map((match) => {
            const trip = normalizeSingle(match.trips);
            const request = normalizeSingle(match.requests);
            const delivery = Array.isArray(match.deliveries)
              ? match.deliveries[0]
              : match.deliveries;
            const route = trip
              ? `${trip.from_location} → ${trip.to_location}`
              : request
                ? `${request.from_location} → ${request.to_location}`
                : "Route pending";
            const role =
              request && request.user_id === data.userId
                ? "Requester"
                : trip && trip.user_id === data.userId
                  ? "Traveler"
                  : "Participant";

            return (
              <div
                key={match.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {request?.title || "Trip match"}{" "}
                      <span className="text-slate-400">• {role}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{route}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Updated{" "}
                      {formatDistanceToNow(new Date(match.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="space-y-2 text-right">
                    <StatusBadge status={match.status} />
                    {delivery?.dispute_opened_at && (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-xs text-amber-700"
                      >
                        Dispute opened{" "}
                        {format(new Date(delivery.dispute_opened_at), "MMM d")}
                      </Badge>
                    )}
                    <Button asChild size="sm">
                      <Link href={`/home/messages/${match.id}`}>Open chat</Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
          <CardDescription>
            Keep tabs on everything you&apos;re asking the community to carry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.requests.length === 0 && (
            <EmptyState
              title="No active requests"
              description="Post your first request and travelers will reach out within minutes."
              action={
                <Button asChild>
                  <Link href="/home/post-request">Create a request</Link>
                </Button>
              }
            />
          )}
          {data.requests.map((request) => (
            <div
              key={request.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {request.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {request.from_location} → {request.to_location}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Needed by{" "}
                    {format(new Date(request.deadline_latest), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <Badge
                    variant="outline"
                    className="border-slate-200 text-slate-700"
                  >
                    {request.status}
                  </Badge>
                  <p className="text-sm text-slate-600">
                    ${request.max_reward.toLocaleString()} reward
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trips */}
      <Card>
        <CardHeader>
          <CardTitle>Your trips</CardTitle>
          <CardDescription>
            Share your spare capacity and earn referral credits and rewards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.trips.length === 0 && (
            <EmptyState
              title="No trips posted"
              description="Planning a voyage or flight? Let requesters know so they can send cargo your way."
              action={
                <Button asChild>
                  <Link href="/home/post-trip">Post a trip</Link>
                </Button>
              }
            />
          )}
          {data.trips.map((trip) => (
            <div
              key={trip.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {trip.from_location} → {trip.to_location}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {trip.type === "plane" && trip.departure_date
                      ? `Departing ${format(new Date(trip.departure_date), "MMM d, yyyy")}`
                      : trip.eta_window_start && trip.eta_window_end
                        ? `On the water ${format(new Date(trip.eta_window_start), "MMM d")} – ${format(
                            new Date(trip.eta_window_end),
                            "MMM d"
                          )}`
                        : "Dates TBD"}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <Badge
                    variant="outline"
                    className="border-slate-200 text-slate-700"
                  >
                    {trip.status}
                  </Badge>
                  <p className="text-sm text-slate-600">
                    {trip.spare_kg} kg available
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Support & Disputes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            Support & disputes
          </CardTitle>
          <CardDescription>
            We keep every delivery accountable. Track any investigations below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {openDisputes.length === 0 && (
            <div className="py-8 text-center">
              <p className="mb-2 text-lg font-semibold text-slate-900">
                All clear!
              </p>
              <p className="mb-6 text-sm text-slate-500">
                You have no open support tickets.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => setSupportFormOpen(true)}
                  variant="outline"
                  className="border-teal-600 text-teal-600 hover:bg-teal-50"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            </div>
          )}
          {openDisputes.map((dispute) => {
            const match = matchLookup.get(dispute.match_id);
            const trip = match ? normalizeSingle(match.trips) : null;
            const request = match ? normalizeSingle(match.requests) : null;
            return (
              <div
                key={dispute.id}
                className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-amber-900">
                    Dispute opened{" "}
                    {format(new Date(dispute.created_at), "MMM d, yyyy")}
                  </p>
                  <Badge
                    variant="outline"
                    className="border-amber-300 text-amber-800"
                  >
                    {dispute.status}
                  </Badge>
                </div>
                <p className="text-sm text-amber-900">
                  {dispute.reason || "Awaiting details"}
                </p>
                <p className="text-xs text-amber-900/70">
                  Match:&nbsp;
                  {request?.title
                    ? `${request.title} (${request.from_location} → ${request.to_location})`
                    : trip
                      ? `${trip.from_location} → ${trip.to_location}`
                      : "Unknown match"}
                </p>
                <div className="flex justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/home/messages/${dispute.match_id}`}>
                      View chat
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
          {openDisputes.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setSupportFormOpen(true)}
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ContactSupportForm
        open={supportFormOpen}
        onOpenChange={setSupportFormOpen}
      />
    </div>
  );
}
