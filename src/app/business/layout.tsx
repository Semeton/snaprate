"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BusinessSidebar from "@/components/BusinessSidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/types";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Search, Sun, Moon } from "lucide-react";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
      <BusinessLayoutContent>{children}</BusinessLayoutContent>
    </ProtectedRoute>
  );
}

function BusinessLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  // Check if user has a business
  useEffect(() => {
    const checkBusiness = async () => {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        router.push("/auth/signin");
        return;
      }

      try {
        const response = await fetch("/api/business");
        if (response.ok) {
          setHasBusiness(true);
        } else if (response.status === 404) {
          setHasBusiness(false);
          // Redirect to business registration if no business exists
          if (pathname !== "/business/register") {
            router.push("/business/register");
            return;
          }
        }
      } catch (error) {
        console.error("Failed to check business status:", error);
        setHasBusiness(false);
      } finally {
        setLoading(false);
      }
    };

    checkBusiness();
  }, [status, pathname, router]);

  // Show loading state
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading business dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Don't show layout for business registration page
  if (pathname === "/business/register") {
    return <>{children}</>;
  }

  // Don't show layout if user doesn't have a business
  if (!hasBusiness) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <BusinessSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Search className="w-6 h-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              title={`Current theme: ${theme}`}
            >
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : theme === "light" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-600 dark:bg-gray-400 rounded-full"></div>
                </div>
              )}
            </Button>

            {/* Notifications */}
            {/* <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                3
              </Badge>
            </Button> */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
