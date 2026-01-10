"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Building2,
  Star,
  Users,
  Gift,
  Plus,
  Eye,
  DollarSign,
  MapPin,
  Phone,
  Globe,
  Mail,
  RefreshCw,
} from "lucide-react";

interface BusinessStats {
  totalVisits: number;
  totalReviews: number;
  averageRating: number;
  activeCoupons: number;
  redeemedCoupons: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

interface BusinessData {
  id: string;
  name: string;
  description: string;
  category: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
  coverImage?: string;
  verificationStatus: string;
  averageRating: number;
  totalReviews: number;
  totalVisits: number;
  createdAt: string;
  updatedAt: string;
}

interface RecentReview {
  id: string;
  reviewerName: string;
  rating: number;
  content: string;
  images?: string[];
  video?: string;
  createdAt: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

interface ActiveCoupon {
  id: string;
  title: string;
  discountValue: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  validUntil: string;
  totalIssued: number;
  totalRedeemed: number;
  status: "ACTIVE" | "PAUSED" | "EXPIRED";
}

export default function BusinessDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [activeCoupons, setActiveCoupons] = useState<ActiveCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch business data
      const businessResponse = await fetch("/api/business");
      if (!businessResponse.ok) {
        if (businessResponse.status === 404) {
          // No business found - redirect to registration
          window.location.href = "/business/register";
          return;
        }
        throw new Error("Failed to fetch business data");
      }

      const businessData = await businessResponse.json();
      setBusinessData(businessData.business);

      // Fetch analytics data
      const analyticsResponse = await fetch("/api/business/analytics");
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        const analytics = analyticsData.analytics;

        setStats({
          totalVisits: analytics.totalVisits || 0,
          totalReviews: analytics.totalReviews || 0,
          averageRating: analytics.averageRating || 0,
          activeCoupons: analytics.activeCoupons || 0,
          redeemedCoupons: analytics.totalCouponRedemptions || 0,
          totalRevenue: analytics.totalRevenue || 0,
          monthlyGrowth: analytics.monthlyGrowth || 0,
        });
      }

      // Fetch recent reviews (including pending ones)
      const reviewsResponse = await fetch("/api/business/reviews");
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        const reviews = reviewsData.reviews.slice(0, 8); // Get 8 most recent to show variety

        const transformedReviews: RecentReview[] = reviews.map(
          (review: Record<string, unknown>) => ({
            id: review.id as string,
            reviewerName:
              ((review.reviewer as Record<string, unknown>)?.name as string) ||
              "Anonymous",
            rating: review.rating as number,
            content: review.content as string,
            images: (review.images as string[]) || [],
            video: review.video as string | undefined,
            createdAt: review.createdAt as string,
            status: review.status as "APPROVED" | "PENDING" | "REJECTED",
          }),
        );

