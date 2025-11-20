"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Moon, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../lib/supabase/client";

export function DarkModeToggle() {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Check if user is a supporter
  const { data: user } = useQuery({
    queryKey: ["current-user-theme"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["user-supporter-theme", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("users")
        .select("supporter_status")
        .eq("id", user.id)
        .single();
      return data;
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

