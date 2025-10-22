"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Gift,
  Search,
  MapPin,
  Calendar,
  Users,
  Eye,
  QrCode,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Coupon,
  CouponStatus,
  CouponVisibility,
  Business,
  CouponAssignmentData,
} from "@/types";
import { toast } from "@/components/ui/use-toast";

export default function BusinessCouponsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const [business, setBusiness] = useState<Business | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("public");
  const [userClaimedCoupons, setUserClaimedCoupons] = useState<Set<string>>(
    new Set(),
  );

  const businessId = params.id as string;

  const fetchBusinessDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`);
      if (response.ok) {
        const businessData = await response.json();
        setBusiness(businessData);
      } else {
        setError("Failed to load business details");
      }
    } catch (error) {
      console.error("Error fetching business:", error);
      setError("Failed to load business details");
    }
  }, [businessId]);

  const fetchBusinessCoupons = useCallback(async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/coupons`);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      } else {
        setError("Failed to load coupons");
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setError("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const fetchUserClaimedCoupons = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/user/coupons/assignments`);
      if (response.ok) {
        const data = await response.json();
        const claimedCouponIds = new Set(
          data.assignments?.map(
            (assignment: CouponAssignmentData) => assignment.couponId,
          ) || [],
        );
        setUserClaimedCoupons(claimedCouponIds as Set<string>);
      }
    } catch (error) {
      console.error("Error fetching user claimed coupons:", error);
    }
  }, [session?.user]);

  const filterCoupons = useCallback(() => {
    let filtered = coupons;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (coupon) =>
          coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coupon.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by tab
    switch (activeTab) {
      case "public":
        filtered = filtered.filter(
          (coupon) => coupon.couponType === CouponVisibility.PUBLIC,
        );
        break;
      case "private":
        filtered = filtered.filter(
          (coupon) => coupon.couponType === CouponVisibility.PRIVATE,
        );
        break;
      case "active":
        filtered = filtered.filter((coupon) => coupon.status === "ACTIVE");
        break;
      case "expired":
        filtered = filtered.filter((coupon) => coupon.status === "EXPIRED");
        break;
      case "all":
      default:
        // For "all" tab, show only active public coupons by default
        filtered = filtered.filter(
          (coupon) =>
            coupon.couponType === CouponVisibility.PUBLIC &&
            coupon.status === "ACTIVE",
        );
        break;
    }

    setFilteredCoupons(filtered);
  }, [coupons, searchTerm, activeTab]);

  useEffect(() => {
    if (businessId) {
      fetchBusinessDetails();
      fetchBusinessCoupons();
    }
  }, [businessId, fetchBusinessDetails, fetchBusinessCoupons]);

  useEffect(() => {
    if (session?.user) {
      fetchUserClaimedCoupons();
    }
  }, [session?.user, fetchUserClaimedCoupons]);

  useEffect(() => {
    filterCoupons();
  }, [filterCoupons]);

  const handleClaimCoupon = async (couponId: string) => {
    if (!session?.user) {
      router.push(`/auth/signin?redirect=/businesses/${businessId}/coupons`);
      return;
    }

    try {
      const response = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ couponId }),
      });

      if (response.ok) {
        toast({
          title: "Coupon Claimed!",
          description: "You have successfully claimed this coupon.",
        });
        fetchBusinessCoupons();
        fetchUserClaimedCoupons();
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Claim Coupon",
          description: errorData.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to claim coupon:", error);
      toast({
        title: "Error",
        description: "Failed to claim coupon. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied!",
      description: "Coupon code has been copied to clipboard.",
    });
  };

  const handleDownloadQR = async (couponId: string) => {
    try {
      const response = await fetch(`/api/coupons/${couponId}/qr`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `coupon-${couponId}-qr.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to download QR code:", error);
    }
  };

  const getStatusColor = (status: CouponStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "EXPIRED":
        return "bg-red-100 text-red-800 border-red-200";
      case "USED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isCouponExpired = (coupon: Coupon) => {
    return new Date(coupon.validUntil) < new Date();
  };

  const isCouponActive = (coupon: Coupon) => {
    const now = new Date();
    return (
      coupon.status === "ACTIVE" &&
      new Date(coupon.validFrom) <= now &&
      new Date(coupon.validUntil) >= now
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-2">
            {error || "Business Not Found"}
          </div>
          <p className="text-gray-600 mb-4">
            {error || "The business you're looking for doesn't exist."}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {business.name} Coupons
                </h1>
                <p className="text-gray-600">
                  Discover and claim exclusive offers from {business.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {business.city}, {business.state}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search coupons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-4 hidden"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                Available (
                {
                  coupons.filter(
                    (c) =>
                      c.couponType === CouponVisibility.PUBLIC &&
                      c.status === "ACTIVE",
                  ).length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="public">
                Public (
                {
                  coupons.filter(
                    (c) => c.couponType === CouponVisibility.PUBLIC,
                  ).length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="private">
                Private (
                {
                  coupons.filter(
                    (c) => c.couponType === CouponVisibility.PRIVATE,
                  ).length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({coupons.filter((c) => c.status === "ACTIVE").length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired ({coupons.filter((c) => c.status === "EXPIRED").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Coupons Grid */}
        {filteredCoupons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
              <Card key={coupon.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {coupon.title}
                      </CardTitle>
                      {coupon.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {coupon.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(coupon.status)} ml-2`}
                    >
                      {coupon.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Coupon Value */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : `₦${coupon.value}`}
                    </div>
                    <p className="text-sm text-gray-500">
                      {coupon.type === "PERCENTAGE" ? "off" : "discount"}
                    </p>
                  </div>

                  {/* Coupon Code */}
                  {coupon.baseCode && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs text-gray-500">
                            Coupon Code
                          </Label>
                          <p className="font-mono text-lg font-semibold">
                            {coupon.baseCode}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(coupon.baseCode!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Validity Period */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Valid until{" "}
                        {new Date(coupon.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                    {coupon.maxUses && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>
                          {coupon.currentUses || 0} / {coupon.maxUses} uses
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    {isCouponActive(coupon) &&
                    coupon.couponType === CouponVisibility.PUBLIC ? (
                      <Button
                        onClick={() => handleClaimCoupon(coupon.id)}
                        className="flex-1"
                        disabled={
                          !session?.user || userClaimedCoupons.has(coupon.id)
                        }
                        variant={
                          userClaimedCoupons.has(coupon.id)
                            ? "outline"
                            : "default"
                        }
                      >
                        {!session?.user ? (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Sign In to Claim
                          </>
                        ) : userClaimedCoupons.has(coupon.id) ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Already Claimed
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Claim Coupon
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1" disabled>
                        {isCouponExpired(coupon) ? (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Expired
                          </>
                        ) : coupon.couponType === CouponVisibility.PRIVATE ? (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Private
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Inactive
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadQR(coupon.id)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No coupons found
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Try adjusting your search terms"
                : "This business hasn't published any coupons yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
