"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  MapPin,
  Clock,
  Calendar,
  Users,
  Search,
  Gift,
  CreditCard,
  Download,
  QrCode,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponStatus, CouponType, CouponUseType } from "@/types";
import Image from "next/image";
import Link from "next/link";
import CouponClaimModal from "@/components/CouponClaimModal";
import PublicNavigation from "@/components/PublicNavigation";

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

interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
}

export default function BusinessCouponsPage() {
  const params = useParams();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [coupons, setCoupons] = useState<BusinessCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<
    | (BusinessCoupon & {
        business: {
          id: string;
          name: string;
          logo?: string;
          city: string;
          state: string;
        };
      })
    | null
  >(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  useEffect(() => {
    fetchBusinessCoupons();
  }, [businessId]);

  const fetchBusinessCoupons = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/businesses/${businessId}/coupons`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch coupons");
      }

      const data = await response.json();
      setBusiness(data.business);
      setCoupons(data.coupons);
    } catch (error) {
      console.error("Failed to fetch business coupons:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch coupons",
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

  const handleClaimCoupon = (coupon: BusinessCoupon) => {
    // Add business information to the coupon for the modal
    const couponWithBusiness = {
      ...coupon,
      business: {
        id: business.id,
        name: business.name,
        logo: business.logo,
        city: business.city,
        state: business.state,
      },
    };
    setSelectedCoupon(couponWithBusiness);
    setIsClaimModalOpen(true);
  };

  const handleClaimSuccess = (couponId: string) => {
    // Update the coupon in the list to reflect it's been claimed
    setCoupons((prevCoupons) =>
      prevCoupons.map((coupon) =>
        coupon.id === couponId ? { ...coupon, isAvailable: false } : coupon,
      ),
    );
    setIsClaimModalOpen(false);
    setSelectedCoupon(null);
  };

  const handleCloseClaimModal = () => {
    setIsClaimModalOpen(false);
    setSelectedCoupon(null);
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
                Loading coupons...
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
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Coupons
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={fetchBusinessCoupons}>Try Again</Button>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Business Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              The business you're looking for doesn't exist or is not verified.
            </p>
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
            href="/businesses"
            className="hover:text-gray-700 dark:hover:text-gray-300"
          >
            Businesses
          </Link>
          <span>/</span>
          <Link
            href={`/businesses/${businessId}`}
            className="hover:text-gray-700 dark:hover:text-gray-300"
          >
            {business.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium">
            Coupons
          </span>
        </nav>

        {/* Business Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-4 mb-4">
            {business.logo && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {business.name}
              </h1>
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
              <div className="mt-4">
                <Link href={`/businesses/${businessId}`}>
                  <Button variant="outline" size="sm">
                    <Building2 className="w-4 h-4 mr-2" />
                    View Business Details
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Coupons Grid */}
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? "No coupons found" : "No coupons available"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm
                ? "Try adjusting your search terms"
                : "This business doesn't have any available coupons at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCoupons.map((coupon) => (
              <Card key={coupon.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                        <span>{getDayNames(coupon.allowedDaysOfWeek)}</span>
                      </div>
                    )}

                    {(coupon.allowedTimeStart || coupon.allowedTimeEnd) && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Valid Times:
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
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
                        <span className="text-xs">
                          ID verification required
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t space-y-2">
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handleClaimCoupon(coupon)}
                      disabled={!coupon.isAvailable}
                    >
                      <Gift className="w-3 h-3 mr-1" />
                      {coupon.isAvailable ? "Claim Coupon" : "Already Claimed"}
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <QrCode className="w-3 h-3 mr-1" />
                        QR
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back to Business */}
        <div className="mt-8 text-center">
          <Link href={`/businesses/${businessId}`}>
            <Button variant="outline">
              <Building2 className="w-4 h-4 mr-2" />
              View Business Profile
            </Button>
          </Link>
        </div>

        {/* Coupon Claim Modal */}
        <CouponClaimModal
          isOpen={isClaimModalOpen}
          onClose={handleCloseClaimModal}
          coupon={selectedCoupon}
          onClaimSuccess={handleClaimSuccess}
        />
      </div>
    </div>
  );
}
