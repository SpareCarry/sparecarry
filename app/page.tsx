"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { WaitlistForm } from "../components/waitlist-form";
import { createClient } from "../lib/supabase/client";
import {
  Plane,
  Ship,
  Package,
  DollarSign,
  Shield,
  CreditCard,
  MapPin,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [travelType, setTravelType] = useState<"plane" | "boat" | undefined>();
  const [loading, setLoading] = useState(false);

  const handleTravelClick = async (type: "plane" | "boat") => {
    console.log("Button clicked:", type);
    setLoading(true);
    setTravelType(type);
    
    try {
      console.log("Checking authentication...");
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("Auth check result:", { user: user?.email, error: authError });

      if (user) {
        // User is authenticated - navigate to browse page
        console.log("User authenticated, navigating to /home");
        router.push("/home");
      } else {
        // User is not authenticated - navigate to login with redirect
        console.log("User not authenticated, navigating to login");
        router.push(`/auth/login?redirect=/home`);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      // Fallback to login
      router.push(`/auth/login?redirect=/home`);
    } finally {
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
        className="relative min-h-screen flex items-center justify-center px-4 py-20"
        style={{
          background: 'linear-gradient(to bottom, rgb(186 230 253), rgb(94 234 212), rgb(59 130 246), rgb(30 58 138))'
        }}
      >
        <div className="container mx-auto max-w-6xl text-center z-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            SpareCarry – Earn $200–$3,000 using spare space you already have
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            Get anything delivered by people already going your way — by plane in days or by boat for 80% less.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => handleTravelClick("plane")}
              disabled={loading}
              className="w-full sm:w-auto text-lg px-8 py-6 bg-teal-600 hover:bg-teal-700 text-white text-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              ✈ I&apos;m traveling by Plane
            </Button>
            <Button
              onClick={() => handleTravelClick("boat")}
              disabled={loading}
              className="w-full sm:w-auto text-lg px-8 py-6 bg-slate-900 hover:bg-slate-800 text-white text-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              ⚓ I&apos;m sailing by Boat
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Package className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>1. Post your need or trip</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Travelers post their routes. Requesters post what they need delivered.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>2. Match instantly</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our platform automatically matches travelers with requesters on the same route.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-12 w-12 text-teal-600 mb-4" />
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
                <Ship className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>4. Deliver & get paid</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Traveler delivers, requester confirms, payment is released.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Real Examples Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
            Real examples
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-teal-50">
              <CardHeader>
                <Plane className="h-10 w-10 text-teal-600 mb-4" />
                <CardTitle className="text-2xl">
                  Fly Miami → St Martin, carry 20 kg → earn $450
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  A traveler flying from Miami to St. Martin can easily carry 20kg of electronics
                  and earn $450—more than covering their checked bag fee.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-50 to-blue-50">
              <CardHeader>
                <Ship className="h-10 w-10 text-slate-900 mb-4" />
                <CardTitle className="text-2xl">
                  Sail Panama → Tahiti, carry outboard → earn $1,800
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  A sailor heading from Panama to Tahiti can transport an outboard motor and earn
                  $1,800—significant income for a long passage.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-50 to-green-50">
              <CardHeader>
                <Package className="h-10 w-10 text-teal-600 mb-4" />
                <CardTitle className="text-2xl">
                  Get a 200Ah battery to Grenada for $250 instead of $2,200 shipping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  A requester needs a marine battery in Grenada. Instead of paying $2,200 for
                  shipping and customs, they pay $250 to a traveler already going there.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
            Trust & Safety
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <FileCheck className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>Passport/ID verified</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All travelers and requesters verify their identity with government-issued ID.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>Escrow via Stripe</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Payments are securely held in escrow until delivery is confirmed.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-12 w-12 text-teal-600 mb-4" />
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
                <Shield className="h-12 w-12 text-teal-600 mb-4" />
                <CardTitle>$2M insurance available</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Optional comprehensive insurance coverage up to $2 million per delivery.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold">SpareCarry</h3>
              <p className="text-gray-400">SpareCarry – The traveler & sailor courier app</p>
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} SpareCarry. All rights reserved.</p>
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

