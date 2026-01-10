"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gift,
  Search,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Building2,
  MapPin,
  Download,
  QrCode,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { CouponType, CouponUseType } from "@/types";
import Image from "next/image";

interface CouponCatalogProps {
  business: {
    id: string;
    name: string;
    description?: string;
    category: string;
    address: string;
    city: string;
    state: string;
    logo?: string;
  };
  coupons: BusinessCoupon[];
  onClaimCoupon?: (couponId: string) => void;
  onDownloadPDF?: (couponId: string) => void;
  onGenerateQR?: (couponId: string) => void;
  loading?: boolean;
}

interface BusinessCoupon {
  id: string;
  title: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: string;
  validUntil: string;
  maxUses?: number;
  currentUses: number;
  totalIssued: number;
  totalRedeemed: number;
  useType: CouponUseType;
  allowedDaysOfWeek: number[];
  allowedTimeStart?: string;
  allowedTimeEnd?: string;
  cannotCombineWithOtherCoupons: boolean;
  requiresIdVerification: boolean;
  maxUsesPerUser?: number;
  createdAt: string;
  isAvailable: boolean;
  remainingUses?: number;
}

export default function CouponCatalog({
  business,
  coupons,
  onClaimCoupon,
  onDownloadPDF,
  onGenerateQR,
  loading = false,
}: CouponCatalogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && coupon.isAvailable) ||
      (statusFilter === "unavailable" && !coupon.isAvailable);

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "percentage" && coupon.type === CouponType.PERCENTAGE) ||
      (typeFilter === "fixed" && coupon.type === CouponType.FIXED_AMOUNT);

    return matchesSearch && matchesStatus && matchesType;
  });

  const getCouponTypeLabel = (type: CouponType) => {
    return type === CouponType.PERCENTAGE ? "Percentage" : "Fixed Amount";
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

  const getDiscountDisplay = (coupon: BusinessCoupon) => {
    if (coupon.type === CouponType.PERCENTAGE) {
      return `${coupon.value}% off`;
    } else {
      return `₦${coupon.value.toLocaleString()} off`;
    }
  };

  const getStatusColor = (coupon: BusinessCoupon) => {
    if (!coupon.isAvailable)
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    if (coupon.remainingUses && coupon.remainingUses <= 5)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  };

  const getStatusText = (coupon: BusinessCoupon) => {
    if (!coupon.isAvailable) return "Unavailable";
    if (coupon.remainingUses && coupon.remainingUses <= 5) return "Limited";
    return "Available";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
        <div className="flex items-start space-x-4">
          {business.logo && (
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <Image
                src={business.logo}
                alt={business.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {business.name}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <div className="flex items-center space-x-1">
                <Building2 className="w-4 h-4" />
                <span>{business.category}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {business.city}, {business.state}
                </span>
              </div>
            </div>
            {business.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {business.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCoupons.length} of {coupons.length} coupons
        </p>
        {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Coupons Grid */}
      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all"
              ? "No coupons found"
              : "No coupons available"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "This business doesn't have any available coupons at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => (
            <Card
              key={coupon.id}
              className="relative hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 line-clamp-2">
                      {coupon.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getStatusColor(coupon)}>
                        {getStatusText(coupon)}
                      </Badge>
                      <Badge variant="outline">
                        {getCouponTypeLabel(coupon.type)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {getDiscountDisplay(coupon)}
                    </div>
                    {coupon.minimumOrderAmount && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Min: ₦{coupon.minimumOrderAmount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {coupon.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {coupon.description}
                  </p>
                )}

                {/* Coupon Details */}
                <div className="space-y-2 text-sm">
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
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(coupon.validUntil)}</span>
                    </span>
                  </div>

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
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">
                          {coupon.allowedTimeStart || "00:00"} -{" "}
                          {coupon.allowedTimeEnd || "23:59"}
                        </span>
                      </span>
                    </div>
                  )}

                  {coupon.remainingUses && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Remaining:
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{coupon.remainingUses} uses</span>
                      </span>
                    </div>
                  )}

                  {coupon.requiresIdVerification && (
                    <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                      <CheckCircle className="w-3 h-3" />
                      <span className="text-xs">ID verification required</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t space-y-2">
                  {onClaimCoupon && (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => onClaimCoupon(coupon.id)}
                      disabled={!coupon.isAvailable}
                    >
                      {coupon.isAvailable ? "Claim Coupon" : "Unavailable"}
                    </Button>
                  )}
                  <div className="flex space-x-2">
                    {onDownloadPDF && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onDownloadPDF(coupon.id)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                    )}
                    {onGenerateQR && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onGenerateQR(coupon.id)}
                      >
                        <QrCode className="w-3 h-3 mr-1" />
                        QR
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
