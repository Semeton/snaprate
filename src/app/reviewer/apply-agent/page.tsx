"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  FileText,
  Star,
  MessageSquare,
} from "lucide-react";

interface UserStats {
  totalReviews: number;
  approvedReviews: number;
  averageRating: number;
  isEligible: boolean;
}

export default function ApplyAgentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Application form state
  const [applicationForm, setApplicationForm] = useState({
    motivation: "",
    experience: "",
    businessKnowledge: "",
    commitment: "",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchUserStats();
    }
  }, [session, status]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reviewer/stats");
      if (response.ok) {
        const data = await response.json();
        const userStats = {
          totalReviews: data.data?.totalReviews || 0,
          approvedReviews: data.data?.totalReviews || 0,
          averageRating: data.data?.averageRating || 0,
          isEligible: (data.data?.totalReviews || 0) >= 5,
        };
        setStats(userStats);
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
      setError("Failed to load user statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/reviewer/apply-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationForm),
      });

      if (response.ok) {
        setSuccess(
          "Agent application submitted successfully! We'll review your application and get back to you within 48 hours.",
        );
        setApplicationForm({
          motivation: "",
          experience: "",
          businessKnowledge: "",
          commitment: "",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit application");
      }
    } catch (error) {
      setError("An error occurred while submitting your application");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading eligibility...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  // If user is already an agent, redirect to dashboard
  if (session?.user?.role === "AGENT") {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Shield className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;re already an Agent!
        </h2>
        <p className="text-gray-600 mb-6">
          You have access to all agent features and can recommend businesses.
        </p>
        <Button onClick={() => router.push("/reviewer/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Become an Agent
            </h1>
            <p className="text-gray-600">
              Apply to recommend businesses and earn enhanced rewards
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Application Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Eligibility Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Eligibility Check</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalReviews}
                    </p>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.averageRating?.toFixed(1) || "0.0"}
                    </p>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    {stats.isEligible ? (
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    )}
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.isEligible ? "Eligible" : "Not Eligible"}
                    </p>
                    <p className="text-sm text-gray-600">Status</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading eligibility...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Form */}
          {stats?.isEligible ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Agent Application</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="motivation" className="text-sm font-medium">
                      Why do you want to become an agent? *
                    </Label>
                    <Textarea
                      id="motivation"
                      value={applicationForm.motivation}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({
                          ...prev,
                          motivation: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Explain your motivation for becoming an agent..."
                      required
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience" className="text-sm font-medium">
                      What experience do you have with businesses? *
                    </Label>
                    <Textarea
                      id="experience"
                      value={applicationForm.experience}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({
                          ...prev,
                          experience: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Describe your experience with local businesses..."
                      required
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="businessKnowledge"
                      className="text-sm font-medium"
                    >
                      How would you identify quality businesses? *
                    </Label>
                    <Textarea
                      id="businessKnowledge"
                      value={applicationForm.businessKnowledge}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({
                          ...prev,
                          businessKnowledge: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Explain your approach to identifying good businesses..."
                      required
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="commitment" className="text-sm font-medium">
                      How committed are you to this role? *
                    </Label>
                    <Textarea
                      id="commitment"
                      value={applicationForm.commitment}
                      onChange={(e) =>
                        setApplicationForm((prev) => ({
                          ...prev,
                          commitment: e.target.value,
                        }))
                      }
                      className="mt-1"
                      placeholder="Describe your commitment level and availability..."
                      required
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {submitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-yellow-900 mb-2">
                    Not Yet Eligible
                  </h3>
                  <p className="text-yellow-800 mb-4">
                    You need at least 5 approved reviews to apply to be an
                    agent.
                  </p>
                  <div className="space-y-2 text-sm text-yellow-700">
                    <p>Current reviews: {stats?.totalReviews || 0}</p>
                    <p>Required reviews: 5</p>
                  </div>
                  <Button
                    onClick={() => router.push("/reviewer/submit-review")}
                    className="mt-4 bg-yellow-600 hover:bg-yellow-700"
                  >
                    Write More Reviews
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-blue-700">
                    ₦100 per approved business
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-blue-700">
                    Access to business recommendation tools
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">At least 5 approved reviews</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Good community standing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Active participation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Quality review history</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Process */}
          <Card>
            <CardHeader>
              <CardTitle>Application Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm">Submit your application</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="text-sm">We review within 48 hours</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-sm">Get notified of decision</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <span className="text-sm">Start recommending businesses</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <Alert className="border-red-500 bg-red-50 mt-6">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 mt-6">
          <AlertDescription className="text-green-700 flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
