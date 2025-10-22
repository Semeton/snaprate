import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CouponStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radius = parseFloat(searchParams.get("radius") || "10"); // Default 10km
    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "distance";

    // Build base query
    const whereClause = {
      status: CouponStatus.ACTIVE,
      // assignedUserId: null, // Only unassigned coupons
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() },
      business:
        category !== "all"
          ? {
              category: category,
              isVerified: true,
            }
          : {
              isVerified: true,
            },
    };

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
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let couponsWithDistance = coupons.map((coupon) => {
      let distance: number | undefined;

      if (lat && lng && coupon.business.latitude && coupon.business.longitude) {
        distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          coupon.business.latitude,
          coupon.business.longitude,
        );
      }

      return {
        ...coupon,
        business: {
          ...coupon.business,
          distance,
        },
        isAvailable: coupon.maxUses
          ? coupon.currentUses < coupon.maxUses
          : true,
        remainingUses: coupon.maxUses
          ? coupon.maxUses - coupon.currentUses
          : null,
      };
    });

    // Filter by radius if location is provided
    if (lat && lng) {
      couponsWithDistance = couponsWithDistance.filter(
        (coupon) =>
          !coupon.business.distance || coupon.business.distance <= radius,
      );
    }

    // Sort results
    switch (sort) {
      case "distance":
        couponsWithDistance.sort((a, b) => {
          if (!a.business.distance && !b.business.distance) return 0;
          if (!a.business.distance) return 1;
          if (!b.business.distance) return -1;
          return a.business.distance - b.business.distance;
        });
        break;
      case "newest":
        couponsWithDistance.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "expiring":
        couponsWithDistance.sort(
          (a, b) =>
            new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime(),
        );
        break;
      case "value":
        couponsWithDistance.sort((a, b) => {
          // Sort by discount value (higher is better)
          const aValue = a.type === "PERCENTAGE" ? a.value : a.value / 1000; // Normalize fixed amounts
          const bValue = b.type === "PERCENTAGE" ? b.value : b.value / 1000;
          return bValue - aValue;
        });
        break;
    }

    return NextResponse.json({
      success: true,
      coupons: couponsWithDistance,
      total: couponsWithDistance.length,
      filters: {
        location:
          lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
        radius,
        category,
        sort,
      },
    });
  } catch (error) {
    console.error("Failed to fetch coupons for discovery:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch coupons",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
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
