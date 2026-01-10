"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { UserRole, CouponType } from "@/types";
import {
  Gift,
  Download,
  QrCode,
  Copy,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface UserCoupon {
  id: string;
  title: string;
  description?: string;
  baseCode: string;
  userSpecificCode?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: string;
  validUntil: string;
  status: string; // Coupon status (ACTIVE, EXPIRED, etc.)
  assignmentStatus?: string; // Assignment status (ASSIGNED, REDEEMED, EXPIRED, CANCELLED)
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
    address: string;
  };
  createdAt: string;
}

export default function UserCouponsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.REVIEWER, UserRole.AGENT]}>
      <UserCouponsContent />
    </ProtectedRoute>
  );
}

function UserCouponsContent() {
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);

  useEffect(() => {
    fetchUserCoupons();
  }, []);

  const fetchUserCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/coupons");

      if (!response.ok) {
        throw new Error("Failed to fetch coupons");
      }

      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch coupons",
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadCouponPDF = async (couponId: string) => {
    try {
      setDownloadingPDF(couponId);
      const response = await fetch(`/api/coupons/${couponId}/pdf`);

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coupon-${couponId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPDF(null);
    }
  };

  const generateQRCode = async (couponId: string) => {
    try {
      setGeneratingQR(couponId);
      const response = await fetch(`/api/coupons/${couponId}/qr`);

      if (!response.ok) {
        throw new Error("Failed to generate QR code");
      }

      const data = await response.json();

      // Open QR code in new window
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Coupon QR Code</title></head>
            <body style="margin: 0; padding: 20px; text-align: center; font-family: Arial, sans-serif;">
              <h2>Coupon QR Code</h2>
              <img src="${data.qrCode}" alt="QR Code" style="max-width: 300px; margin: 20px 0;">
              <p><strong>Coupon Code:</strong> ${data.couponCode}</p>
              <p><strong>Verification URL:</strong> ${data.verificationURL}</p>
              <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print QR Code</button>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      alert("Failed to generate QR code. Please try again.");
    } finally {
      setGeneratingQR(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "REDEEMED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "EXPIRED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  const getTypeLabel = (type: CouponType) => {
    return type === "PERCENTAGE" ? "Percentage" : "Fixed Amount";
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

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coupon.userSpecificCode || coupon.baseCode)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || coupon.assignmentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading your coupons...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  My Coupons
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View and manage your assigned coupons
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {coupons.length} coupon{coupons.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
            <p className="font-medium">Error loading coupons:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="REDEEMED">Redeemed</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Coupons List */}
        <div className="space-y-6">
          {filteredCoupons.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchTerm || statusFilter !== "all"
                    ? "No coupons found"
                    : "No coupons yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "You haven't been assigned any coupons yet. Keep reviewing businesses to earn coupons!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCoupons.map((coupon) => (
              <Card key={coupon.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {coupon.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {coupon.business.name} • {getTypeLabel(coupon.type)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={getStatusColor(
                        coupon.assignmentStatus || coupon.status,
                      )}
                    >
                      {coupon.assignmentStatus || coupon.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Coupon Details */}
                    <div className="space-y-4">
                      {coupon.description && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Description
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {coupon.description}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Discount Value
                          </h4>
                          <p className="text-2xl font-bold text-green-600">
                            {coupon.type === "PERCENTAGE"
                              ? `${coupon.value}% off`
                              : formatCurrency(coupon.value)}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Use Type
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {getUseTypeLabel(coupon.useType)}
                          </p>
                        </div>
                      </div>

                      {coupon.minimumOrderAmount && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Minimum Order
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            {formatCurrency(coupon.minimumOrderAmount)}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Valid From
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(coupon.validFrom)}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Valid Until
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(coupon.validUntil)}
                          </p>
                        </div>
                      </div>

                      {/* Restrictions */}
                      {(coupon.allowedDaysOfWeek.length > 0 ||
                        coupon.allowedTimeStart ||
                        coupon.allowedTimeEnd) && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                            Usage Restrictions
                          </h4>
                          <div className="space-y-2">
                            {coupon.allowedDaysOfWeek.length > 0 && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Valid on:{" "}
                                {coupon.allowedDaysOfWeek
                                  .map(getDayName)
                                  .join(", ")}
                              </p>
                            )}
                            {(coupon.allowedTimeStart ||
                              coupon.allowedTimeEnd) && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                Valid time: {coupon.allowedTimeStart ||
                                  "00:00"}{" "}
                                - {coupon.allowedTimeEnd || "23:59"}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {coupon.requiresIdVerification && (
                        <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ID verification required for redemption
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Business Info & Actions */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Business Information
                        </h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {coupon.business.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {coupon.business.category}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {coupon.business.city}, {coupon.business.state}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Coupon Code
                        </h4>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm font-mono">
                            {coupon.userSpecificCode || coupon.baseCode}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                coupon.userSpecificCode || coupon.baseCode,
                              )
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => downloadCouponPDF(coupon.id)}
                          disabled={downloadingPDF === coupon.id}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {downloadingPDF === coupon.id
                            ? "Generating PDF..."
                            : "Download PDF"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => generateQRCode(coupon.id)}
                          disabled={generatingQR === coupon.id}
                          className="w-full"
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          {generatingQR === coupon.id
                            ? "Generating QR..."
                            : "View QR Code"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
