"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  Home,
  FileText,
  Gift,
  Settings,
  User,
  Shield,
  Sun,
  Moon,
  LogOut,
  Ticket,
  Building2,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface ReviewerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewerSidebar({
  isOpen,
  onClose,
}: ReviewerSidebarProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [showAgentModal, setShowAgentModal] = useState(false);

  // Check if user is an agent
  const isAgent = session?.user?.role === "AGENT";
  const isReviewer = session?.user?.role === "REVIEWER";

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const checkForRoleUpdates = async () => {
        try {
          const response = await fetch("/api/auth/refresh-session", {
            method: "POST",
          });

          if (response.ok) {
            const data = await response.json();
            const currentRole = session?.user?.role;
            const newRole = data.data.user.role;

            // If role has changed, update the session
            if (currentRole !== newRole) {
              await update();

              // Show notification to user
              if (typeof window !== "undefined" && "Notification" in window) {
                if (Notification.permission === "granted") {
                  if (newRole === "AGENT") {
                    new Notification("Agent Status Approved!", {
                      body: "Congratulations! You are now an approved agent.",
                      icon: "/favicon.ico",
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Failed to check for role updates", error);
        }
      };

      // Check for role updates every 30 seconds
      const interval = setInterval(() => {
        checkForRoleUpdates();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [session, status, update]);

  const handleAgentApplication = () => {
    setShowAgentModal(true);
  };

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/reviewer/dashboard",
      icon: Home,
      current: pathname === "/reviewer/dashboard",
    },
    ...(isAgent
      ? [
          {
            name: "Agent Dashboard",
            href: "/reviewer/agent-dashboard",
            icon: Shield,
            current: pathname === "/reviewer/agent-dashboard",
          },
        ]
      : []),
    ...(isReviewer
      ? [
          {
            name: "Business Registration",
            href: "/reviewer/agent/business-registration",
            icon: Building2,
            current: pathname === "/reviewer/agent/business-registration",
          },
        ]
      : []),
    {
      name: "My Reviews",
      href: "/reviewer/reviews",
      icon: FileText,
      current: pathname === "/reviewer/reviews",
    },
    {
      name: "Browse Businesses",
      href: "/reviewer/businesses",
      icon: Building2,
      current: pathname === "/reviewer/businesses",
    },
    {
      name: "My Coupons",
      href: "/reviewer/coupons",
      icon: Ticket,
      current: pathname === "/reviewer/coupons",
    },
    {
      name: "Rewards",
      href: "/reviewer/rewards",
      icon: Gift,
      current: pathname === "/reviewer/rewards",
    },
    {
      name: "Profile",
      href: "/reviewer/profile",
      icon: User,
      current: pathname === "/reviewer/profile",
    },
    {
      name: "Settings",
      href: "/reviewer/settings",
      icon: Settings,
      current: pathname === "/reviewer/settings",
    },
  ];

  if (status === "loading") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`lg:flex lg:flex-col lg:h-full lg:w-72 lg:bg-white lg:dark:bg-gray-800 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 lg:static lg:inset-auto lg:z-auto fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:transform-none lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full w-72">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Link
              href="/"
              className="flex items-center space-x-3 cursor-pointer"
            >
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Reviewer
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  SnapRate
                </p>
              </div>
            </Link>
            <div className="flex items-center space-x-2">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden"
              >
                ×
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <UserAvatar
              user={{
                name: session?.user?.name,
                email: session?.user?.email,
                avatar: session?.user?.avatar,
              }}
              size="md"
              showName={true}
              showEmail={true}
              showRole={true}
              role={isAgent ? "AGENT" : "REVIEWER"}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                }`}
                onClick={onClose}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}

            {/* Agent Application Button (only for reviewers) */}
            {!isAgent && (
              <Button
                variant="outline"
                className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20 dark:border-purple-800"
                onClick={handleAgentApplication}
              >
                <FileText className="h-5 w-5 mr-3" />
                Apply to be Agent
              </Button>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Agent Application Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Become an Agent
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Help businesses join our platform and earn rewards
                  </p>
                </div>
              </div>

              {/* Dynamic Requirement Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  🎯 Current Requirement
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Register at least <span className="font-bold">2</span>{" "}
                  verified businesses
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Requirements to become an agent:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>
                      Verify your ID (Voter card, National ID, Passport, or
                      Driving license)
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>
                      Register at least <span className="font-medium">2</span>{" "}
                      verified businesses
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Answer required application questions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>Auto-approval after 2 verified businesses</span>
                  </li>
                </ul>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-blue-800 dark:text-blue-200 text-xs">
                    <strong>Note:</strong> You must register{" "}
                    <strong>verified businesses</strong> with full verification
                    documents. Start earning from the 3rd registered business
                    onwards.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                  onClick={() => {
                    setShowAgentModal(false);
                    router.push("/reviewer/apply-agent");
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Start Application
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAgentModal(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Progress indicator and requirements are updated in real-time
                  by administrators.
                </p>
              </div>
              {/* Dynamic Requirement Summary */}
              {/* <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  🎯 Current Requirement
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Register at least <span className="font-bold">2</span>{" "}
                  verified businesses
                </p>
              </div> */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
