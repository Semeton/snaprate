"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";

export default function VerifyEmailForm() {
  const [emailCode, setEmailCode] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Auto-verify email if token is present in URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (
      token &&
      !success &&
      !error &&
      !autoVerifying &&
      !verificationAttempted
    ) {
      setAutoVerifying(true);
      setVerificationAttempted(true);
      handleEmailVerification(undefined, token);
    }
  }, [searchParams]); // Remove success and error from dependencies to prevent re-runs

  // Auto-login and redirect after successful verification
  useEffect(() => {
    if (success && !isAutoLoggingIn) {
      handleAutoLogin();
    }
  }, [success]);

  const handleAutoLogin = async () => {
    if (isAutoLoggingIn) return;

    setIsAutoLoggingIn(true);

    try {
      // Wait a moment for the user to see the success message
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect to appropriate dashboard based on user role
      const userRole = session?.user?.role;

      if (userRole === "BUSINESS_OWNER") {
        router.push("/business/dashboard");
      } else if (userRole === "AGENT") {
        router.push("/agent/dashboard");
      } else if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        // Default to reviewer dashboard
        router.push("/reviewer/dashboard");
      }
    } catch (error) {
      console.error("Auto-login redirect failed:", error);
      // Fallback to main dashboard
      router.push("/dashboard");
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  const handleEmailVerification = async (
    e?: React.FormEvent,
    token?: string,
  ) => {
    if (e) e.preventDefault();

    const verificationToken = token || emailCode;
    if (!verificationToken) {
      setError("Please enter a verification code");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          "Email verified successfully! Your account is now active. Redirecting to dashboard...",
        );
        setEmailCode("");

        // Clear the token from URL
        if (token) {
          router.replace("/auth/verify");
        }

        // Store the token in localStorage for automatic login
        if (data.token) {
          localStorage.setItem("verificationToken", data.token);
        }
      } else {
        const errorMessage = data.error || "Email verification failed";

        // Handle specific error cases
        if (errorMessage.includes("Invalid or expired")) {
          // This usually means the token was already used or expired
          // Check if the user might already be verified
          setError(
            "This verification link has already been used or has expired. If you can sign in successfully, your email is already verified. Otherwise, please request a new verification email.",
          );
        } else if (errorMessage.includes("already verified")) {
          setSuccess("Your email is already verified! You can now sign in.");
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setAutoVerifying(false);
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendMessage("Please enter your email address");
      return;
    }

    setIsResending(true);
    setResendMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage(
          "Verification email resent successfully! Please check your inbox.",
        );
        setResendEmail("");
      } else {
        setResendMessage(data.error || "Failed to resend verification email");
      }
    } catch (error) {
      setResendMessage("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
        <div className="w-full max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>

          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Verify Your Account
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Please verify your email to activate your account
              </CardDescription>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                💡 If verification fails, try signing in first - your email
                might already be verified!
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {autoVerifying && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Verifying your email automatically... Please wait.
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {success}
                    {isAutoLoggingIn && (
                      <div className="mt-2 text-sm">
                        <div className="animate-pulse">
                          🔄 Redirecting to your dashboard...
                        </div>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Resend Verification Email */}
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Didn&apos;t Receive Verification Email?
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your email address below to resend the verification
                  email.
                </p>
                <form
                  onSubmit={handleResendVerification}
                  className="flex space-x-2"
                >
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="flex-1 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isResending || !resendEmail.trim()}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {isResending ? "Sending..." : "Resend Email"}
                  </Button>
                </form>
                {resendMessage && (
                  <Alert
                    className={
                      resendMessage.includes("successfully")
                        ? "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
                        : "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                    }
                  >
                    <AlertDescription
                      className={
                        resendMessage.includes("successfully")
                          ? "text-green-800 dark:text-green-200"
                          : "text-red-800 dark:text-red-200"
                      }
                    >
                      {resendMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Email Verification */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Email Verification
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {autoVerifying
                    ? "Verifying your email automatically from the link..."
                    : "Check your email for a verification code and enter it below, or click the verification link in your email."}
                </p>
                <form
                  onSubmit={handleEmailVerification}
                  className="flex space-x-2"
                >
                  <Input
                    type="text"
                    placeholder="Enter email verification code"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className="flex-1 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    required
                    disabled={autoVerifying}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !emailCode || autoVerifying}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? "Verifying..." : "Verify Email"}
                  </Button>
                </form>
              </div>

              {/* Manual Continue Button (fallback) */}
              {success && !isAutoLoggingIn && (
                <div className="pt-4">
                  <Button
                    onClick={handleAutoLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Continue to Dashboard
                  </Button>
                </div>
              )}

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Need help?{" "}
                <Link
                  href="/support"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Contact Support
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
