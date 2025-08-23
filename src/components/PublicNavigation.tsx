"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/user-avatar";
import { Star, LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useState } from "react";

export default function PublicNavigation() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Star className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              SnapRate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#how-it-works"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="/businesses"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Businesses
            </Link>
            <Link
              href="#testimonials"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Testimonials
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
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

            {/* User Actions */}
            {status === "loading" ? (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            ) : session?.user ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2">
                  <Avatar
                    user={{
                      name: session.user.name,
                      avatar: session.user.avatar,
                    }}
                    size="sm"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {session.user.name}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {session.user.role}
                    </Badge>
                  </div>
                </div>

                {/* Dashboard/Profile Links */}
                {session.user.role === "REVIEWER" && (
                  <Link href="/reviewer/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                )}
                {session.user.role === "BUSINESS_OWNER" && (
                  <Link href="/business/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                )}
                {["ADMIN", "SUPER_ADMIN"].includes(session.user.role) && (
                  <Link href="/admin/dashboard">
                    <Button variant="outline" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}

                {/* Sign Out */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin">
                  <Button
                    variant="ghost"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="#how-it-works"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link
                href="/businesses"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Businesses
              </Link>
              <Link
                href="#testimonials"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </Link>

              {session?.user && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar
                      user={{
                        name: session.user.name,
                        avatar: session.user.avatar,
                      }}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {session.user.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {session.user.role}
                      </Badge>
                    </div>
                  </div>

                  {session.user.role === "REVIEWER" && (
                    <Link href="/reviewer/dashboard" className="block mb-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  {session.user.role === "BUSINESS_OWNER" && (
                    <Link href="/business/dashboard" className="block mb-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  {["ADMIN", "SUPER_ADMIN"].includes(session.user.role) && (
                    <Link href="/admin/dashboard" className="block mb-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Admin
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
