import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can access analytics" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days")
      ? parseInt(searchParams.get("days")!)
      : 30;

    // Get the user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Get basic analytics data
    const analytics = {
      totalVisits: business.totalVisits || 0,
      totalReviews: business.totalReviews || 0,
      averageRating: business.averageRating || 0,
      activeCoupons: 0, // Will be calculated below
      totalRevenue: 0, // Will be calculated below
      monthlyGrowth: 0, // Will be calculated below
      topPerformingCoupons: [],
      customerDemographics: [],
      peakHours: [],
      monthlyTrends: [],
    };

    // Get active coupons count
    const activeCoupons = await prisma.coupon.count({
      where: {
        businessId: business.id,
        status: "ACTIVE",
        validUntil: { gte: new Date() },
      },
    });
    analytics.activeCoupons = activeCoupons;

    // Get total revenue from coupon redemptions
    const totalRevenue = await prisma.couponRedemption.aggregate({
      where: {
        coupon: {
          businessId: business.id,
        },
      },
      _sum: {
        discountApplied: true,
      },
    });
    analytics.totalRevenue = totalRevenue._sum.discountApplied || 0;

    return NextResponse.json({ analytics });
  } catch (error) {
    logger.error("Failed to get analytics", { error });
    return NextResponse.json(
      {
        error: "Failed to get analytics",
      },
      { status: 500 },
    );
  }
}
