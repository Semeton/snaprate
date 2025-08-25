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
  MessageSquare,
  Calendar,
  MapPin,
  ArrowRight,
  Plus,
  User,
  Shield,
} from "lucide-react";
import ReviewerSidebar from "@/components/ReviewerSidebar";

interface DashboardStats {
  totalReviews: number;
  totalRewards: number;
  totalReferrals: number;
  averageRating: number;
  currentStreak: number;
  monthlyReviews: number;
  monthlyRewards: number;
  rewardBreakdown: {
    reviewReward: number;
    referralReward: number;
    businessRecommendationReward: number;
  };
  currentRates: {
    reviewReward: number;
    referralReward: number;
    businessRecommendationReward: number;
  };
  userRole: string;
}

interface RecentReview {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  business: {
    id: string;
    name: string;
    category: string;
    state: string;
    city: string;
    logo: string | null;
  };
}

interface RecentReward {
  id: string;
  type: string;
  amount: number;
  description: string;
  isRedeemed: boolean;
  createdAt: string;
}

interface RecentBusiness {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  logo: string | null;
  averageRating: number;
  totalReviews: number;
}

export default function ReviewerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [recentRewards, setRecentRewards] = useState<RecentReward[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<RecentBusiness[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchDashboardData();
    }
  }, [session, status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats from the correct API
      const statsResponse = await fetch("/api/reviewer/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log("Dashboard received stats:", statsData);
        setStats(statsData.data);
      } else {
        console.error(
          "Failed to fetch stats:",
          statsResponse.status,
          statsResponse.statusText,
        );
      }

      // Fetch recent reviews
      const reviewsResponse = await fetch("/api/dashboard/reviews?limit=5");
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setRecentReviews(reviewsData.data?.reviews || []);
      }

      // Fetch recent rewards
      const rewardsResponse = await fetch("/api/dashboard/rewards?limit=5");
      if (rewardsResponse.ok) {
        const rewardsData = await rewardsResponse.json();
        setRecentRewards(rewardsData.data?.rewards || []);
      }

      // Fetch recent businesses
      const businessesResponse = await fetch(
        "/api/dashboard/businesses?limit=3",
      );
      if (businessesResponse.ok) {
        const businessesData = await businessesResponse.json();
        setRecentBusinesses(businessesData.data?.businesses || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatState = (state: string) => {
    return state.replace(/_/g, " ");
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case "REVIEW":
        return "bg-blue-100 text-blue-800";
      case "REFERRAL":
        return "bg-green-100 text-green-800";
      case "BUSINESS_RECOMMENDATION":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ReviewerSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="lg:ml-64">
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
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {session?.user?.name || "Reviewer"}! 👋
            </h1>
            <p className="text-gray-600">
              Here&apos;s what&apos;s happening with your reviews and rewards
              today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Reviews
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.totalReviews || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Rewards
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₦{stats?.totalRewards || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Gift className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Average Rating
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.averageRating?.toFixed(1) || "0.0"}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Current Streak
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.currentStreak || 0} days
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reward Breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 dark:text-white">
                <Gift className="h-5 w-5 text-green-600" />
                <span>Reward Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ₦{stats?.rewardBreakdown?.reviewReward || 0}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    From Reviews
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    ₦{stats?.currentRates?.reviewReward || 50} ×{" "}
                    {stats?.totalReviews || 0} reviews
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    ₦{stats?.rewardBreakdown?.referralReward || 0}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    From Referrals
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    ₦{stats?.currentRates?.referralReward || 20} ×{" "}
                    {stats?.totalReferrals || 0} referrals
                  </p>
                </div>

                <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    ₦{stats?.rewardBreakdown?.businessRecommendationReward || 0}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    From Business Recs
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    ₦{stats?.currentRates?.businessRecommendationReward || 100}{" "}
                    × approved businesses
                  </p>
                </div>
              </div>

              {stats?.userRole === "AGENT" && (
                <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
                  <p className="text-sm text-purple-800 dark:text-purple-200 text-center">
                    🎉 As an Agent, you can earn ₦
                    {stats?.currentRates?.businessRecommendationReward || 100}{" "}
                    for each approved business recommendation!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="dark:text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push("/reviewer/settings")}
                className="w-full justify-start"
                variant="outline"
              >
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                onClick={() => router.push("/reviewer/submit-review")}
                className="w-full justify-start"
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Write Review
              </Button>
              {session?.user?.role === "AGENT" ? (
                <Button
                  onClick={() => router.push("/reviewer/recommend-business")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Recommend Business
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/reviewer/apply-agent")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Apply to be Agent
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Reviews */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Recent Reviews</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/reviewer/reviews")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No reviews yet</p>
                    <Button
                      onClick={() => router.push("/reviewer/submit-review")}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Write Review
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
                      >
                        {review.business.logo ? (
                          <img
                            src={review.business.logo}
                            alt={review.business.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-500 font-medium text-sm">
                              {review.business.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {review.business.name}
                            </h4>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {review.content}
                          </p>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            <span>{formatDate(review.createdAt)}</span>
                            <span>•</span>
                            <span>{review.business.category}</span>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span>
                              {review.business.city},{" "}
                              {formatState(review.business.state)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Rewards */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Recent Rewards</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/reviewer/rewards")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {recentRewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No rewards yet</p>
                    <p className="text-sm text-gray-500">
                      Start reviewing businesses to earn rewards!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentRewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Gift className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {reward.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                className={getRewardTypeColor(reward.type)}
                              >
                                {reward.type.replace(/_/g, " ")}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {formatDate(reward.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ₦{reward.amount}
                          </p>
                          {reward.isRedeemed && (
                            <Badge variant="secondary" className="text-xs">
                              Redeemed
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Businesses */}
          <Card className="mt-8">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Recent Businesses</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/businesses")}
                className="text-blue-600 hover:text-blue-700"
              >
                See All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {recentBusinesses.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No businesses found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recentBusinesses.map((business) => (
                    <div
                      key={business.id}
                      className="group cursor-pointer"
                      onClick={() => router.push(`/businesses/${business.id}`)}
                    >
                      <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3 mb-3">
                          {business.logo ? (
                            <img
                              src={business.logo}
                              alt={business.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-500 font-medium text-lg">
                                {business.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                              {business.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {business.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {business.city}, {formatState(business.state)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">
                              {business.averageRating?.toFixed(1) || "0.0"}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({business.totalReviews} reviews)
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/reviewer/submit-review?businessId=${business.id}`,
                              );
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Review
                          </Button>
                        </div>
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
