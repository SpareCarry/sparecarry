"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Bell, X } from "lucide-react";
import { requestNotificationPermission, registerForPushNotifications } from "../../lib/notifications/expo-notifications";
import { createClient } from "../../lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function NotificationPermissionRequest() {
  const [showRequest, setShowRequest] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const supabase = createClient();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-notifications", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("push_notifications_enabled, expo_push_token")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    // Show request if user hasn't enabled notifications
    if (user && profile && !profile.push_notifications_enabled && !profile.expo_push_token) {
      // Check if we've already asked (check localStorage)
      const hasAsked = localStorage.getItem("notification-permission-asked");
      if (!hasAsked) {
        setShowRequest(true);
      }
    }
  }, [user, profile]);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const hasPermission = await requestNotificationPermission();
      
      if (hasPermission) {
        const token = await registerForPushNotifications();
        
        if (token && user) {
          // Save token to database
          await supabase
            .from("profiles")
            .update({
              expo_push_token: token,
              push_notifications_enabled: true,
            })
            .eq("user_id", user.id);

          // Register token with backend
          await fetch("/api/notifications/register-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        }
      }

      localStorage.setItem("notification-permission-asked", "true");
      setShowRequest(false);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    } finally {
      setRequesting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("notification-permission-asked", "true");
    setShowRequest(false);
  };

  if (!showRequest) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 max-w-sm shadow-lg border-teal-200 bg-gradient-to-r from-teal-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <Bell className="h-5 w-5 text-teal-600" />
            </div>
            <CardTitle className="text-lg">Stay in the Loop</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-700">
          <strong>SpareCarry wants to send you matches worth $300+</strong> – allow?
        </p>
        <p className="text-xs text-slate-600">
          Get instant notifications when:
        </p>
        <ul className="text-xs text-slate-600 space-y-1 ml-4 list-disc">
          <li>New matches are found</li>
          <li>Someone messages you</li>
          <li>Your counter-offer is accepted</li>
        </ul>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleAllow}
            disabled={requesting}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            {requesting ? "Enabling..." : "Allow Notifications"}
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1"
          >
            Not Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

