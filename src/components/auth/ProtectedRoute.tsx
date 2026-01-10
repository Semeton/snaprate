"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/auth/signin",
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    // Check if user has required role
    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      // Redirect to appropriate dashboard based on user role
      switch (session.user.role) {
        case "REVIEWER":
          router.push("/dashboard");
          break;
        case "BUSINESS_OWNER":
          router.push("/business/dashboard");
          break;
        case "AGENT":
          router.push("/agent/dashboard");
          break;
        case "ADMIN":
        case "SUPER_ADMIN":
          router.push("/admin/dashboard");
          break;
        default:
          router.push("/dashboard");
      }
      return;
    }
  }, [session, status, router, allowedRoles, redirectTo]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Check if user has required role
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
