"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { WaitlistForm } from "../components/waitlist-form";
import {
  Plane,
  Ship,
  Package,
  DollarSign,
  Shield,
  CreditCard,
  MapPin,
  FileCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [travelType, setTravelType] = useState<"plane" | "boat" | undefined>();
  const [loading, setLoading] = useState(false);

  // REMOVED: Homepage redirect logic that was breaking PKCE flow
  // The OAuth callback must go DIRECTLY to /auth/callback, not through the homepage.
  // This intermediate redirect was causing the code_verifier to be lost from localStorage.
  // 
  // If Google redirects to homepage instead of callback:
  // 1. Check Supabase Dashboard -> Authentication -> URL Configuration
  // 2. Ensure Site URL matches your actual origin (localhost:3000 for web dev)
  // 3. Ensure Redirect URLs includes your callback URL

  const handleTravelClick = (type: "plane" | "boat") => {
    console.log("Button clicked:", type);

    // Prevent multiple clicks
    if (loading) {
      console.log("Already processing, ignoring click");
      return;
    }

    try {
      setLoading(true);
      setTravelType(type);

      // Always redirect to login first - let login page handle redirect if already authenticated
      // This ensures users always go through login flow
      const loginUrl = `/auth/login?redirect=/home&forceLogin=true`;
      
      console.log("Redirecting to login page:", loginUrl);
      
      // Use window.location.href for reliable navigation across all environments
      // This works better on mobile browsers and avoids router issues
      if (typeof window !== "undefined") {
        // Small delay to ensure state updates before navigation
        setTimeout(() => {
          window.location.href = loginUrl;
        }, 50);
      } else {
        console.error("window is undefined, cannot redirect");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in handleTravelClick:", error);
      setLoading(false);
    }
  };

  const openWaitlist = (type: "plane" | "boat") => {
    setTravelType(type);
    setWaitlistOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        id="main-content"
        role="main"
        className="relative flex min-h-screen items-center justify-center px-4 py-20"
        style={{
          background:
            "linear-gradient(to bottom, rgb(186 230 253), rgb(94 234 212), rgb(59 130 246), rgb(30 58 138))",
        }}
      >
        <div className="container relative z-10 mx-auto max-w-6xl text-center">
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">
            Get boat parts & supplies delivered by fellow yachties sailing your route
          </h1>
          <p className="mx-auto mb-12 max-w-3xl text-xl text-white/90 md:text-2xl">
            The yacht delivery network connecting sailors and yachties. Get items delivered marina-to-marina for 80% less than shipping, or earn money using your boat&apos;s spare space.
          </p>
          <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Boat button clicked - handler fired");
                handleTravelClick("boat");
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled={loading}
              className="relative z-50 w-full bg-teal-600 px-8 py-6 text-lg text-xl font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto cursor-pointer"
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50 }}
              size="lg"
              type="button"
            >
              {loading && travelType === "boat" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Ship className="mr-2 h-5 w-5" />
              )}
              ⚓ I&apos;m sailing by Boat
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Plane button clicked - handler fired");
                handleTravelClick("plane");
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled={loading}
              className="relative z-50 w-full bg-slate-900 px-8 py-6 text-lg text-xl font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto cursor-pointer"
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 50 }}
              size="lg"
              type="button"
            >
              {loading && travelType === "plane" ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Plane className="mr-2 h-5 w-5" />
              )}
              ✈ I&apos;m traveling by Plane
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold md:text-5xl">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Package className="mb-4 h-12 w-12 text-teal-600" />
                <CardTitle>1. Post your need or trip</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sailors post their marina routes. Yachties post what they need delivered—batteries, anchors, sails, and more.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="mb-4 h-12 w-12 text-teal-600" />
                <CardTitle>2. Match instantly</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our platform automatically matches sailors with yachties on the same marina route.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="mb-4 h-12 w-12 text-teal-600" />
                <CardTitle>3. Pay into escrow</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Secure payment held in escrow until delivery is confirmed.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Ship className="mb-4 h-12 w-12 text-teal-600" />
                <CardTitle>4. Deliver & get paid</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Sailor delivers at the marina, yachty confirms, payment is released.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Real Examples Section */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold md:text-5xl">
            Real examples
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
              <CardHeader>
                <Ship className="mb-4 h-10 w-10 text-slate-900" />
                <CardTitle className="text-2xl">
                  Sail St. Martin → Grenada, carry battery → earn $1,800
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  A verified sailor sailing from Port de Plaisance Marina to Port Louis Marina can transport a 200Ah marine battery and earn $1,800—great income for a Caribbean passage.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-green-50">
              <CardHeader>
                <Package className="mb-4 h-10 w-10 text-teal-600" />
                <CardTitle className="text-2xl">
                  Get a 200Ah battery to Grenada for $250 instead of $2,200 shipping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  A yachty in Grenada needs a marine battery delivered to Port Louis Marina. Instead of paying $2,200 for shipping and customs, they pay $250 to a fellow sailor already sailing that route.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-teal-50">
              <CardHeader>
                <Plane className="mb-4 h-10 w-10 text-teal-600" />
                <CardTitle className="text-2xl">
                  Fly Miami → St Martin, carry 20 kg → earn $450
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  A traveler flying from Miami to St. Martin can easily carry 20kg of electronics and earn $450—more than covering their checked bag fee.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-white px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-4xl font-bold md:text-5xl">
            Trust & Safety
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <FileCheck className="mb-4 h-12 w-12 text-teal-600" />
                <CardTitle>Passport/ID verified</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All travelers and requesters verify their identity with
                  government-issued ID.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="mb-4 h-12 w-12 text-teal-600" />
                <CardTitle>Escrow via Stripe</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Payments are securely held in escrow until delivery is
                  confirmed.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="mb-4 h-12 w-12 text-teal-600" />
                <CardTitle>GPS + photo proof</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Real-time GPS tracking and photo verification ensure delivery.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="mb-4 h-12 w-12 text-teal-600" />
                <CardTitle>$2M insurance available</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Optional comprehensive insurance coverage up to $2 million per
                  delivery.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-12 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold">SpareCarry</h3>
              <p className="text-gray-400">
                SpareCarry – The yacht delivery network for sailors and yachties
              </p>
            </div>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-gray-400 transition-colors hover:text-white"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 transition-colors hover:text-white"
              >
                Terms
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} SpareCarry. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <WaitlistForm
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        travelType={travelType}
      />
    </div>
  );
}
