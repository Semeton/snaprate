"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  TrendingUp,
  Building2,
  Users,
  Star,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import ReviewerSidebar from "@/components/ReviewerSidebar";

interface AgentStats {
  totalRecommendations: number;
  approvedRecommendations: number;
  pendingRecommendations: number;
  totalEarnings: number;
  averageRating: number;
}

interface BusinessRecommendation {
  id: string;
  businessName: string;
  businessCategory: string;
  businessAddress: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  adminNotes?: string;
}

export default function AgentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [recommendations, setRecommendations] = useState<
    BusinessRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role !== "AGENT") {
        router.push("/reviewer/dashboard");
        return;
      }
      fetchAgentData();
    }
  }, [session, status, router]);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      // Fetch agent stats and recommendations
      const [statsResponse, recommendationsResponse] = await Promise.all([
        fetch("/api/reviewer/agent-stats"),
        fetch("/api/reviewer/business-recommendations"),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch agent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You need to be an approved agent to access this page.
          </p>
          <Button onClick={() => router.push("/reviewer/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReviewerSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="lg:ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Agent Dashboard
                </h1>
                <p className="text-gray-600">
                  Manage business recommendations and track your agent
                  performance
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800 border-green-200"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  AGENT
                </Badge>
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
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Recommendations
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalRecommendations || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Approved
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.approvedRecommendations || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.pendingRecommendations || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Earnings
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{stats?.totalEarnings || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Recommendations */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Recent Business Recommendations</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/reviewer/recommend-business")}
                className="text-green-600 hover:text-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Recommendation
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    No business recommendations yet
                  </p>
                  <Button
                    onClick={() => router.push("/reviewer/recommend-business")}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Recommend Your First Business
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {recommendation.businessName}
                          </h4>
                          <Badge
                            variant="outline"
                            className={getStatusColor(recommendation.status)}
                          >
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(recommendation.status)}
                              <span>{recommendation.status}</span>
                            </div>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Category:</span>{" "}
                            {recommendation.businessCategory}
                          </p>
                          <p>
                            <span className="font-medium">Owner:</span>{" "}
                            {recommendation.ownerName} (
                            {recommendation.ownerEmail})
                          </p>
                          <p>
                            <span className="font-medium">Address:</span>{" "}
                            {recommendation.businessAddress}
                          </p>
                          <p>
                            <span className="font-medium">Submitted:</span>{" "}
                            {new Date(
                              recommendation.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        {recommendation.adminNotes && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
                            <span className="font-medium">Admin Notes:</span>{" "}
                            {recommendation.adminNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
