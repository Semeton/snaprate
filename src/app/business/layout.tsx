"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/types";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  Building2,
  BarChart3,
  Gift,
  Star,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Search,
  Sun,
  Moon,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/business/dashboard",
    icon: Building2,
    description: "Overview and key metrics",
  },
  {
    name: "Profile",
    href: "/business/profile",
    icon: User,
    description: "Manage business information",
  },
  {
    name: "Coupons",
    href: "/business/coupons",
    icon: Gift,
    description: "Create and manage offers",
  },
  {
    name: "Reviews",
    href: "/business/reviews",
    icon: Star,
    description: "Customer feedback management",
  },
  {
    name: "Analytics",
    href: "/business/analytics",
    icon: BarChart3,
    description: "Detailed insights and reports",
  },
  {
    name: "Settings",
    href: "/business/settings",
    icon: Settings,
    description: "Account preferences and security",
  },
];

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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                SnapRate
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                SnapRate
              </span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
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

            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                3
              </Badge>
            </Button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {session?.user?.name?.charAt(0) || "B"}
                </span>
              </div>
              <div className="hidden lg:block">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {session?.user?.name || "Business Owner"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Business Owner
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">{children}</main>
      </div>
    </div>
  );
}
