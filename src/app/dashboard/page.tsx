"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/types";
import {
  TrendingUp,
  Star,
  Users,
  Award,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  ArrowUpRight,
  Eye,
  Heart,
  Share2,
  Zap,
  Target,
  Trophy,
  Coins,
  Gift,
  LogOut,
  User,
  Settings,
} from "lucide-react";

interface DashboardStats {
  totalReviews: number;
  totalEarnings: number;
  pendingRewards: number;
  referralCount: number;
  referralEarnings: number;
  currentStreak: number;
  level: string;
  nextLevelProgress: number;
  approvedReviews: number;
  pendingReviews: number;
  reviewEarnings: number;
}

interface Review {
  id: string;
  businessName: string;
  businessCategory: string;
  rating: number;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  earnings: number;
  createdAt: string;
}

interface Referral {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "ACTIVE";
  earnings: number;
  joinedAt: string;
}

interface Coupon {
  id: string;
  businessName: string;
  title: string;
  discountValue: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  validUntil: string;
  status: "ACTIVE" | "USED" | "EXPIRED";
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.REVIEWER]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with real API calls
    const fetchDashboardData = async () => {
      try {
        // Simulate API call for now
        setTimeout(() => {
          setStats({
            totalReviews: 47,
            totalEarnings: 2350,
            pendingRewards: 150,
            referralCount: 8,
            referralEarnings: 160,
            currentStreak: 5,
            level: "Local Hero",
            nextLevelProgress: 65,
            approvedReviews: 42,
            pendingReviews: 5,
            reviewEarnings: 2100,
          });

          setReviews([
            {
              id: "1",
              businessName: "TechHub Nigeria",
              businessCategory: "Technology",
              rating: 5,
              content: "Excellent service and very professional team!",
              status: "APPROVED",
              earnings: 50,
              createdAt: "2024-01-15",
            },
            {
              id: "2",
              businessName: "Green Foods Restaurant",
              businessCategory: "Restaurant",
              rating: 4,
              content: "Great food and atmosphere. Will visit again!",
              status: "PENDING",
              earnings: 0,
              createdAt: "2024-01-14",
            },
          ]);

          setReferrals([
            {
              id: "1",
              name: "John Doe",
              email: "john@example.com",
              status: "ACTIVE",
              earnings: 20,
              joinedAt: "2024-01-10",
            },
            {
              id: "2",
              name: "Jane Smith",
              email: "jane@example.com",
              status: "PENDING",
              earnings: 0,
              joinedAt: "2024-01-12",
            },
          ]);

          setCoupons([
            {
              id: "1",
              businessName: "TechHub Nigeria",
              title: "20% Off Tech Services",
              discountValue: 20,
              discountType: "PERCENTAGE",
              validUntil: "2024-02-15",
              status: "ACTIVE",
            },
          ]);

          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4" />;
      case "PENDING":
        return <Clock3 className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      case "ACTIVE":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock3 className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SnapRate
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 capitalize">
                    {session?.user?.role?.toLowerCase().replace("_", " ") ||
                      "Reviewer"}
                  </p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="apple-container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="apple-responsive-heading font-bold mb-2">
            Welcome back, <span className="apple-text-gradient">Reviewer!</span>
          </h1>
          <p className="apple-text-muted">
            Here&apos;s what&apos;s happening with your account today
          </p>
        </div>

        {/* Stats Overview */}
        <div className="apple-grid-4 mb-8">
          <Card className="apple-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="apple-text-muted text-sm font-medium">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold">
                    ₦{stats?.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl apple-gradient flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="apple-text-muted text-sm font-medium">
                    Pending Rewards
                  </p>
                  <p className="text-2xl font-bold">₦{stats?.pendingRewards}</p>
                </div>
                <div className="w-12 h-12 rounded-xl apple-gradient-secondary flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="apple-text-muted text-sm font-medium">
                    Current Streak
                  </p>
                  <p className="text-2xl font-bold">
                    {stats?.currentStreak} days
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl apple-gradient-success flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="apple-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="apple-text-muted text-sm font-medium">
                    Level Progress
                  </p>
                  <p className="text-2xl font-bold">
                    {stats?.nextLevelProgress}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl apple-gradient-warning flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <Card className="apple-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>Level Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{stats?.level}</span>
                <span className="apple-text-muted text-sm">
                  {stats?.totalReviews} /{" "}
                  {Math.ceil((stats?.totalReviews || 0) / 0.65)} reviews
                </span>
              </div>
              <div className="apple-progress">
                <div
                  className="apple-progress-bar"
                  style={{ width: `${stats?.nextLevelProgress}%` }}
                ></div>
              </div>
            </div>
            <p className="apple-text-muted text-sm">
              Keep reviewing to reach the next level and unlock higher rewards!
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <TabsTrigger
              value="overview"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              My Reviews
            </TabsTrigger>
            <TabsTrigger
              value="referrals"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              My Referrals
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white"
            >
              Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{review.businessName}</p>
                        <p className="apple-text-muted text-sm">
                          {review.content.substring(0, 60)}...
                        </p>
                      </div>
                      <Badge className={getStatusColor(review.status)}>
                        {getStatusIcon(review.status)}
                        <span className="ml-1">{review.status}</span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="apple-button h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    <Eye className="w-6 h-6" />
                    <span>Find Business</span>
                  </Button>
                  <Button className="apple-button h-20 flex flex-col items-center justify-center space-y-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white">
                    <Share2 className="w-6 h-6" />
                    <span>Invite Friends</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>My Reviews</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 apple-transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {review.businessName}
                          </h3>
                          <p className="apple-text-muted text-sm">
                            {review.businessCategory}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                          <Badge className={getStatusColor(review.status)}>
                            {getStatusIcon(review.status)}
                            <span className="ml-1">{review.status}</span>
                          </Badge>
                        </div>
                      </div>
                      <p className="apple-text-muted mb-4">{review.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm apple-text-muted">
                          <span>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>₦{review.earnings} earned</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="apple-button"
                        >
                          View Details
                          <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <span>My Referrals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 apple-transition"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {referral.name}
                          </h3>
                          <p className="apple-text-muted text-sm">
                            {referral.email}
                          </p>
                        </div>
                        <Badge className={getStatusColor(referral.status)}>
                          {getStatusIcon(referral.status)}
                          <span className="ml-1">{referral.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm apple-text-muted">
                          <span>
                            Joined:{" "}
                            {new Date(referral.joinedAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>₦{referral.earnings} earned</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="apple-button"
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          Support
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            {/* Available Coupons */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-purple-500" />
                  <span>Available Coupons</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 apple-transition"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {coupon.title}
                          </h3>
                          <p className="apple-text-muted text-sm">
                            {coupon.businessName}
                          </p>
                        </div>
                        <Badge className="apple-badge-primary">
                          {coupon.discountType === "PERCENTAGE"
                            ? `${coupon.discountValue}% OFF`
                            : `₦${coupon.discountValue} OFF`}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm apple-text-muted">
                          Valid until:{" "}
                          {new Date(coupon.validUntil).toLocaleDateString()}
                        </div>
                        <Button
                          size="sm"
                          className="apple-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                        >
                          Use Coupon
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Redeem Rewards */}
            <Card className="apple-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span>Redeem Rewards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-2xl apple-gradient flex items-center justify-center mx-auto mb-6">
                    <Coins className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Ready to Cash Out?
                  </h3>
                  <p className="apple-text-muted mb-6">
                    You have ₦{stats?.pendingRewards} in pending rewards. Redeem
                    them for airtime, coupons, or bank transfer.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button className="apple-button bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white">
                      Redeem for Airtime
                    </Button>
                    <Button className="apple-button bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                      Bank Transfer
                    </Button>
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
