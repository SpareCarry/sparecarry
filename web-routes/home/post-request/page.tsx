"use client";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { PostRequestForm } from "../../../components/forms/post-request-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Package } from "lucide-react";

function PostRequestFormFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-slate-500">Loading form...</div>
    </div>
  );
}

export default function PostRequestPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Post Request</h1>
        <p className="text-slate-600">
          Need something delivered? Post a request and let travelers help you out.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6 text-teal-600" />
            Request Details
          </CardTitle>
          <CardDescription>
            Fill out the form below to create your delivery request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PostRequestFormFallback />}>
            <PostRequestForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

