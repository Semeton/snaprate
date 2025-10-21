"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/auth/signin");
      return;
    }

    // Redirect based on user role
    const role = session.user.role;
    switch (role) {
      case "REVIEWER":
      case "AGENT":
        router.push("/reviewer/dashboard");
        break;
      case "BUSINESS_OWNER":
        router.push("/business/dashboard");
        break;
      case "ADMIN":
      case "SUPER_ADMIN":
        router.push("/admin/dashboard");
        break;
      default:
        // Fallback for unknown roles
        router.push("/reviewer/dashboard");
        break;
    }
  }, [session, status, router]);

  // Show minimal loading state while redirecting
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // This should never render as the redirect happens in useEffect
  return null;
}
