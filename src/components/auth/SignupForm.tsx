"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { State } from "@/types";
import {
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Gift,
  Users,
} from "lucide-react";
import Link from "next/link";

// Define state options outside component to avoid build-time issues
const STATE_OPTIONS = Object.values(State);

export default function SignupForm() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
    referralCode: "",
    state: "",
    city: "",
    address: "",
  });

  // Check for referral code in URL on component mount
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setFormData((prev) => ({
        ...prev,
        referralCode: refCode,
      }));
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear any previous errors when user starts typing
    if (submitError) setSubmitError("");
  };

  const validateForm = () => {
    if (!formData.role) {
      setSubmitError("Please select a role");
      return false;
    }
    if (!formData.name.trim()) {
      setSubmitError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setSubmitError("Email is required");
      return false;
    }
    if (!formData.phone.trim()) {
      setSubmitError("Phone number is required");
      return false;
    }
    if (!formData.password) {
      setSubmitError("Password is required");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setSubmitError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setSubmitError("Password must be at least 6 characters");
      return false;
    }
    if (!formData.state) {
      setSubmitError("State is required");
      return false;
    }
    if (!formData.city.trim()) {
      setSubmitError("City is required");
      return false;
    }
    if (!formData.address.trim()) {
      setSubmitError("Address is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role: formData.role,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitSuccess(
          "Account created successfully! Please check your email and phone for verification.",
        );
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          role: "",
          referralCode: "",
          state: "",
          city: "",
          address: "",
        });
      } else {
        setSubmitError(result.error || "Failed to create account");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if referral code is from URL
  const isReferralFromUrl = searchParams.get("ref") === formData.referralCode;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Create Your Account
        </CardTitle>
        <CardDescription>
          Join SnapRate and start earning rewards today
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Referral Banner */}
        {isReferralFromUrl && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Gift className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  🎉 You were invited by a friend!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Using referral code:{" "}
                  <span className="font-mono font-medium bg-green-100 px-2 py-1 rounded">
                    {formData.referralCode}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
              I want to join as *
            </Label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                {
                  value: "REVIEWER",
                  label: "Reviewer",
                  description: "Review businesses & earn rewards",
                  icon: <Users className="w-5 h-5" />,
                },
                {
                  value: "BUSINESS_OWNER",
                  label: "Business Owner",
                  description: "List your business for reviews",
                  icon: <LinkIcon className="w-5 h-5" />,
                },
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleInputChange("role", role.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                    formData.role === role.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className={`p-2 rounded ${
                        formData.role === role.value
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {role.icon}
                    </div>
                    <span className="font-medium">{role.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {role.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="referralCode">Referral Code</Label>
              <Input
                id="referralCode"
                type="text"
                placeholder="Enter referral code (optional)"
                value={formData.referralCode}
                onChange={(e) =>
                  handleInputChange("referralCode", e.target.value)
                }
                className="mt-2"
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative mt-2">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleInputChange("state", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {STATE_OPTIONS.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state === "FCT"
                        ? "Federal Capital Territory"
                        : state
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0) + word.slice(1).toLowerCase(),
                            )
                            .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                type="text"
                placeholder="Enter your city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter your address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            disabled={!formData.role || isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Alerts */}
          {submitError && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          {submitSuccess && (
            <Alert className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {submitSuccess}
              </AlertDescription>
              <div className="mt-3">
                <Link
                  href="/auth/verify"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Go to Verification Page
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </Alert>
          )}

          {/* Sign In Link */}
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Already have an account?{" "}
            <a
              href="/auth/signin"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in here
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
