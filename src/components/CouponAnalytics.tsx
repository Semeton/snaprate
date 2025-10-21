"use client";

import React, { useState, useEffect } from "react";
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
import {
  BarChart3,
  TrendingUp,
  Users,
  Gift,
  Download,
  Calendar,
  DollarSign,
  Percent,
  Target,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CouponAnalytics,
  BusinessCouponInsights,
} from "@/services/CouponAnalyticsService";

interface CouponAnalyticsProps {
  businessId: string;
  businessName: string;
}

const CouponAnalyticsComponent: React.FC<CouponAnalyticsProps> = ({
  businessId,
  businessName,
}) => {
  const [analytics, setAnalytics] = useState<CouponAnalytics | null>(null);
  const [insights, setInsights] = useState<BusinessCouponInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [businessId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const [analyticsResponse, insightsResponse] = await Promise.all([
        fetch(
          `/api/business/${businessId}/coupons/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        ),
        fetch(
          `/api/business/${businessId}/coupons/insights?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        ),
      ]);

      if (!analyticsResponse.ok || !insightsResponse.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const [analyticsData, insightsData] = await Promise.all([
        analyticsResponse.json(),
        insightsResponse.json(),
      ]);

      setAnalytics(analyticsData.analytics);
      setInsights(insightsData.insights);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch analytics",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const response = await fetch(
        `/api/business/${businessId}/coupons/analytics/export?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const csvData = await response.text();
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coupon-analytics-${businessName}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Coupon Analytics
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <BarChart3 className="h-12 w-12 mx-auto mb-2" />
          <p>{error}</p>
        </div>
        <Button onClick={fetchAnalytics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!analytics || !insights) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          No analytics data available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Coupon Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Performance insights for {businessName}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCoupons}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeCoupons} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Redemptions
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalRedemptions}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.averageRedemptionRate.toFixed(1)}% avg rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Discount Given
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalDiscountGiven)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(insights.revenueImpact)} estimated impact
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Acquisition
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.customerAcquisition}
            </div>
            <p className="text-xs text-muted-foreground">
              New customers acquired
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Coupons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPerformingCoupons
                .slice(0, 5)
                .map((coupon, index) => (
                  <div
                    key={coupon.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{coupon.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {coupon.redemptions} redemptions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(coupon.discountGiven)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {coupon.redemptionRate.toFixed(1)}% rate
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.customerSegments.map((segment, index) => (
                <div
                  key={segment.segment}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                      {segment.count}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{segment.segment}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Avg {segment.averageRedemptions} redemptions
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {(
                      (segment.count / insights.customerAcquisition) *
                      100
                    ).toFixed(1)}
                    %
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Month</th>
                  <th className="text-right py-2">Coupons Created</th>
                  <th className="text-right py-2">Redemptions</th>
                  <th className="text-right py-2">Discount Given</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyStats.slice(-6).map((month) => (
                  <tr key={month.month} className="border-b">
                    <td className="py-2 font-medium">{month.month}</td>
                    <td className="text-right py-2">{month.couponsCreated}</td>
                    <td className="text-right py-2">{month.redemptions}</td>
                    <td className="text-right py-2">
                      {formatCurrency(month.discountGiven)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Coupon Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Coupon Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.couponTypeDistribution.map((type) => (
              <div
                key={type.type}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{type.type}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {type.count} coupons
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {type.percentage.toFixed(1)}%
                  </p>
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${type.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CouponAnalyticsComponent;
