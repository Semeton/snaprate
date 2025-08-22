"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  DollarSign,
  Users,
  TrendingUp,
  Search,
  Plus,
  Share2,
  Gift,
  Eye,
  MessageSquare,
  Camera,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BusinessCategory } from "@/types";

interface DashboardStats {
  totalReviews: number;
  totalEarnings: number;
  totalReferrals: number;
  totalBusinessesRecommended: number;
  pendingRewards: number;
  averageRating: number;
}

interface RecentReview {
  id: string;
  business: {
    name: string;
    category: string;
    state: string;
    city: string;
  };
  rating: number;
  content: string;
  status: string;
  createdAt: string;
  // earnings will be calculated from the reward amount
}

interface RecentReward {
  id: string;
  type: string;
  amount: number;
  description: string;
  isRedeemed: boolean;
  createdAt: string;
}

export default function ReviewerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [recentRewards, setRecentRewards] = useState<RecentReward[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<
    {
      id: string;
      name: string;
      category: string;
      state: string;
      city: string;
      averageRating: number;
      totalReviews: number;
      logo?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchDashboardData();
    }
  }, [session, status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats
      const statsResponse = await fetch("/api/reviewer/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
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

  const handleSearchBusinesses = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (selectedCategory) params.append("category", selectedCategory);

    router.push(`/reviewer/businesses?${params.toString()}`);
  };

  const handleSubmitReview = () => {
    router.push("/reviewer/submit-review");
  };

  const handleViewRewards = () => {
    router.push("/reviewer/rewards");
  };

  const handleShareReferral = () => {
    const referralCode = session?.user?.referralCode || "N/A";
    const referralLink = `${window.location.origin}/auth/signup?ref=${referralCode}`;

    if (navigator.share) {
      navigator.share({
        title: "Join SnapRate and earn rewards!",
        text: `Use my referral code: ${referralCode}`,
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
      alert("Referral link copied to clipboard!");
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {session?.user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Your reviewer dashboard - earn rewards by reviewing businesses
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleSubmitReview}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit Review
              </Button>
              <Button onClick={handleViewRewards} variant="outline">
                <Gift className="h-4 w-4 mr-2" />
                View Rewards
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalReviews || 0}
              </div>
              <p className="text-xs text-muted-foreground">Reviews submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Earnings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{stats?.totalEarnings || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                From reviews & referrals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalReferrals || 0}
              </div>
              <p className="text-xs text-muted-foreground">Friends invited</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageRating?.toFixed(1) || "0.0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Your review rating
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Button
                  onClick={handleSubmitReview}
                  className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Review
                </Button>
                <p className="text-sm text-gray-600">Earn ₦50 per review</p>
              </div>

              <div className="text-center">
                <Button
                  onClick={handleShareReferral}
                  className="w-full bg-green-600 hover:bg-green-700 mb-2"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Referral
                </Button>
                <p className="text-sm text-gray-600">Earn ₦20 per signup</p>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => router.push("/reviewer/recommend-business")}
                  className="w-full bg-purple-600 hover:bg-purple-700 mb-2"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Recommend Business
                </Button>
                <p className="text-sm text-gray-600">Earn ₦100 per approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Businesses */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Businesses to Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search businesses</Label>
                <Input
                  id="search"
                  placeholder="Search by name, category, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="category">Category</Label>
                <div className="mt-1">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      console.log("Category selected:", e.target.value);
                      setSelectedCategory(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All categories</option>
                    {Object.values(BusinessCategory).map((category) => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearchBusinesses}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Businesses */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Businesses</CardTitle>
            <Button
              onClick={() => router.push("/reviewer/businesses")}
              variant="outline"
              size="sm"
            >
              See All
            </Button>
          </CardHeader>
          <CardContent>
            {recentBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/businesses/${business.id}`)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      {business.logo ? (
                        <img
                          src={business.logo}
                          alt={business.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 text-sm font-medium">
                            {business.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {business.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {business.category.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {business.city}, {business.state}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">
                            {business.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {business.totalReviews} reviews
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No businesses found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for Recent Activity */}
        <Tabs defaultValue="reviews" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
            <TabsTrigger value="rewards">Recent Rewards</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {recentReviews.length > 0 ? (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="flex items-start space-x-4 p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">
                              {review.business?.name || "Unknown Business"}
                            </h4>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <Badge
                              variant={
                                review.status === "APPROVED"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {review.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {review.content}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-green-600 font-medium">
                              +₦50
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>
                      No reviews yet. Start reviewing businesses to earn
                      rewards!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                {recentRewards.length > 0 ? (
                  <div className="space-y-4">
                    {recentRewards.map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Gift className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">{reward.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(reward.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +₦{reward.amount}
                          </p>
                          <Badge
                            variant={
                              reward.isRedeemed ? "default" : "secondary"
                            }
                          >
                            {reward.isRedeemed ? "REDEEMED" : "PENDING"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No rewards yet. Submit reviews to start earning!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
