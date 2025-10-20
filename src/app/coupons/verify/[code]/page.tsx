"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  Calendar,
  Gift,
  Building2,
  Star,
  AlertCircle,
  Copy,
  QrCode,
} from "lucide-react";
import { Coupon, Business } from "@/types";
import { toast } from "@/components/ui/use-toast";

interface CouponVerificationPageProps {}

export default function CouponVerificationPage({}: CouponVerificationPageProps) {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    message: string;
    canRedeem: boolean;
  } | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  const couponCode = params.code as string;

  useEffect(() => {
    if (couponCode) {
      verifyCoupon();
    }
  }, [couponCode]);

  const verifyCoupon = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/coupons/verify?code=${couponCode}`);
      const data = await response.json();

      if (response.ok) {
        setCoupon(data.coupon);
        setBusiness(data.business);
        setVerificationResult(data.verification);
      } else {
        setError(data.error || "Failed to verify coupon");
        setVerificationResult({
          isValid: false,
          message: data.error || "Invalid coupon",
          canRedeem: false,
        });
      }
    } catch (error) {
      console.error("Error verifying coupon:", error);
      setError("Failed to verify coupon");
      setVerificationResult({
        isValid: false,
        message: "Failed to verify coupon",
        canRedeem: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!session?.user) {
      router.push(`/auth/signin?redirect=/coupons/verify/${couponCode}`);
      return;
    }

    if (!coupon) return;

    try {
      setRedeeming(true);
      const response = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ couponId: coupon.id }),
      });

      if (response.ok) {
        toast({
          title: "Coupon Redeemed!",
          description: "You have successfully redeemed this coupon.",
        });
        // Refresh verification
        verifyCoupon();
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Redeem Coupon",
          description: errorData.error || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to redeem coupon:", error);
      toast({
        title: "Error",
        description: "Failed to redeem coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied!",
      description: "Coupon code has been copied to clipboard.",
    });
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle className="h-8 w-8 text-green-600" />
    ) : (
      <XCircle className="h-8 w-8 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying coupon...</p>
        </div>
      </div>
    );
  }

  if (error && !coupon) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Coupon Not Found
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Verification Status */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {verificationResult && getStatusIcon(verificationResult.isValid)}
            </div>
            <CardTitle
              className={`text-2xl ${getStatusColor(
                verificationResult?.isValid || false,
              )}`}
            >
              {verificationResult?.isValid ? "Valid Coupon" : "Invalid Coupon"}
            </CardTitle>
            <p className="text-gray-600">{verificationResult?.message}</p>
          </CardHeader>
        </Card>

        {coupon && business && (
          <>
            {/* Coupon Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Coupon Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {coupon.title}
                  </h3>
                  {coupon.description && (
                    <p className="text-gray-600 mt-1">{coupon.description}</p>
                  )}
                </div>

                {/* Coupon Value */}
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <div className="text-4xl font-bold text-blue-600">
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
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm text-gray-500">
                          Coupon Code
                        </Label>
                        <p className="font-mono text-xl font-semibold">
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

                {/* Validity Information */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Valid from{" "}
                      {new Date(coupon.validFrom).toLocaleDateString()}
                    </span>
                  </div>
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

                {/* Status Badge */}
                <div className="flex justify-center">
                  <Badge
                    variant="outline"
                    className={
                      coupon.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {coupon.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    {business.logo ? (
                      <img
                        src={business.logo}
                        alt={business.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {business.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>
                        {business.city}, {business.state}
                      </span>
                    </div>
                    {business.averageRating > 0 && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                        <span>{business.averageRating.toFixed(1)}</span>
                        <span className="ml-1">
                          ({business.totalReviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              {verificationResult?.canRedeem && session?.user ? (
                <Button
                  onClick={handleRedeemCoupon}
                  disabled={redeeming}
                  className="w-full"
                  size="lg"
                >
                  {redeeming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Gift className="h-5 w-5 mr-2" />
                      Redeem Coupon
                    </>
                  )}
                </Button>
              ) : !session?.user ? (
                <Button
                  onClick={() =>
                    router.push(
                      `/auth/signin?redirect=/coupons/verify/${couponCode}`,
                    )
                  }
                  className="w-full"
                  size="lg"
                >
                  Sign In to Redeem
                </Button>
              ) : (
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600">
                    This coupon cannot be redeemed at this time.
                  </p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/businesses/${business.id}`)}
                  className="flex-1"
                >
                  View Business
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/businesses/${business.id}/coupons`)
                  }
                  className="flex-1"
                >
                  More Coupons
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
