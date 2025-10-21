"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Star,
  TrendingUp,
  Clock,
  MapPin,
  Building2,
  Heart,
  Eye,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CouponType, CouponUseType } from "@/types";
import CouponClaimModal from "@/components/CouponClaimModal";

interface RecommendedCoupon {
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
    averageRating?: number;
    totalReviews?: number;
  };
  isAvailable: boolean;
  remainingUses?: number;
  recommendationReason: string;
  recommendationScore: number;
}

interface CouponRecommendationsProps {
  userId?: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  onClaimCoupon?: (couponId: string) => void;
}

const CouponRecommendations: React.FC<CouponRecommendationsProps> = ({
  userId,
  userLocation,
  onClaimCoupon,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendedCoupon[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] =
    useState<RecommendedCoupon | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [userId, userLocation]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      if (userLocation) {
        params.append("lat", userLocation.latitude.toString());
        params.append("lng", userLocation.longitude.toString());
      }

      const response = await fetch(`/api/coupons/recommendations?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch recommendations",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCoupon = (coupon: RecommendedCoupon) => {
    setSelectedCoupon(coupon);
    setIsClaimModalOpen(true);
  };

  const handleClaimSuccess = (couponId: string) => {
    setRecommendations((prevRecommendations) =>
      prevRecommendations.map((coupon) =>
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

  const getDiscountDisplay = (coupon: RecommendedCoupon) => {
    if (coupon.type === CouponType.PERCENTAGE) {
      return `${coupon.value}% off`;
    } else {
      return `₦${coupon.value.toLocaleString()} off`;
    }
  };

  const getRecommendationIcon = (reason: string) => {
    if (reason.includes("trending") || reason.includes("popular")) {
      return <TrendingUp className="w-4 h-4" />;
    } else if (reason.includes("nearby") || reason.includes("location")) {
      return <MapPin className="w-4 h-4" />;
    } else if (reason.includes("expiring") || reason.includes("limited")) {
      return <Clock className="w-4 h-4" />;
    } else if (reason.includes("rating") || reason.includes("review")) {
      return <Star className="w-4 h-4" />;
    }
    return <Gift className="w-4 h-4" />;
  };

  const getRecommendationColor = (score: number) => {
    if (score >= 0.8)
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (score >= 0.6)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    if (score >= 0.4)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recommended for You
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recommended for You
        </h3>
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <Button onClick={fetchRecommendations} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recommended for You
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Gift className="h-12 w-12 mx-auto mb-4" />
          <p>No recommendations available at the moment.</p>
          <p className="text-sm">Check back later for personalized deals!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recommended for You
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((coupon) => (
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
                    <Badge
                      className={getRecommendationColor(
                        coupon.recommendationScore,
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {getRecommendationIcon(coupon.recommendationReason)}
                        <span className="text-xs">
                          {Math.round(coupon.recommendationScore * 100)}% match
                        </span>
                      </div>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {coupon.type === CouponType.PERCENTAGE
                        ? "Percentage"
                        : "Fixed"}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
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

              {/* Recommendation Reason */}
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Why we recommend this:</strong>{" "}
                  {coupon.recommendationReason}
                </p>
              </div>

              {/* Business Info */}
              <div className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {coupon.business.logo && (
                  <img
                    src={coupon.business.logo}
                    alt={coupon.business.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {coupon.business.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">
                      {coupon.business.city}, {coupon.business.state}
                    </span>
                    {coupon.business.averageRating && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>
                            {coupon.business.averageRating.toFixed(1)}
                          </span>
                          <span>({coupon.business.totalReviews})</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Details */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Expires:
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(coupon.validUntil)}</span>
                  </span>
                </div>
                {coupon.remainingUses && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Remaining:
                    </span>
                    <span>{coupon.remainingUses} uses</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t space-y-2">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => handleClaimCoupon(coupon)}
                  disabled={!coupon.isAvailable}
                >
                  <Gift className="w-3 h-3 mr-1" />
                  {coupon.isAvailable ? "Claim Now" : "Already Claimed"}
                </Button>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      window.open(`/businesses/${coupon.business.id}`, "_blank")
                    }
                  >
                    <Building2 className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      // TODO: Implement favorites
                      console.log("Add to favorites:", coupon.id);
                    }}
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

export default CouponRecommendations;
