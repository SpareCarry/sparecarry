"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import {
  Search,
  PlusCircle,
  Plane,
  Package,
  User,
  Menu,
  X,
  Home,
  Calculator,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { MessageBadge } from "../messaging/MessageBadge";
import { useUser } from "../../hooks/useUser";

const navigation = [
  { name: "Browse", href: "/home", icon: Search },
  { name: "Post Request", href: "/home/post-request", icon: PlusCircle },
  { name: "Post Trip", href: "/home/post-trip", icon: Plane },
  { name: "Shipping Estimator", href: "/shipping-estimator", icon: Calculator },
  { name: "My Stuff", href: "/home/my-stuff", icon: Package },
  { name: "Profile", href: "/home/profile", icon: User },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();
  
  // Use shared hook to prevent duplicate queries
  const { user: currentUser } = useUser();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:bg-slate-900">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/home" className="text-2xl font-bold text-white">
              SpareCarry
            </Link>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-teal-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
            {/* Message Badge in Desktop Sidebar */}
            {currentUser?.id && (
              <div className="px-3 py-2">
                <MessageBadge userId={currentUser.id} />
              </div>
            )}
          </nav>
          <div className="px-4 pb-4">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 z-[55]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
                <span className="text-xl font-bold text-white">SpareCarry</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close navigation menu"
                  className="text-slate-300"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => {
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-teal-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                        )}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-4 pb-4">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full text-slate-300 border-slate-700 hover:bg-slate-800"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/home" className="text-xl font-bold text-slate-900">
              SpareCarry
            </Link>
            {currentUser?.id ? (
              <MessageBadge userId={currentUser.id} />
            ) : (
              <div className="w-10" /> // Spacer
            )}
          </div>
        </div>

        {/* Page Content */}
        <main className="pb-20 lg:pb-0">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
          <div className="flex items-center justify-around px-2 py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors",
                    isActive ? "text-teal-600" : "text-slate-500"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-teal-600")} />
                  <span className="text-xs mt-1 font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

