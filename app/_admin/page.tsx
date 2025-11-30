"use client";

import { useState } from "react";
import {
  Users,
  Package,
  Hand,
  AlertTriangle,
  DollarSign,
  Lightbulb,
} from "lucide-react";
import { UsersTable } from "../../components/admin/users-table";
import { RequestsTripsTable } from "../../components/admin/requests-trips-table";
import { MatchesTable } from "../../components/admin/matches-table";
import { DisputesTable } from "../../components/admin/disputes-table";
import { PayoutsTable } from "../../components/admin/payouts-table";
import { IdeasTable } from "../../components/admin/ideas-table";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";

type Tab =
  | "users"
  | "requests-trips"
  | "matches"
  | "disputes"
  | "payouts"
  | "ideas";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const tabs = [
    { id: "users" as Tab, label: "Users", icon: Users },
    { id: "requests-trips" as Tab, label: "Requests & Trips", icon: Package },
    { id: "matches" as Tab, label: "Matches", icon: Hand },
    { id: "disputes" as Tab, label: "Disputes", icon: AlertTriangle },
    { id: "payouts" as Tab, label: "Payouts", icon: DollarSign },
    { id: "ideas" as Tab, label: "Ideas", icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage users, matches, disputes, and payouts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-none border-b-2 border-transparent",
                  activeTab === tab.id
                    ? "border-teal-600 bg-teal-50 text-teal-600"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "users" && <UsersTable />}
        {activeTab === "requests-trips" && <RequestsTripsTable />}
        {activeTab === "matches" && <MatchesTable />}
        {activeTab === "disputes" && <DisputesTable />}
        {activeTab === "payouts" && <PayoutsTable />}
        {activeTab === "ideas" && <IdeasTable />}
      </div>
    </div>
  );
}
