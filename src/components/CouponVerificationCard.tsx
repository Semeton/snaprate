"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Building2,
  CreditCard,
  Download,
  Camera,
  QrCode,
  AlertTriangle,
  Shield,
  Smartphone,
  Monitor,
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
    logo?: string;
    category: string;
    state: string;
    city: string;
    phone?: string;
    email?: string;
  };
  assignedUser?: {
    id: string;
    name: string;
    userIdentifier: string;
    avatar?: string;
  };
}

export default function EnhancedCouponVerificationPage() {
  const searchParams = useSearchParams();
  const [couponCode, setCouponCode] = useState(searchParams.get("code") || "");
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "invalid"
  >("pending");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redemption form
  const [orderAmount, setOrderAmount] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [idVerified, setIdVerified] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-focus input on load
  useEffect(() => {
    if (inputRef.current && !couponCode) {
      inputRef.current.focus();
    }
  }, [couponCode]);

  // Real-time validation
  useEffect(() => {
    const errors: string[] = [];

    if (couponCode) {
      // Check format (basic validation)
      const codePattern =
        /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}(-[A-Z0-9]{4})?$/;
      if (!codePattern.test(couponCode)) {
        errors.push("Invalid coupon code format");
      }

      // Check length
      if (couponCode.length < 9) {
        errors.push("Coupon code too short");
      }
    }

    setValidationErrors(errors);
  }, [couponCode]);

  const verifyCoupon = async (code: string) => {
    if (!code.trim() || validationErrors.length > 0) return;

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
        setError(null);
      } else {
        setError(data.error || "Failed to verify coupon");
        setVerificationStatus("invalid");
        setCoupon(null);
      }
    } catch (error) {
      console.error("Error verifying coupon:", error);
      setError("Network error. Please check your connection and try again.");
      setVerificationStatus("invalid");
      setCoupon(null);
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
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 3000);
      } else {
        setError(data.error || "Failed to redeem coupon");
      }
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      setError("Network error. Please try again.");
    } finally {
      setRedeeming(false);
    }
  };

  const handleQRScan = () => {
    setShowQRScanner(true);
    // TODO: Implement QR scanner
    // For now, just show a placeholder
    setTimeout(() => {
      setShowQRScanner(false);
      alert("QR Scanner would open here. This feature requires camera access.");
    }, 1000);
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

  const isCouponExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const isCouponNotYetValid = (validFrom: string) => {
    return new Date(validFrom) > new Date();
  };

  useEffect(() => {
    if (couponCode && validationErrors.length === 0) {
      const timeoutId = setTimeout(() => {
        verifyCoupon(couponCode);
      }, 500); // Debounce verification
      return () => clearTimeout(timeoutId);
    }
  }, [couponCode, validationErrors]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isMobile ? (
              <Smartphone className="h-6 w-6 text-blue-600" />
            ) : (
              <Monitor className="h-6 w-6 text-blue-600" />
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              SnapRate Coupon Verification
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Verify and redeem customer coupons
          </p>
        </div>

        {/* Coupon Code Input */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Enter Coupon Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Enter coupon code (e.g., K2X-PL7-YJ9-70BR)"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className={`text-center font-mono text-lg ${
                      validationErrors.length > 0 ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {validationErrors.map((error, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => verifyCoupon(couponCode)}
                    disabled={
                      loading ||
                      !couponCode.trim() ||
                      validationErrors.length > 0
                    }
                    className="flex-1 md:flex-none"
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleQRScan}
                    disabled={loading}
                    className="px-3"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Scanner Placeholder */}
              {showQRScanner && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm">QR Scanner would open here</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="mb-4 md:mb-6 border-red-200 dark:border-red-800">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-red-600 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Coupon Details */}
        {coupon && verificationStatus === "verified" && (
          <div className="space-y-4 md:space-y-6">
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
                {/* Validity Warnings */}
                {isCouponExpired(coupon.validUntil) && (
                  <Alert className="border-red-200 dark:border-red-800">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-600 dark:text-red-400">
                      This coupon has expired and cannot be redeemed.
                    </AlertDescription>
                  </Alert>
                )}

                {isCouponNotYetValid(coupon.validFrom) && (
                  <Alert className="border-yellow-200 dark:border-yellow-800">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-yellow-600 dark:text-yellow-400">
                      This coupon is not yet valid.
                    </AlertDescription>
                  </Alert>
                )}

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
                  {coupon.business.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Phone
                      </Label>
                      <p>{coupon.business.phone}</p>
                    </div>
                  )}
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
                  <div className="flex items-center gap-4 mb-4">
                    {coupon.assignedUser.avatar ? (
                      <img
                        src={coupon.assignedUser.avatar}
                        alt={coupon.assignedUser.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-semibold">
                        {coupon.assignedUser.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        ID: {coupon.assignedUser.userIdentifier}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Redemption Form */}
            {coupon.status === "ACTIVE" &&
              !isCouponExpired(coupon.validUntil) &&
              !isCouponNotYetValid(coupon.validFrom) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Redeem Coupon
                    </CardTitle>
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
                          className="text-lg"
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
                        rows={3}
                      />
                    </div>

                    {coupon.requiresIdVerification && (
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <input
                          type="checkbox"
                          id="idVerified"
                          checked={idVerified}
                          onChange={(e) => setIdVerified(e.target.checked)}
                          className="rounded"
                        />
                        <Label
                          htmlFor="idVerified"
                          className="text-blue-700 dark:text-blue-300"
                        >
                          Customer ID has been verified
                        </Label>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-4">
                      <Button
                        onClick={redeemCoupon}
                        disabled={
                          redeeming ||
                          (coupon.requiresIdVerification && !idVerified)
                        }
                        className="flex-1"
                        size="lg"
                      >
                        {redeeming ? "Redeeming..." : "Redeem Coupon"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="flex-1 md:flex-none"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Print Receipt
                      </Button>
                    </div>

                    {redemptionSuccess && (
                      <Alert className="border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription className="text-green-600 dark:text-green-400">
                          Coupon redeemed successfully! The form will reset in a
                          moment.
                        </AlertDescription>
                      </Alert>
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
