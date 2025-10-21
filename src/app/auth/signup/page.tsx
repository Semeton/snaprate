import { Suspense } from "react";
import PublicNavigation from "@/components/PublicNavigation";
import SignupForm from "@/components/auth/SignupForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Navigation */}
      <PublicNavigation />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Create Your Account</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join SnapRate and start earning rewards today
          </p>
        </div>

        {/* Signup Form Component with Suspense */}
        <Suspense
          fallback={
            <div className="text-center py-8">Loading signup form...</div>
          }
        >
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
