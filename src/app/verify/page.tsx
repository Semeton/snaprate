"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Building2,
  CreditCard,
  Download,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CouponDetails {
  id: string;
  title: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: string;
  validUntil: string;
  status: string;
  useType: string;
  allowedDaysOfWeek: number[];
  allowedTimeStart?: string;
  allowedTimeEnd?: string;
  requiresIdVerification: boolean;
  business: {
    id: string;
    name: string;
    category: string;
    state: string;
    city: string;
  };
  assignedUser?: {
    id: string;
    name: string;
    userIdentifier: string;
  };
}

function CouponVerificationContent() {
  const searchParams = useSearchParams();
  const [couponCode, setCouponCode] = useState(searchParams.get("code") || "");
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "invalid"
  >("pending");

  // Redemption form
  const [orderAmount, setOrderAmount] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [idVerified, setIdVerified] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);

  const verifyCoupon = async (code: string) => {
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/coupons/verify?code=${encodeURIComponent(code)}`,
      );
      const data = await response.json();

      if (response.ok) {
        setCoupon(data.coupon);
        setVerificationStatus("verified");
      } else {
        setError(data.error || "Failed to verify coupon");
        setVerificationStatus("invalid");
      }
    } catch (error) {
      console.error("Error verifying coupon:", error);
      setError("Failed to verify coupon");
      setVerificationStatus("invalid");
    } finally {
      setLoading(false);
    }
  };

  const redeemCoupon = async () => {
    if (!coupon) return;

    setRedeeming(true);
    setError(null);

    try {
      const response = await fetch("/api/coupons/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          orderAmount: orderAmount ? parseFloat(orderAmount) : undefined,
          redemptionMethod: "IN_PERSON",
          staffNotes,
          idVerified,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRedemptionSuccess(true);
        // Reset form after successful redemption
        setTimeout(() => {
          setRedemptionSuccess(false);
          setCoupon(null);
          setCouponCode("");
          setOrderAmount("");
          setStaffNotes("");
          setIdVerified(false);
          setVerificationStatus("pending");
        }, 3000);
      } else {
        setError(data.error || "Failed to redeem coupon");
      }
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      setError("Failed to redeem coupon");
    } finally {
      setRedeeming(false);
    }
  };

  const getDayName = (dayNumber: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayNumber];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "USED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "EXPIRED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getTypeLabel = (type: string) => {
    return type === "PERCENTAGE" ? "Percentage Discount" : "Fixed Amount";
  };

  const getUseTypeLabel = (useType: string) => {
    switch (useType) {
      case "SINGLE_USE":
        return "Single Use";
      case "MULTI_USE":
        return "Multiple Use";
      case "ONCE_PER_USER":
        return "Once Per User";
      default:
        return useType;
    }
  };

  useEffect(() => {
    if (couponCode) {
      verifyCoupon(couponCode);
    }
  }, [couponCode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            SnapRate Coupon Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Verify and redeem customer coupons
          </p>
        </div>

        {/* Coupon Code Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Enter Coupon Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter coupon code (e.g., K2X-PL7-YJ9-70BR)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg"
                />
              </div>
              <Button
                onClick={() => verifyCoupon(couponCode)}
                disabled={loading || !couponCode.trim()}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coupon Details */}
        {coupon && verificationStatus === "verified" && (
          <div className="space-y-6">
            {/* Coupon Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Coupon Verified
                  </span>
                  <Badge className={getStatusColor(coupon.status)}>
                    {coupon.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Coupon Title
                    </Label>
                    <p className="text-lg font-semibold">{coupon.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Type
                    </Label>
                    <p>{getTypeLabel(coupon.type)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Value
                    </Label>
                    <p className="text-lg font-semibold text-green-600">
                      {coupon.type === "PERCENTAGE"
                        ? `${coupon.value}%`
                        : formatCurrency(coupon.value)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Use Type
                    </Label>
                    <p>{getUseTypeLabel(coupon.useType)}</p>
                  </div>
                </div>

                {coupon.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Description
                    </Label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {coupon.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Valid From
                    </Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(coupon.validFrom)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Valid Until
                    </Label>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(coupon.validUntil)}
                    </p>
                  </div>
                </div>

                {coupon.minimumOrderAmount && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Minimum Order Amount
                    </Label>
                    <p className="text-lg font-semibold">
                      {formatCurrency(coupon.minimumOrderAmount)}
                    </p>
                  </div>
                )}

                {/* Restrictions */}
                {(coupon.allowedDaysOfWeek.length > 0 ||
                  coupon.allowedTimeStart ||
                  coupon.allowedTimeEnd) && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                      Usage Restrictions
                    </Label>
                    <div className="space-y-2">
                      {coupon.allowedDaysOfWeek.length > 0 && (
                        <p className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Valid on:{" "}
                            {coupon.allowedDaysOfWeek
                              .map(getDayName)
                              .join(", ")}
                          </span>
                        </p>
                      )}
                      {(coupon.allowedTimeStart || coupon.allowedTimeEnd) && (
                        <p className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>
                            Valid time: {coupon.allowedTimeStart || "00:00"} -{" "}
                            {coupon.allowedTimeEnd || "23:59"}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Business Name
                    </Label>
                    <p className="text-lg font-semibold">
                      {coupon.business.name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Category
                    </Label>
                    <p>{coupon.business.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Location
                    </Label>
                    <p>
                      {coupon.business.city}, {coupon.business.state}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            {coupon.assignedUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Customer Name
                      </Label>
                      <p className="text-lg font-semibold">
                        {coupon.assignedUser.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        User ID
                      </Label>
                      <p className="font-mono">
                        {coupon.assignedUser.userIdentifier}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Redemption Form */}
            {coupon.status === "ACTIVE" && (
              <Card>
                <CardHeader>
                  <CardTitle>Redeem Coupon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="orderAmount">Order Amount (₦)</Label>
                      <Input
                        id="orderAmount"
                        type="number"
                        placeholder="0.00"
                        value={orderAmount}
                        onChange={(e) => setOrderAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="staffNotes">Staff Notes (Optional)</Label>
                    <Textarea
                      id="staffNotes"
                      placeholder="Any additional notes about the redemption..."
                      value={staffNotes}
                      onChange={(e) => setStaffNotes(e.target.value)}
                    />
                  </div>

                  {coupon.requiresIdVerification && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="idVerified"
                        checked={idVerified}
                        onChange={(e) => setIdVerified(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="idVerified">
                        Customer ID has been verified
                      </Label>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      onClick={redeemCoupon}
                      disabled={
                        redeeming ||
                        (coupon.requiresIdVerification && !idVerified)
                      }
                      className="flex-1"
                    >
                      {redeeming ? "Redeeming..." : "Redeem Coupon"}
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Download className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>

                  {redemptionSuccess && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-green-800 dark:text-green-200">
                        Coupon redeemed successfully!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CouponVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <CouponVerificationContent />
    </Suspense>
  );
}
