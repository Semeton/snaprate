"use client";

import React, { useState, useEffect } from "react";
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
  MapPin,
  Search,
  Filter,
  Gift,
  Clock,
  Calendar,
  Users,
  Building2,
  Star,
  Heart,
  Navigation,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponType, CouponUseType } from "@/types";
import CouponClaimModal from "@/components/CouponClaimModal";

interface BusinessCoupon {
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
    city: string;
    state: string;
    category: string;
    address: string;
    distance?: number; // Distance in km
  };
  isAvailable: boolean;
  remainingUses?: number;
}

interface CouponDiscoveryProps {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  onClaimCoupon?: (couponId: string) => void;
}

const CouponDiscovery: React.FC<CouponDiscoveryProps> = ({
  userLocation,
  onClaimCoupon,
}) => {
  const [coupons, setCoupons] = useState<BusinessCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("nearby");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("distance");
  const [selectedCoupon, setSelectedCoupon] = useState<BusinessCoupon | null>(
    null,
  );
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Mock categories - in real app, this would come from API
  const categories = [
    "all",
    "RESTAURANT",
    "RETAIL",
    "SERVICE",
    "ENTERTAINMENT",
    "HEALTHCARE",
    "EDUCATION",
    "AUTOMOTIVE",
    "BEAUTY",
    "FITNESS",
  ];

  useEffect(() => {
    fetchCoupons();
  }, [locationFilter, categoryFilter, sortBy]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (userLocation) {
        params.append("lat", userLocation.latitude.toString());
        params.append("lng", userLocation.longitude.toString());
      }
      params.append("radius", "10"); // 10km radius
      params.append("category", categoryFilter);
      params.append("sort", sortBy);

      const response = await fetch(`/api/coupons/discover?${params}`);

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

  const handleClaimCoupon = (coupon: BusinessCoupon) => {
    setSelectedCoupon(coupon);
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
    onClaimCoupon?.(couponId);
  };

  const handleCloseClaimModal = () => {
    setIsClaimModalOpen(false);
    setSelectedCoupon(null);
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.business.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getDiscountDisplay = (coupon: BusinessCoupon) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Discover Coupons Near You
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Find amazing deals from businesses in your area
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Location Filter */}
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nearby">Nearby (10km)</SelectItem>
              <SelectItem value="city">Same City</SelectItem>
              <SelectItem value="state">Same State</SelectItem>
              <SelectItem value="all">All Locations</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="value">Best Value</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Refresh Button */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={fetchCoupons}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Finding coupons near you...
          </p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
          <Button onClick={fetchCoupons} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No coupons found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria or location
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
                        {coupon.type === CouponType.PERCENTAGE
                          ? "Percentage"
                          : "Fixed"}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {coupon.description}
                  </p>
                )}

                {/* Business Info */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {coupon.business.logo && (
                    <img
                      src={coupon.business.logo}
                      alt={coupon.business.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {coupon.business.name}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {coupon.business.city}, {coupon.business.state}
                      </span>
                      {coupon.business.distance && (
                        <>
                          <span>•</span>
                          <span>{coupon.business.distance.toFixed(1)}km</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

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
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        window.open(
                          `/businesses/${coupon.business.id}`,
                          "_blank",
                        )
                      }
                    >
                      <Building2 className="w-3 h-3 mr-1" />
                      View Business
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        // TODO: Implement navigation
                        if (coupon.business.address) {
                          const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
                            coupon.business.address,
                          )}`;
                          window.open(mapsUrl, "_blank");
                        }
                      }}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Coupon Claim Modal */}
      <CouponClaimModal
        isOpen={isClaimModalOpen}
        onClose={handleCloseClaimModal}
        coupon={selectedCoupon}
        onClaimSuccess={handleClaimSuccess}
      />
    </div>
  );
};

export default CouponDiscovery;
