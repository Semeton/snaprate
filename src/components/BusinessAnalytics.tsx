"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Eye,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
} from "lucide-react";

interface BusinessViewStats {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  thisWeekViews: number;
  thisMonthViews: number;
  viewsBySource: Record<string, number>;
  viewsByType: Record<string, number>;
}

interface RecentView {
  id: string;
  createdAt: string;
  source: string;
  viewType: string;
  viewer?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface BusinessAnalyticsProps {
  businessId: string;
  className?: string;
}

export default function BusinessAnalytics({
  businessId,
  className,
}: BusinessAnalyticsProps) {
  const [stats, setStats] = useState<BusinessViewStats | null>(null);
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/businesses/${businessId}/views`);

      if (response.ok) {
        const data = await response.json();
        setStats(data.data.stats);
        setRecentViews(data.data.recentViews);
      } else {
        setError("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchAnalytics();
    }
  }, [businessId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "SEARCH":
        return <MapPin className="h-4 w-4" />;
      case "SOCIAL":
        return <TrendingUp className="h-4 w-4" />;
      case "REFERRAL":
        return <Users className="h-4 w-4" />;
      case "FEATURED":
        return <Eye className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Business Analytics
        </h2>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Views
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.totalViews)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unique Visitors
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.uniqueVisitors)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Today
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.todayViews)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This Week
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(stats.thisWeekViews)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Views by Source */}
      <Card>
        <CardHeader>
          <CardTitle>Views by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.viewsBySource).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(source)}
                  <span className="capitalize">{source.toLowerCase()}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Views */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentViews.length > 0 ? (
              recentViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {view.viewer ? (
                      <Avatar
                        user={{
                          name: view.viewer.name,
                          avatar: view.viewer.avatar,
                        }}
                        size="sm"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-500">A</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {view.viewer ? view.viewer.name : "Anonymous User"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(view.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {view.source}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {view.viewType}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No recent views yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
