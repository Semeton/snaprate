"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  Settings,
  Mail,
  LogOut,
  Crown,
  UserCheck,
  MessageSquare,
  Sun,
  Moon,
} from "lucide-react";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
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

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/admin/dashboard",
    },
    {
      name: "Invitations",
      href: "/admin/invitations",
      icon: Mail,
      current: pathname === "/admin/invitations",
      superAdminOnly: true,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      current: pathname === "/admin/users",
    },
    {
      name: "Businesses",
      href: "/admin/businesses",
      icon: Building2,
      current: pathname === "/admin/businesses",
    },
    {
      name: "Business Recommendations",
      href: "/admin/business-recommendations",
      icon: Building2,
      current: pathname === "/admin/business-recommendations",
    },
    {
      name: "Verification",
      href: "/admin/verification",
      icon: Shield,
      current: pathname === "/admin/verification",
    },
    {
      name: "Agents",
      href: "/admin/agents",
      icon: Shield,
      current: pathname === "/admin/agents",
    },
    // {
    //   name: "Moderation",
    //   href: "/admin/moderation",
    //   icon: Shield,
    //   current: pathname === "/admin/moderation",
    //   superAdminOnly: true,
    // },
    {
      name: "Reviews",
      href: "/admin/reviews",
      icon: MessageSquare,
      current: pathname === "/admin/reviews",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: pathname === "/admin/settings",
    },
  ];

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full w-72">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Crown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Admin
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  SnapRate
                </p>
              </div>
            </div>
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
              role={isSuperAdmin ? "SUPER_ADMIN" : "ADMIN"}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              // Skip items that are super admin only if user is not super admin
              if (item.superAdminOnly && !isSuperAdmin) {
                return null;
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  onClick={onClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
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
    </>
  );
}
