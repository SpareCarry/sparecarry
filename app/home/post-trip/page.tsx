"use client";

import { PostTripForm } from "../../../components/forms/post-trip-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Plane } from "lucide-react";

export default function PostTripPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Post Trip</h1>
        <p className="text-slate-600">
          Traveling somewhere? Post your trip and earn money carrying items.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-6 w-6 text-teal-600" />
            Trip Details
          </CardTitle>
          <CardDescription>
            Share your travel plans and available capacity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PostTripForm />
        </CardContent>
      </Card>
    </div>
  );
}

