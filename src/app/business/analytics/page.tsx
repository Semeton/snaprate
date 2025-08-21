"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole } from "@/types";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Star,
  Gift,
  Download,
  Filter,
  DollarSign,
  Activity,
  Target,
  Award,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  totalVisits: number;
  totalReviews: number;
  averageRating: number;
  activeCoupons: number;
  totalRevenue: number;
  monthlyGrowth: number;
  topPerformingCoupons: Array<{
    name: string;
    redemptions: number;
    revenue: number;
  }>;
  customerDemographics: Array<{
    ageGroup: string;
    percentage: number;
  }>;
  peakHours: Array<{
    hour: string;
    visits: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    visits: number;
    reviews: number;
    revenue: number;
  }>;
}

export default function BusinessAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
      <BusinessAnalyticsContent />
    </ProtectedRoute>
  );
}

function BusinessAnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // Convert timeRange to days
      const days =
        timeRange === "7d"
          ? 7
          : timeRange === "30d"
          ? 30
          : timeRange === "90d"
          ? 90
          : 365;

      // Fetch analytics from the API
      const response = await fetch(`/api/business/analytics?days=${days}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data.analytics || null);
    } catch (error) {
      console.error("Failed to refresh analytics:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Convert timeRange to days
        const days =
          timeRange === "7d"
            ? 7
            : timeRange === "30d"
            ? 30
            : timeRange === "90d"
            ? 90
            : 365;

        // Fetch analytics from the API
        const response = await fetch(`/api/business/analytics?days=${days}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.statusText}`);
        }

        const data = await response.json();
        setAnalytics(data.analytics || null);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Analytics Data
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {loading
                ? "Loading analytics..."
                : "Analytics data will appear here once your business starts receiving traffic."}
            </p>
            {!loading && (
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const getGrowthIndicator = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive: growth >= 0,
      icon: growth >= 0 ? TrendingUp : TrendingDown,
      color: growth >= 0 ? "text-green-600" : "text-red-600",
    };
  };

  const previousMonth =
    analytics.monthlyTrends[analytics.monthlyTrends.length - 2];
  const currentMonth =
    analytics.monthlyTrends[analytics.monthlyTrends.length - 1];

  const visitsGrowth = getGrowthIndicator(
    currentMonth?.visits || 0,
    previousMonth?.visits || 0,
  );
  const revenueGrowth = getGrowthIndicator(
    currentMonth?.revenue,
    previousMonth?.revenue || 0,
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Business Analytics
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed insights and performance metrics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="365d">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Visits
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalVisits.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <visitsGrowth.icon
                  className={`w-4 h-4 ${visitsGrowth.color}`}
                />
                <span className={`text-sm ${visitsGrowth.color}`}>
                  {visitsGrowth.isPositive ? "+" : "-"}
                  {visitsGrowth.value}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Customer Rating
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.averageRating}/5
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Target className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600">
                  {analytics.averageRating.toFixed(1)}/5 rating
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Coupon Redemptions
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.activeCoupons}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">
                  {analytics.topPerformingCoupons.length} active offers
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{analytics.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <revenueGrowth.icon
                  className={`w-4 h-4 ${revenueGrowth.color}`}
                />
                <span className={`text-sm ${revenueGrowth.color}`}>
                  {revenueGrowth.isPositive ? "+" : "-"}
                  {revenueGrowth.value}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Coupons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-500" />
              Top Performing Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analytics.topPerformingCoupons.map((coupon, index) => (
                <div
                  key={coupon.name}
                  className="border rounded-lg p-4 text-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-lg">
                      {index + 1}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {coupon.name}
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {coupon.redemptions}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Redemptions
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        ₦{coupon.revenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Revenue Generated
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Strong Growth
                  </span>
                </div>
                <Badge variant="default" className="bg-green-600">
                  +{visitsGrowth.value}%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    High Satisfaction
                  </span>
                </div>
                <Badge variant="default" className="bg-blue-600">
                  {analytics.averageRating.toFixed(1)}/5
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Coupon Success
                  </span>
                </div>
                <Badge variant="default" className="bg-purple-600">
                  {analytics.activeCoupons} active
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
