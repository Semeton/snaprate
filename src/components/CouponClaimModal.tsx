"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Gift,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Percent,
  ShieldCheck,
  Ban,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  QrCode,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponType, CouponUseType } from "@/types";

interface CouponClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: {
    id: string;
    title: string;
    description?: string;
    baseCode: string;
    type: CouponType;
    value: number;
    minimumOrderAmount?: number;
    maximumDiscount?: number;
    validFrom: string;
    validUntil: string;
    maxUses?: number;
    currentUses: number;
    useType: CouponUseType;
    allowedDaysOfWeek: number[];
    allowedTimeStart?: string;
    allowedTimeEnd?: string;
    cannotCombineWithOtherCoupons: boolean;
    requiresIdVerification: boolean;
    maxUsesPerUser?: number;
    business: {
      id: string;
      name: string;
      logo?: string;
      city?: string;
      state?: string;
    };
  } | null;
  onClaimSuccess?: (couponId: string) => void;
}

const CouponClaimModal: React.FC<CouponClaimModalProps> = ({
  isOpen,
  onClose,
  coupon,
  onClaimSuccess,
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

  const handleClaim = async () => {
    if (!coupon) return;

    setIsClaiming(true);
    setClaimResult(null);

    try {
      const response = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ couponId: coupon.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setClaimResult({
          success: true,
          message: data.message || "Coupon claimed successfully!",
        });
        onClaimSuccess?.(coupon.id);
      } else {
        setClaimResult({
          success: false,
          message: data.error || "Failed to claim coupon",
        });
      }
    } catch (error) {
      setClaimResult({
        success: false,
        message: "An unexpected error occurred",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const getDiscountDisplay = () => {
    if (!coupon) return "";
    if (coupon.type === CouponType.PERCENTAGE) {
      return `${coupon.value}% off`;
    } else {
      return `₦${coupon.value.toLocaleString()} off`;
    }
  };

  const getUseTypeLabel = (useType: CouponUseType) => {
    switch (useType) {
      case CouponUseType.SINGLE_USE:
        return "Single Use";
      case CouponUseType.MULTI_USE:
        return "Multiple Use";
      case CouponUseType.ONCE_PER_USER:
        return "Once Per User";
      default:
        return "Unknown";
    }
  };

  const getDayNames = (dayNumbers: number[]) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayNumbers.map((num) => days[num]).join(", ");
  };

  const handleClose = () => {
    setClaimResult(null);
    onClose();
  };

  const downloadCouponPDF = async () => {
    if (!coupon) return;

    try {
      setDownloadingPDF(true);
      const response = await fetch(`/api/coupons/${coupon.id}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coupon-${coupon.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const generateQRCode = async () => {
    if (!coupon) return;

    try {
      setGeneratingQR(true);
      const response = await fetch(`/api/coupons/${coupon.id}/qr`);

      if (!response.ok) {
        throw new Error("Failed to generate QR code");
      }

      const data = await response.json();

      // Open QR code in new window
      const qrWindow = window.open("", "_blank", "width=400,height=500");
      if (qrWindow) {
        qrWindow.document.write(`
          <html>
            <head><title>Coupon QR Code</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
              <h2>Coupon QR Code</h2>
              <img src="${data.qrCode}" alt="QR Code" style="max-width: 300px; margin: 20px 0;">
              <p><strong>Coupon Code:</strong> ${data.couponCode}</p>
              <p><strong>Verification URL:</strong><br><a href="${data.verificationURL}" target="_blank">${data.verificationURL}</a></p>
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print QR Code</button>
            </body>
          </html>
        `);
        qrWindow.document.close();
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code. Please try again.");
    } finally {
      setGeneratingQR(false);
    }
  };

  if (!coupon) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-blue-600" />
              Claim Coupon
            </DialogTitle>
            <DialogDescription>No coupon selected.</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Please select a coupon to claim.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            Claim Coupon
          </DialogTitle>
          <DialogDescription>
            Review the coupon details before claiming it to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Coupon Details */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {coupon.title}
              </h3>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Available
              </Badge>
            </div>

            {coupon.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {coupon.description}
              </p>
            )}

            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-3">
              {getDiscountDisplay()}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Business:</span>
              <span>{coupon.business.name}</span>
              {coupon.business.city && coupon.business.state && (
                <>
                  <span>•</span>
                  <span>
                    {coupon.business.city}, {coupon.business.state}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Review Requirement Notice */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Review Requirement
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  If this is not your first coupon from this business, you'll
                  need to review the business before claiming this coupon.
                  First-time claims don't require a review.
                </p>
              </div>
            </div>
          </div>

          {/* Coupon Restrictions */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Coupon Details & Restrictions
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Use Type:
                </span>
                <span>{getUseTypeLabel(coupon.useType)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Valid Until:
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(coupon.validUntil)}
                </span>
              </div>

              {coupon.minimumOrderAmount && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Min. Spend:
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {formatCurrency(coupon.minimumOrderAmount)}
                  </span>
                </div>
              )}

              {coupon.maximumDiscount && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Max. Discount:
                  </span>
                  <span className="flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    {formatCurrency(coupon.maximumDiscount)}
                  </span>
                </div>
              )}

              {coupon.maxUsesPerUser && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Max Uses:
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {coupon.maxUsesPerUser} per user
                  </span>
                </div>
              )}

              {coupon.allowedDaysOfWeek.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Valid Days:
                  </span>
                  <span className="text-xs">
                    {getDayNames(coupon.allowedDaysOfWeek)}
                  </span>
                </div>
              )}

              {(coupon.allowedTimeStart || coupon.allowedTimeEnd) && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Valid Times:
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">
                      {coupon.allowedTimeStart || "00:00"} -{" "}
                      {coupon.allowedTimeEnd || "23:59"}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Special Restrictions */}
            <div className="space-y-2">
              {coupon.cannotCombineWithOtherCoupons && (
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Ban className="w-4 h-4" />
                  <span className="text-sm">
                    Cannot combine with other coupons
                  </span>
                </div>
              )}

              {coupon.requiresIdVerification && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm">
                    Requires ID verification at redemption
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Claim Result */}
          {claimResult && (
            <Alert
              className={
                claimResult.success
                  ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                  : "border-red-200 bg-red-50 dark:bg-red-900/20"
              }
            >
              <div className="flex items-center gap-2">
                {claimResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription
                  className={
                    claimResult.success
                      ? "text-green-800 dark:text-green-300"
                      : "text-red-800 dark:text-red-300"
                  }
                >
                  {claimResult.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isClaiming}>
            Cancel
          </Button>

          {/* PDF and QR Code buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadCouponPDF}
              disabled={downloadingPDF || isClaiming}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloadingPDF ? "Generating..." : "PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={generateQRCode}
              disabled={generatingQR || isClaiming}
              size="sm"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {generatingQR ? "Generating..." : "QR"}
            </Button>
          </div>

          <Button
            onClick={handleClaim}
            disabled={isClaiming || claimResult?.success}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isClaiming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : claimResult?.success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Claimed!
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Claim Coupon
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CouponClaimModal;
