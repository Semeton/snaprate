"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/AdminSidebar";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Check if user is admin or super admin
    if (
      session?.user?.role &&
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      router.push("/");
      return;
    }

    setIsLoading(false);
  }, [session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            Admin
          </div>
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
        </div>
      </div>

      <div className="flex">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
