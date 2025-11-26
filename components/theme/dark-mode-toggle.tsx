"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Moon, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useUser } from "../../hooks/useUser";

type SupporterThemeStatus = {
  supporter_status?: "active" | "inactive" | null;
};

export function DarkModeToggle() {
  const supabase = createClient() as SupabaseClient;
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Use shared hook to prevent duplicate queries
  const { user } = useUser();

  const { data: userData } = useQuery<SupporterThemeStatus | null>({
    queryKey: ["user-supporter-theme", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("supporter_status")
        .eq("id", user.id)
        .single();
      return (data ?? null) as SupporterThemeStatus | null;
    },
    enabled: !!user,
  });

  const isSupporter = userData?.supporter_status === "active";

  useEffect(() => {
    setMounted(true);
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (!isSupporter) {
      // Show message that this is supporter-only
      alert("Dark mode is an exclusive feature for Supporters. Become a Supporter to unlock this and more!");
      return;
    }

    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      title={isSupporter ? "Toggle dark mode" : "Dark mode (Supporter only)"}
      className={!isSupporter ? "opacity-50" : ""}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

