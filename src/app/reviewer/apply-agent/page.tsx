"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  FileText,
  Star,
  MessageSquare,
  Building2,
} from "lucide-react";
import ReviewerSidebar from "@/components/ReviewerSidebar";

interface UserStats {
  totalReviews: number;
  approvedReviews: number;
  averageRating: number;
  uniqueBusinessesReviewed: number;
  isEligible: boolean;
  requiredBusinesses: number;
}

export default function ApplyAgentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
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

        // Fetch platform settings for the required number
        const settingsResponse = await fetch("/api/platform-settings");
        const settings = settingsResponse.ok
          ? await settingsResponse.json()
          : { data: { minimumBusinessesForAgent: 5 } };
        const requiredBusinesses =
          settings.data?.minimumBusinessesForAgent || 5;

        const userStats = {
          totalReviews: data.data?.totalReviews || 0,
          approvedReviews: data.data?.totalReviews || 0,
          averageRating: data.data?.averageRating || 0,
          uniqueBusinessesReviewed: data.data?.uniqueBusinessesReviewed || 0,
          isEligible:
            (data.data?.uniqueBusinessesReviewed || 0) >= requiredBusinesses,
          requiredBusinesses,
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
      console.error("Error submitting application:", error);
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
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  // Check if user is already an agent
  if (session?.user?.role === "AGENT") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Shield className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            You&apos;re Already an Agent!
          </h2>
          <p className="text-gray-600 mb-6">
            You already have agent privileges and can recommend businesses.
          </p>
          <Button onClick={() => router.push("/reviewer/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ReviewerSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              Apply to be Agent
            </h1>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Application Content */}
        <div className="flex-1 p-6">
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
                        <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.uniqueBusinessesReviewed}/
                          {stats.requiredBusinesses}
                        </p>
                        <p className="text-sm text-gray-600">
                          Unique Businesses
                        </p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.averageRating?.toFixed(1) || "0.0"}
                        </p>
                        <p className="text-sm text-gray-600">Average Rating</p>
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
                        <Label
                          htmlFor="motivation"
                          className="text-sm font-medium"
                        >
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
                          placeholder="Tell us about your motivation to help businesses grow..."
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="experience"
                          className="text-sm font-medium"
                        >
                          What experience do you have with local businesses? *
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
                          placeholder="Share your experience with local businesses, markets, or industries..."
                          rows={4}
                          required
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="businessKnowledge"
                          className="text-sm font-medium"
                        >
                          What industries or business types are you most
                          familiar with? *
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
                          placeholder="e.g., Restaurants, Retail, Services, Technology, etc."
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="commitment"
                          className="text-sm font-medium"
                        >
                          How committed are you to helping businesses succeed? *
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
                          placeholder="Describe your commitment level and how you plan to contribute..."
                          rows={3}
                          required
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
                        Not Eligible Yet
                      </h3>
                      <p className="text-yellow-800 mb-4">
                        You need to review at least{" "}
                        {stats?.requiredBusinesses || 5} different businesses to
                        apply to become an agent.
                      </p>
                      <div className="space-y-2 text-sm text-yellow-700">
                        <p>
                          Current unique businesses reviewed:{" "}
                          {stats?.uniqueBusinessesReviewed || 0}/
                          {stats?.requiredBusinesses || 5}
                        </p>
                        <p>
                          Keep reviewing different businesses to become
                          eligible!
                        </p>
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
              {/* Agent Benefits */}
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">
                    Agent Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Shield className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-900">
                          Business Recommendations
                        </p>
                        <p className="text-sm text-purple-700">
                          Recommend new businesses to the platform
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <span className="text-green-600 font-bold">₦</span>
                      </div>
                      <div>
                        <p className="font-medium text-green-900">
                          Enhanced Rewards
                        </p>
                        <p className="text-sm text-green-700">
                          Earn ₦100 per approved business recommendation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">
                          Special Tools
                        </p>
                        <p className="text-sm text-blue-700">
                          Access to business recommendation tools
                        </p>
                      </div>
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
                      <span className="text-sm">
                        Review at least {stats?.requiredBusinesses || 5}{" "}
                        different businesses
                      </span>
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
                      <span className="text-sm">
                        Start recommending businesses
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <Alert className="border-red-500 bg-red-50 mt-6">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
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
      </div>
    </div>
  );
}
