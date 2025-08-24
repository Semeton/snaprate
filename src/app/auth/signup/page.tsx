"use client";

import { useState } from "react";
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
import { CheckCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import PublicNavigation from "@/components/PublicNavigation";

export default function SignUpPage() {
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

        {/* Signup Form */}
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="text-xl">Account Details</CardTitle>
            <CardDescription>
              Fill in your information to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection - Simple Dropdown */}
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger className="apple-input mt-2">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REVIEWER">Reviewer</SelectItem>
                    <SelectItem value="BUSINESS_OWNER">
                      Business Owner
                    </SelectItem>
                    {/* <SelectItem value="AGENT">Agent</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="apple-input mt-2"
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
                    className="apple-input mt-2"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="apple-input mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={formData.referralCode}
                    onChange={(e) =>
                      handleInputChange("referralCode", e.target.value)
                    }
                    className="apple-input mt-2"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid md:grid-cols-2 gap-4">
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
                      className="apple-input pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
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
                      className="apple-input pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleInputChange("state", value)}
                  >
                    <SelectTrigger className="apple-input mt-2">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(State).map((state) => (
                        <SelectItem key={state} value={state}>
                          {state === "FCT"
                            ? "Federal Capital Territory"
                            : state
                                .split("_")
                                .map(
                                  (word) =>
                                    word.charAt(0) +
                                    word.slice(1).toLowerCase(),
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
                    className="apple-input mt-2"
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
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="apple-input mt-2"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="apple-button w-full py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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
      </div>
    </div>
  );
}
