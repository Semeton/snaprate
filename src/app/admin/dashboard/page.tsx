"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  MessageSquare,
  Shield,
  Clock,
  AlertCircle,
  Crown,
  UserCheck,
} from "lucide-react";

interface AdminDashboardData {
  overview: {
    totalUsers: number;
    userBreakdown: {
      reviewers: number;
      businessOwners: number;
      agents: number;
      admins: number;
      superAdmins: number;
    };
    totalBusinesses: number;
    totalReviews: number;
    totalAgents: number;
    averageBusinessRating: number;
    averageReviewRating: number;
  };
  pending: {
    businesses: number;
    agentApplications: number;
    adminInvitations: number;
  };
  recent: {
    adminActions: {
      action: string;
      admin: { name: string };
      createdAt: string;
      targetType: string;
    }[];
    adminActionsPagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    pendingBusinesses: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      country: string;
      createdAt: string;
      updatedAt: string;
    }[];
    pendingAgents: {
      id: string;
      name: string;
      email: string;
      phone: string;
      city: string;
      state: string;
      country: string;
      createdAt: string;
      updatedAt: string;
    }[];
  };
  platformSettings: {
    minimumRedemptionAmount: number;
    reviewRewardAmount: number;
    referralRewardAmount: number;
    businessRecommendationRewardAmount: number;
  };
  adminRole: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [adminActionsPage, setAdminActionsPage] = useState(1);
  const [adminActionsLimit, setAdminActionsLimit] = useState(10);
  const [paginationLoading, setPaginationLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    if (adminActionsPage > 1) {
      fetchDashboardData(true);
    }
    if (adminActionsLimit !== 10) {
      fetchDashboardData(true);
    }
  }, [adminActionsPage, adminActionsLimit]);

  const fetchDashboardData = async (isPagination = false) => {
    try {
      if (isPagination) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/admin/dashboard?adminActionsPage=${adminActionsPage}&adminActionsLimit=${adminActionsLimit}`,
      );
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      if (isPagination) {
        setPaginationLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleAdminActionsPageChange = (newPage: number) => {
    setAdminActionsPage(newPage);
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Crown className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {session?.user?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.overview.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                All platform users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Businesses
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.overview.totalBusinesses}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered businesses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.overview.totalReviews}
              </div>
              <p className="text-xs text-muted-foreground">User reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Agents
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.overview.totalAgents}
              </div>
              <p className="text-xs text-muted-foreground">Approved agents</p>
            </CardContent>
          </Card>
        </div>

        {/* User Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">
                  {dashboardData.overview.userBreakdown.reviewers}
                </p>
                <p className="text-sm text-blue-700">Reviewers</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">
                  {dashboardData.overview.userBreakdown.businessOwners}
                </p>
                <p className="text-sm text-green-700">Business Owners</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">
                  {dashboardData.overview.userBreakdown.agents}
                </p>
                <p className="text-sm text-purple-700">Agents</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <UserCheck className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-900">
                  {dashboardData.overview.userBreakdown.admins}
                </p>
                <p className="text-sm text-orange-700">Admins</p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <Crown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-900">
                  {dashboardData.overview.userBreakdown.superAdmins}
                </p>
                <p className="text-sm text-red-700">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-900">
                <Clock className="h-5 w-5" />
                <span>Pending Businesses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-900 mb-2">
                  {dashboardData.pending.businesses}
                </p>
                <p className="text-yellow-700 mb-4">Awaiting verification</p>
                <Button
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  onClick={() => navigateTo("/admin/businesses")}
                >
                  Review All
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900">
                <Shield className="h-5 w-5" />
                <span>Pending Agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-900 mb-2">
                  {dashboardData.pending.agentApplications}
                </p>
                <p className="text-blue-700 mb-4">Agent applications</p>
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => navigateTo("/admin/agents")}
                >
                  Review All
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-900">
                <UserCheck className="h-5 w-5" />
                <span>Pending Invitations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-900 mb-2">
                  {dashboardData.pending.adminInvitations}
                </p>
                <p className="text-purple-700 mb-4">Admin invitations</p>
                <Button
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={() => navigateTo("/admin/invitations")}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Settings */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Min Redemption</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{dashboardData.platformSettings.minimumRedemptionAmount}
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Review Reward</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{dashboardData.platformSettings.reviewRewardAmount}
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Referral Reward</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{dashboardData.platformSettings.referralRewardAmount}
                </p>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  Business Rec Reward
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦
                  {
                    dashboardData.platformSettings
                      .businessRecommendationRewardAmount
                  }
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => navigateTo("/admin/settings")}
              >
                Edit Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Admin Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Admin Actions</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/actions")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                </Button>
                <label htmlFor="pageSize" className="text-sm text-gray-600">
                  Show:
                </label>
                <select
                  id="pageSize"
                  value={adminActionsLimit}
                  onChange={(e) => {
                    setAdminActionsLimit(parseInt(e.target.value));
                    setAdminActionsPage(1); // Reset to first page when changing page size
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginationLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading admin actions...</p>
              </div>
            ) : dashboardData.recent.adminActions.length > 0 ? (
              <>
                <div className="space-y-3 mb-4">
                  {dashboardData.recent.adminActions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <UserCheck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {action.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {action.admin.name} •{" "}
                            {new Date(action.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{action.targetType}</Badge>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {dashboardData.recent.adminActionsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-600">
                      Showing {(adminActionsPage - 1) * adminActionsLimit + 1}{" "}
                      to{" "}
                      {Math.min(
                        adminActionsPage * adminActionsLimit,
                        dashboardData.recent.adminActionsPagination.total,
                      )}{" "}
                      of {dashboardData.recent.adminActionsPagination.total}{" "}
                      actions
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAdminActionsPageChange(
                            Math.max(1, adminActionsPage - 1),
                          )
                        }
                        disabled={adminActionsPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          {
                            length: Math.min(
                              5,
                              dashboardData.recent.adminActionsPagination
                                .totalPages,
                            ),
                          },
                          (_, i) => {
                            const pageNum = i + 1;
                            if (
                              dashboardData.recent.adminActionsPagination
                                .totalPages <= 5
                            ) {
                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    pageNum === adminActionsPage
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    handleAdminActionsPageChange(pageNum)
                                  }
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            }

                            // Show first page, last page, current page, and pages around current
                            if (
                              pageNum === 1 ||
                              pageNum ===
                                dashboardData.recent.adminActionsPagination
                                  .totalPages ||
                              (pageNum >= adminActionsPage - 1 &&
                                pageNum <= adminActionsPage + 1)
                            ) {
                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    pageNum === adminActionsPage
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    handleAdminActionsPageChange(pageNum)
                                  }
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            }

                            // Show ellipsis
                            if (
                              pageNum === adminActionsPage - 2 ||
                              pageNum === adminActionsPage + 2
                            ) {
                              return (
                                <span
                                  key={pageNum}
                                  className="px-2 text-gray-500"
                                >
                                  ...
                                </span>
                              );
                            }

                            return null;
                          },
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAdminActionsPageChange(
                            Math.min(
                              dashboardData.recent.adminActionsPagination
                                .totalPages,
                              adminActionsPage + 1,
                            ),
                          )
                        }
                        disabled={
                          adminActionsPage ===
                          dashboardData.recent.adminActionsPagination.totalPages
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent admin actions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
