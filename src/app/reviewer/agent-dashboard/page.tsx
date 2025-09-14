"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Star,
  Gift,
  Users,
  Building2,
  ArrowRight,
  Plus,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface AgentStats {
  totalRecommendations: number;
  approvedRecommendations: number;
  pendingRecommendations: number;
  rejectedRecommendations: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  currentStreak: number;
}

interface BusinessRecommendation {
  id: string;
  businessName: string;
  businessCategory: string;
  businessCity: string;
  businessState: string;
  businessAddress: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  businessDescription?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerState?: string;
  additionalNotes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface BusinessRegistration {
  id: string;
  businessName: string;
  businessCategory: string;
  businessCity: string;
  businessState: string;
  businessAddress: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  businessDescription?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerState?: string;
  registrationType: "FULL_REGISTRATION" | "RECOMMENDATION";
  status: "PENDING" | "APPROVED" | "REJECTED" | "VERIFIED";
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AgentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<AgentStats | null>(null);
  const [recommendations, setRecommendations] = useState<
    BusinessRecommendation[]
  >([]);
  const [businessRegistrations, setBusinessRegistrations] = useState<
    BusinessRegistration[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchAgentData();
    }
  }, [session, status]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);

      // Fetch agent stats
      const statsResponse = await fetch("/api/reviewer/agent-stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch business recommendations
      const recommendationsResponse = await fetch(
        "/api/reviewer/business-recommendations",
      );
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.data || []);
      }

      // Fetch business registrations
      const registrationsResponse = await fetch(
        "/api/agent/business-registration?limit=10",
      );
      if (registrationsResponse.ok) {
        const registrationsData = await registrationsResponse.json();
        console.log(
          "Agent dashboard received registrations:",
          registrationsData,
        );
        setBusinessRegistrations(registrationsData.data?.registrations || []);
      }
    } catch (error) {
      console.error("Failed to fetch agent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  // Check if user is an agent
  if (session?.user?.role !== "AGENT") {
    router.push("/reviewer/dashboard");
    return null;
  }

  return (
    <>
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Agent Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track your business recommendations and earnings
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/reviewer/recommend-business")}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Recommend Business
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Business Recommendation Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your business recommendations and track your earnings
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Recommendations
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.totalRecommendations || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Approved
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.approvedRecommendations || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.pendingRecommendations || 0}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats?.totalEarnings || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <Gift className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Recommendations List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Business Recommendations
            </h3>
            <Button
              variant="outline"
              onClick={() => router.push("/reviewer/recommend-business")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Recommendation
            </Button>
          </div>

          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No recommendations yet
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start recommending businesses to earn rewards and help grow
                  the platform
                </p>
                <Button
                  onClick={() => router.push("/reviewer/recommend-business")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Recommend Your First Business
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <Card
                  key={recommendation.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {recommendation.businessName}
                          </h4>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(recommendation.status)}
                          >
                            {recommendation.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Business Details
                            </p>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="font-medium">Category:</span>{" "}
                                {recommendation.businessCategory}
                              </p>
                              <p>
                                <span className="font-medium">Location:</span>{" "}
                                {recommendation.businessCity},{" "}
                                {recommendation.businessState}
                              </p>
                              {recommendation.businessPhone && (
                                <p>
                                  <span className="font-medium">Phone:</span>{" "}
                                  {recommendation.businessPhone}
                                </p>
                              )}
                              {recommendation.businessEmail && (
                                <p>
                                  <span className="font-medium">Email:</span>{" "}
                                  {recommendation.businessEmail}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Owner Details
                            </p>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="font-medium">Name:</span>{" "}
                                {recommendation.ownerName}
                              </p>
                              <p>
                                <span className="font-medium">Phone:</span>{" "}
                                {recommendation.ownerPhone}
                              </p>
                              <p>
                                <span className="font-medium">Email:</span>{" "}
                                {recommendation.ownerEmail}
                              </p>
                            </div>
                          </div>
                        </div>

                        {recommendation.businessDescription && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Description
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {recommendation.businessDescription}
                            </p>
                          </div>
                        )}

                        {recommendation.additionalNotes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Additional Notes
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {recommendation.additionalNotes}
                            </p>
                          </div>
                        )}

                        {recommendation.adminNotes && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              Admin Notes
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded">
                              {recommendation.adminNotes}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            Submitted: {formatDate(recommendation.createdAt)}
                          </span>
                          {recommendation.reviewedAt && (
                            <span>
                              Reviewed: {formatDate(recommendation.reviewedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        {getStatusIcon(recommendation.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Business Registrations List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Business Registrations
            </h3>
            <Button
              variant="outline"
              onClick={() => router.push("/reviewer/recommend-business")}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Registration
            </Button>
          </div>

          {businessRegistrations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No registrations yet
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start registering businesses with full verification documents
                  for faster approval
                </p>
                <Button
                  onClick={() => router.push("/reviewer/recommend-business")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Register Your First Business
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {businessRegistrations.map((registration) => (
                <Card
                  key={registration.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                            {registration.businessName}
                          </h4>
                          <Badge
                            className={`${getStatusColor(
                              registration.status,
                            )} border`}
                          >
                            {registration.status}
                          </Badge>
                          {registration.registrationType && (
                            <Badge variant="outline">
                              {registration.registrationType ===
                              "FULL_REGISTRATION"
                                ? "Full Registration"
                                : "Recommendation"}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Category:</strong>{" "}
                              {registration.businessCategory}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Location:</strong>{" "}
                              {registration.businessCity},{" "}
                              {registration.businessState}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Phone:</strong>{" "}
                              {registration.businessPhone || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Email:</strong>{" "}
                              {registration.businessEmail || "N/A"}
                            </p>
                          </div>
                        </div>

                        {registration.businessDescription && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <strong>Description:</strong>{" "}
                            {registration.businessDescription}
                          </p>
                        )}

                        {registration.ownerName && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Owner:</strong> {registration.ownerName}
                            </p>
                            {registration.ownerPhone && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Owner Phone:</strong>{" "}
                                {registration.ownerPhone}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            Submitted: {formatDate(registration.createdAt)}
                          </span>
                          {registration.reviewedAt && (
                            <span>
                              Reviewed: {formatDate(registration.reviewedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        {getStatusIcon(registration.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
