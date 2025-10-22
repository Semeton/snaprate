import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CouponStatus } from "@/types";

interface UserPreferences {
  preferredCategories?: string[];
  preferredLocations?: string[];
  totalClaims?: number;
  totalReviews?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    let userPreferences: UserPreferences = {};

    if (userId) {
      const [claimedCoupons, userReviews] = await Promise.all([
        prisma.coupon.findMany({
          where: { assignedUserId: userId },
          include: {
            business: { select: { category: true, city: true, state: true } },
          },
        }),
        prisma.review.findMany({
          where: { reviewerId: userId },
          include: {
            business: { select: { category: true, city: true, state: true } },
          },
        }),
      ]);

      // Analyze user preferences
      const categories = [...claimedCoupons, ...userReviews]
        .map((item) => item.business.category)
        .filter((category): category is string => category !== null);
      const locations = [...claimedCoupons, ...userReviews].map(
        (item) => `${item.business.city}, ${item.business.state}`,
      );

      userPreferences = {
        preferredCategories: getMostFrequent(categories),
        preferredLocations: getMostFrequent(locations),
        totalClaims: claimedCoupons.length,
        totalReviews: userReviews.length,
      };
    }

    // Build recommendation query
    const whereClause = {
      status: CouponStatus.ACTIVE,
      assignedUserId: null,
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() },
      business: {
        isVerified: true,
      },
    };

    // Get available coupons
    const coupons = await prisma.coupon.findMany({
      where: whereClause,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logo: true,
            city: true,
            state: true,
            category: true,
            latitude: true,
            longitude: true,
            averageRating: true,
            totalReviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate recommendation scores
    const recommendations = coupons.map((coupon) => {
      let score = 0.1; // Base score
      const reasons: string[] = [];

      // Location-based scoring
      if (lat && lng && coupon.business.latitude && coupon.business.longitude) {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          coupon.business.latitude,
          coupon.business.longitude,
        );

        if (distance <= 5) {
          score += 0.3;
          reasons.push("Very close to your location");
        } else if (distance <= 10) {
          score += 0.2;
          reasons.push("Nearby location");
        } else if (distance <= 25) {
          score += 0.1;
          reasons.push("Within reasonable distance");
        }
      }

      // Category preference scoring
      if (
        coupon.business.category &&
        userPreferences.preferredCategories?.includes(coupon.business.category)
      ) {
        score += 0.25;
        reasons.push("Matches your preferred category");
      }

      // Location preference scoring
      const location = `${coupon.business.city}, ${coupon.business.state}`;
      if (userPreferences.preferredLocations?.includes(location)) {
        score += 0.2;
        reasons.push("In your preferred area");
      }

      // Business rating scoring
      if (
        coupon.business.averageRating &&
        coupon.business.averageRating >= 4.0
      ) {
        score += 0.15;
        reasons.push("Highly rated business");
      }

      // Expiration urgency scoring
      const daysUntilExpiry = Math.ceil(
        (new Date(coupon.validUntil).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysUntilExpiry <= 3) {
        score += 0.2;
        reasons.push("Expires soon - limited time offer");
      } else if (daysUntilExpiry <= 7) {
        score += 0.1;
        reasons.push("Expires in a few days");
      }

      // Usage urgency scoring
      if (coupon.maxUses) {
        const usagePercentage = coupon.currentUses / coupon.maxUses;
        if (usagePercentage >= 0.8) {
          score += 0.15;
          reasons.push("Almost fully claimed - act fast");
        } else if (usagePercentage >= 0.5) {
          score += 0.1;
          reasons.push("Popular coupon - limited availability");
        }
      }

      // Value scoring
      if (coupon.type === "PERCENTAGE" && coupon.value >= 20) {
        score += 0.1;
        reasons.push("High percentage discount");
      } else if (coupon.type === "FIXED_AMOUNT" && coupon.value >= 1000) {
        score += 0.1;
        reasons.push("High value discount");
      }

      // Trending/popularity scoring (based on recent claims)
      if (coupon.currentUses > 0) {
        score += Math.min(coupon.currentUses * 0.02, 0.1);
        reasons.push("Popular choice");
      }

      return {
        ...coupon,
        isAvailable: coupon.maxUses
          ? coupon.currentUses < coupon.maxUses
          : true,
        remainingUses: coupon.maxUses
          ? coupon.maxUses - coupon.currentUses
          : null,
        recommendationScore: Math.min(score, 1.0), // Cap at 1.0
        recommendationReason: reasons.join(", ") || "Great deal available",
      };
    });

    // Sort by recommendation score and take top 6
    const topRecommendations = recommendations
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 6);

    return NextResponse.json({
      success: true,
      recommendations: topRecommendations,
      total: topRecommendations.length,
      userPreferences: userId ? userPreferences : null,
    });
  } catch (error) {
    console.error("Failed to fetch coupon recommendations:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Helper function to get most frequent items
function getMostFrequent(items: string[]): string[] {
  const frequency: { [key: string]: number } = {};
  items.forEach((item) => {
    frequency[item] = (frequency[item] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([item]) => item);
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}
