"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
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

    // Check if user is a reviewer or agent
    if (
      session?.user?.role &&
      !["REVIEWER", "AGENT"].includes(session.user.role)
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
          <p className="text-gray-600">Loading reviewer portal...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      {children}
      {/* Floating theme toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
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
    </>
  );
}