        setRecentReviews(transformedReviews);
      }

      // Fetch active coupons
      const couponsResponse = await fetch("/api/business/coupons");
      if (couponsResponse.ok) {
        const couponsData = await couponsResponse.json();
        const coupons = couponsData.coupons.filter(
          (coupon: Record<string, unknown>) => coupon.status === "ACTIVE",
        );

        const transformedCoupons: ActiveCoupon[] = coupons.map(
          (coupon: Record<string, unknown>) => ({
            id: coupon.id as string,
            title: coupon.title as string,
            discountValue: coupon.value as number,
            discountType: coupon.type as "PERCENTAGE" | "FIXED_AMOUNT",
            validUntil: coupon.validUntil as string,
            totalIssued: (coupon.totalIssued as number) || 0,
            totalRedeemed: (coupon.totalRedeemed as number) || 0,
            status: coupon.status as "ACTIVE" | "PAUSED" | "EXPIRED",
          }),
        );

        setActiveCoupons(transformedCoupons);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data",
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleViewAllReviews = () => {
    router.push("/business/reviews");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {session?.user?.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
          <p className="font-medium">Error loading dashboard data:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Business Info Card */}
      {businessData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {businessData.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {businessData.category.replace(/_/g, " ")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {businessData.description}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {businessData.address}, {businessData.city},{" "}
                    {businessData.state.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {businessData.phone}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {businessData.email}
                  </span>
                </div>
                {businessData.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a
                      href={businessData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {businessData.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalVisits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats?.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Avg rating: {stats?.averageRating}/5
            </p>
            <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                {recentReviews.filter((r) => r.status === "APPROVED").length}
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                {recentReviews.filter((r) => r.status === "PENDING").length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Coupons
            </CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCoupons}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.redeemedCoupons} redeemed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{stats?.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        {/* Pending Reviews Card */}
        <Card
          className="border-yellow-200 bg-yellow-50 cursor-pointer hover:bg-yellow-100 transition-colors"
          onClick={() => router.push("/business/reviews?status=PENDING")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              Pending Reviews
            </CardTitle>
            <div className="w-4 h-4 text-yellow-600">
              <RefreshCw className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-800">
              {recentReviews.filter((r) => r.status === "PENDING").length}
            </div>
            <p className="text-xs text-yellow-600">Need your attention</p>
            <p className="text-xs text-yellow-500 mt-1">
              Click to view all pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                Recent Reviews
              </CardTitle>
              {/* Review Status Summary */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  {
                    recentReviews.filter((r) => r.status === "APPROVED").length
                  }{" "}
                  Approved
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  {recentReviews.filter((r) => r.status === "PENDING").length}{" "}
                  Pending
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  {
                    recentReviews.filter((r) => r.status === "REJECTED").length
                  }{" "}
                  Rejected
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-medium">Status Guide:</span> Approved =
                Visible to public, Pending = Awaiting review, Rejected = Hidden
                from public
              </div>
              {/* Pending Reviews Alert */}
              {recentReviews.filter((r) => r.status === "PENDING").length >
                0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ You have{" "}
                    {recentReviews.filter((r) => r.status === "PENDING").length}{" "}
                    pending review(s) that need your attention.
                  </p>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div
                      key={review.id}
                      className={`border rounded-lg p-4 ${
                        review.status === "PENDING"
                          ? "bg-yellow-50 border-yellow-200"
                          : review.status === "REJECTED"
                          ? "bg-red-50 border-red-200"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {review.reviewerName}
                            </p>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "text-yellow-500 fill-current"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            review.status === "APPROVED"
                              ? "default"
                              : review.status === "PENDING"
                              ? "secondary"
                              : "destructive"
                          }
                          className={
                            review.status === "APPROVED"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : review.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {review.status === "APPROVED"
                            ? "✓ Approved"
                            : review.status === "PENDING"
                            ? "⏳ Pending"
                            : "✗ Rejected"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-gray-700 dark:text-gray-300">
                        {review.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                        {review.images && review.images.length > 0 && (
                          <span>📷 {review.images.length} photos</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* View All Reviews Button */}
                  {recentReviews.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleViewAllReviews}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View All Reviews & Manage
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No reviews yet. Encourage your customers to leave reviews!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Coupons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-5 h-5 mr-2 text-green-500" />
                Active Coupons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeCoupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCoupons.map((coupon) => (
                    <div key={coupon.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {coupon.title}
                        </h4>
                        <Badge
                          variant={
                            coupon.status === "ACTIVE" ? "default" : "secondary"
                          }
                        >
                          {coupon.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {coupon.discountType === "PERCENTAGE"
                          ? `${coupon.discountValue}% off`
                          : `₦${coupon.discountValue} off`}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          Valid until{" "}
                          {new Date(coupon.validUntil).toLocaleDateString()}
                        </span>
                        <span>
                          {coupon.totalRedeemed}/{coupon.totalIssued} used
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No active coupons yet. Create your first coupon to attract
                    customers!
                  </p>
                  <Button className="mt-3" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
