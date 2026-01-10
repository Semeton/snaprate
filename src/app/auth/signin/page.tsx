"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import PublicNavigation from "@/components/PublicNavigation";

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showResendOption, setShowResendOption] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (submitError) setSubmitError("");
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendMessage("Please enter your email address");
      return;
    }

    setIsResending(true);
    setResendMessage("");
    setSubmitError("");

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
        setShowResendOption(false);
      } else {
        setResendMessage(data.error || "Failed to resend verification email");
      }
    } catch (error) {
      setResendMessage("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Use NextAuth signIn instead of custom API
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false, // Don't redirect automatically, we'll handle it
      });

      if (result?.error) {
        // Handle specific error cases
        if (result.error.includes("Email not verified")) {
          setShowResendOption(true);
          setResendEmail(formData.email);
        } else if (result.error.includes("not active")) {
          setSubmitError("Account is not active. Please verify your email.");
        } else {
          setSubmitError("Invalid email or password");
        }
      } else if (result?.ok) {
        // Signin successful, redirect based on user role
        console.log("Signin successful, redirecting...");

        // Get user info from the session
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          const userRole = userData.role;

          let redirectPath = "/dashboard"; // Default path

          switch (userRole) {
            case "REVIEWER":
              redirectPath = "/dashboard";
              break;
            case "BUSINESS_OWNER":
              redirectPath = "/business/dashboard";
              break;
            case "AGENT":
              redirectPath = "/agent/dashboard";
              break;
            case "ADMIN":
            case "SUPER_ADMIN":
              redirectPath = "/admin/dashboard";
              break;
            default:
              redirectPath = "/dashboard";
          }

          console.log("Redirecting to:", redirectPath);
          router.push(redirectPath);
        } else {
          // Fallback redirect
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Navigation */}
      <PublicNavigation />

      <div className="max-w-md mx-auto px-4 pt-24 pb-16">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to your SnapRate account
          </p>
        </div>

        {/* Signin Form */}
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="text-xl">Account Access</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="apple-input mt-2"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="apple-input pr-10"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* Resend Verification Option */}
              {showResendOption && (
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <div className="space-y-3">
                      <p>
                        Your email needs to be verified before you can sign in.
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
                          className="flex-1"
                          required
                          disabled={isResending}
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isResending || !resendEmail.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isResending ? "Sending..." : "Resend Email"}
                        </Button>
                      </form>
                      {resendMessage && (
                        <p
                          className={`text-sm ${
                            resendMessage.includes("successfully")
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {resendMessage}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <a
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="apple-button w-full py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Don&apos;t have an account?{" "}
                  <a
                    href="/auth/signup"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign up here
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
