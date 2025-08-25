"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  Shield,
  BarChart3,
  Building2,
  TrendingUp,
  Settings,
  User,
  Menu,
  X,
  LogOut,
  Plus,
  FileText,
  Users,
} from "lucide-react";

interface AgentSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/agent/dashboard",
    icon: Shield,
    current: false,
    show: true,
  },
  {
    name: "Profile",
    href: "/agent/profile",
    icon: User,
    current: false,
    show: true,
  },
  {
    name: "Onboard Business",
    href: "/agent/onboard",
    icon: Plus,
    current: false,
    show: true,
  },
  {
    name: "My Businesses",
    href: "/agent/businesses",
    icon: Building2,
    current: false,
    show: true,
  },
  {
    name: "Reports",
    href: "/agent/reports",
    icon: FileText,
    current: false,
    show: true,
  },
  {
    name: "Analytics",
    href: "/agent/analytics",
    icon: BarChart3,
    current: false,
    show: true,
  },
  {
    name: "Settings",
    href: "/agent/settings",
    icon: Settings,
    current: false,
    show: true,
  },
];

export default function AgentSidebar({ isOpen, onToggle }: AgentSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Update current state for navigation items
  const updatedNavigation = navigation.map((item) => ({
    ...item,
    current: pathname === item.href,
  }));

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
          fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:left-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 dark:bg-green-700 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  SnapRate
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Agent Portal
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
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <UserAvatar
              user={{
                name: session?.user?.name,
                email: session?.user?.email,
                avatar: session?.user?.avatar,
              }}
              size="lg"
              showName={true}
              showEmail={true}
              showRole={true}
              role="AGENT"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {updatedNavigation
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.name}
                    variant={item.current ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      item.current
                        ? "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:text-white dark:hover:bg-green-700"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:text-red-400"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
