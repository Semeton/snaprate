"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Home,
  User,
  Settings,
  Gift,
  MessageSquare,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Shield,
  FileText,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ReviewerSidebar({ isOpen, onToggle }: SidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showAgentApplication, setShowAgentApplication] = useState(false);

  // Check if user is an agent
  const isAgent = session?.user?.role === "AGENT";

  const navigation = [
    {
      name: "Dashboard",
      href: "/reviewer/dashboard",
      icon: Home,
      current: pathname === "/reviewer/dashboard",
      show: true, // Always show
    },
    {
      name: "My Reviews",
      href: "/reviewer/reviews",
      icon: MessageSquare,
      current: pathname === "/reviewer/reviews",
      show: true, // Always show
    },
    {
      name: "My Rewards",
      href: "/reviewer/rewards",
      icon: Gift,
      current: pathname === "/reviewer/rewards",
      show: true, // Always show
    },
    {
      name: "Recommend Business",
      href: "/reviewer/recommend-business",
      icon: TrendingUp,
      current: pathname === "/reviewer/recommend-business",
      show: isAgent, // Only show for agents
    },
    {
      name: "Profile",
      href: "/reviewer/profile",
      icon: User,
      current: pathname === "/reviewer/profile",
      show: true, // Always show
    },
    {
      name: "Settings",
      href: "/reviewer/settings",
      icon: Settings,
      current: pathname === "/reviewer/settings",
      show: true, // Always show
    },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleAgentApplication = () => {
    setShowAgentApplication(true);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SnapRate</h1>
                <p className="text-sm text-gray-500">
                  {isAgent ? "Agent Portal" : "Reviewer Portal"}
                </p>
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

          {/* User Profile */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-medium text-lg">
                    {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {session?.user?.email || "user@example.com"}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  {isAgent ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Agent
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Reviewer
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={item.current ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      item.current
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      router.push(item.href);
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Button>
                );
              })}

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
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Agent Application Modal */}
      {showAgentApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-full">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Become an Agent
                </h3>
                <p className="text-sm text-gray-600">
                  Recommend businesses and earn rewards
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">
                  Agent Benefits:
                </h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Recommend new businesses</li>
                  <li>• Earn ₦100 per approved business</li>
                  <li>• Access to business recommendation tools</li>
                  <li>• Enhanced earning potential</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Requirements:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Must be an active reviewer</li>
                  <li>• At least 5 approved reviews</li>
                  <li>• Good standing in the community</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => router.push("/reviewer/apply-agent")}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Apply Now
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAgentApplication(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
