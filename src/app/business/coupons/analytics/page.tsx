"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Building2, BarChart3, Badge } from "lucide-react";
import Link from "next/link";
import CouponAnalyticsComponent from "@/components/CouponAnalytics";
import PublicNavigation from "@/components/PublicNavigation";

interface Business {
  id: string;
  name: string;
  isVerified: boolean;
}

export default function BusinessCouponAnalyticsPage() {
  const { data: session } = useSession();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/business");

      if (!response.ok) {
        if (response.status === 401) {
          setError("Please sign in to view analytics");
          return;
        }
        if (response.status === 403) {
          setError("You don't have permission to view analytics");
          return;
        }
        throw new Error("Failed to fetch business data");
      }

      const data = await response.json();
      setBusiness(data.business);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch business data",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                Loading analytics...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Analytics
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <div className="space-x-4">
                <Button onClick={fetchBusiness}>Try Again</Button>
                <Link href="/business/coupons">
                  <Button variant="outline">Back to Coupons</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Business Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need to register a business to view analytics.
            </p>
            <Link href="/business/register">
              <Button>Register Business</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!business.isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PublicNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Link href="/business/coupons">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Coupons
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Unavailable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertDescription>
                    Your business needs to be verified before you can view
                    analytics. Please complete the verification process to
                    access detailed performance insights.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Analytics provide valuable insights into:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                    <li>Coupon performance and redemption rates</li>
                    <li>Customer acquisition and segmentation</li>
                    <li>Revenue impact and discount analysis</li>
                    <li>Monthly trends and seasonal patterns</li>
                    <li>Export capabilities for reporting</li>
                  </ul>
                  <Link href="/business/verification">
                    <Button className="w-full">
                      Complete Business Verification
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicNavigation />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link
            href="/"
            className="hover:text-gray-700 dark:hover:text-gray-300"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href="/business/coupons"
            className="hover:text-gray-700 dark:hover:text-gray-300"
          >
            Coupons
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">
            Analytics
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/business/coupons">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Coupons
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Coupon Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Performance insights for {business.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              Verified Business
            </Badge>
          </div>
        </div>

        {/* Analytics Component */}
        <CouponAnalyticsComponent
          businessId={business.id}
          businessName={business.name}
        />
      </div>
    </div>
  );
}
