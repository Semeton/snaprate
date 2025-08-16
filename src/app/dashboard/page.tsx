"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Star,
  Award,
  Users,
  TrendingUp,
  MapPin,
  Building2,
  Phone,
  Mail,
  Calendar,
  Shield,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import RewardRedemption from "@/components/RewardRedemption";

interface DashboardStats {
  totalReviews: number;
  totalEarnings: number;
  pendingRewards: number;
  referralCount: number;
  referralEarnings: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user?.id) return;

      try {
        // TODO: Replace with actual API calls to get user stats
        // For now, show loading state
        setStats({
          totalReviews: 0,
          totalEarnings: 0,
          pendingRewards: 0,
          referralCount: 0,
          referralEarnings: 0,
        });
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  const handleRewardRedeemed = () => {
    // Refresh dashboard stats when a reward is redeemed
    if (session?.user?.id) {
      // TODO: Refresh stats
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You need to be signed in to view this page.
          </p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {getInitials(user.name || user.email || "")}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.name || "User"}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's what's happening with your SnapRate account
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="/businesses">
                <Star className="h-4 w-4 mr-2" />
                Review Businesses
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/auth/profile">
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
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
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{(stats?.totalEarnings || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Rewards earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Rewards
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{(stats?.pendingRewards || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for redemption
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
                {stats?.referralCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Friends referred</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Start Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Start earning rewards with these simple steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        1
                      </span>
                    </div>
                    <h3 className="font-medium mb-2">Find Businesses</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Browse and search for businesses in your area
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        2
                      </span>
                    </div>
                    <h3 className="font-medium mb-2">Write Reviews</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share your honest experience and earn ₦50 per review
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 dark:text-purple-400 font-bold">
                        3
                      </span>
                    </div>
                    <h3 className="font-medium mb-2">Redeem Rewards</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Convert your earnings to airtime or coupons
                    </p>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Button asChild>
                    <a href="/businesses">Start Reviewing Now</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <RewardRedemption onRewardRedeemed={handleRewardRedeemed} />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Reviews</CardTitle>
                <CardDescription>
                  Track your review history and earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No reviews yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Start reviewing businesses to see them here.
                  </p>
                  <div className="mt-4">
                    <Button asChild>
                      <a href="/businesses">Write Your First Review</a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>
                  Invite friends and earn ₦20 for each signup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Your Referral Link
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/auth/signup?ref=${user.id}`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <Button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `${window.location.origin}/auth/signup?ref=${user.id}`,
                          )
                        }
                        size="sm"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats?.referralCount || 0}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Friends Referred
                      </p>
                    </div>

                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ₦{(stats?.referralEarnings || 0).toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Referral Earnings
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
