"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  FileText,
  Star,
  Gift,
  Settings,
  User,
  Shield,
  Menu,
  X,
  LogOut,
  TrendingUp,
  Building2,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface ReviewerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ReviewerSidebar({
  isOpen,
  onToggle,
}: ReviewerSidebarProps) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [platformSettings, setPlatformSettings] = useState({
    minimumBusinessesForAgent: 5,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [lastRoleCheck, setLastRoleCheck] = useState<Date>(new Date());

  // Check if user is an agent
  const isAgent = session?.user?.role === "AGENT";

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchPlatformSettings();

      // Check for role updates every 30 seconds
      const interval = setInterval(() => {
        checkForRoleUpdates();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [session, status]);

  const fetchPlatformSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await fetch("/api/platform-settings");
      if (response.ok) {
        const data = await response.json();
        setPlatformSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch platform settings:", error);
      // Use default value if fetch fails
      setPlatformSettings({ minimumBusinessesForAgent: 5 });
    } finally {
      setLoadingSettings(false);
    }
  };

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
          console.log("Role changed from", currentRole, "to", newRole);
          await update();
          setLastRoleCheck(new Date());

          // Show notification to user
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              if (newRole === "AGENT") {
                new Notification("Agent Status Approved!", {
                  body: "Congratulations! You are now an approved agent.",
                  icon: "/favicon.ico",
                });
              } else if (currentRole === "AGENT" && newRole === "REVIEWER") {
                new Notification("Agent Status Revoked", {
                  body: "Your agent status has been revoked.",
                  icon: "/favicon.ico",
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to check for role updates:", error);
    }
  };

  const handleAgentApplication = () => {
    setShowAgentModal(true);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

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
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {session?.user?.name || "User"}
                </h2>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="default"
                    className={
                      isAgent
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-purple-100 text-purple-800 border-purple-200"
                    }
                  >
                    {isAgent ? (
                      <>
                        <Shield className="h-3 w-3 mr-1" />
                        AGENT
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3 mr-1" />
                        REVIEWER
                      </>
                    )}
                  </Badge>
                  {isAgent && (
                    <span className="text-xs text-green-600">
                      Last updated: {lastRoleCheck.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => router.push("/reviewer/dashboard")}
          >
            <Home className="h-5 w-5 mr-3" />
            Dashboard
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => router.push("/reviewer/reviews")}
          >
            <FileText className="h-5 w-5 mr-3" />
            My Reviews
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => router.push("/reviewer/rewards")}
          >
            <Gift className="h-5 w-5 mr-3" />
            Rewards
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => router.push("/reviewer/profile")}
          >
            <User className="h-5 w-5 mr-3" />
            Profile
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => router.push("/reviewer/settings")}
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Button>

          {/* Agent Application Button (only for reviewers) */}
          {!isAgent && (
            <Button
              variant="outline"
              className="w-full justify-start text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
              onClick={handleAgentApplication}
            >
              <FileText className="h-5 w-5 mr-3" />
              Apply to be Agent
            </Button>
          )}

          {/* Agent Dashboard Button (only for agents) */}
          {isAgent && (
            <Button
              variant="outline"
              className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={() => router.push("/reviewer/agent-dashboard")}
            >
              <Shield className="h-5 w-5 mr-3" />
              Agent Dashboard
            </Button>
          )}

          {/* Sign Out */}
          <div className="pt-6 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </nav>
      </div>

      {/* Agent Application Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Become an Agent
                  </h2>
                  <p className="text-gray-600">
                    Help businesses join our platform and earn rewards
                  </p>
                </div>
              </div>

              {loadingSettings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading requirements...</p>
                </div>
              ) : (
                <>
                  {/* Dynamic Requirement Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      🎯 Current Requirement
                    </h3>
                    <p className="text-blue-800 text-sm">
                      Review at least{" "}
                      <span className="font-bold">
                        {platformSettings.minimumBusinessesForAgent}
                      </span>{" "}
                      different businesses
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-gray-900">
                      Requirements to become an agent:
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>
                          Review at least{" "}
                          <span className="font-medium">
                            {platformSettings?.minimumBusinessesForAgent || 5}
                          </span>{" "}
                          different businesses
                        </span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>Have a verified email and phone number</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>Provide motivation and experience details</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>Demonstrate commitment to the platform</span>
                      </li>
                    </ul>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-xs">
                        <strong>Note:</strong> You must review{" "}
                        <strong>different businesses</strong>, not just multiple
                        reviews for the same business.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
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
                    <p className="text-xs text-gray-500">
                      Progress indicator and requirements are updated in
                      real-time by administrators.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
