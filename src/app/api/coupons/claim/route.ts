import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CouponService } from "@/services/CouponService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { couponId } = await request.json();

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 },
      );
    }

    // Get the coupon details to determine business ID
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: {
        id: true,
        businessId: true,
        visibility: true,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check if coupon is public (only public coupons can be claimed)
    if (coupon.visibility !== "PUBLIC") {
      return NextResponse.json(
        { error: "This coupon is not available for public claiming" },
        { status: 403 },
      );
    }

    // Check if user has reached the 5 active coupons limit
    const now = new Date();
    const activeCouponsCount = await prisma.couponClaim.count({
      where: {
        userId: session.user.id,
        claimedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
    });

    if (activeCouponsCount >= 5) {
      return NextResponse.json(
        { error: "You can only have 5 active coupons at a time" },
        { status: 400 },
      );
    }

    // Use the new claim logic
    const couponService = new CouponService();
    const result = await couponService.claimPublicCoupon({
      couponId,
      userId: session.user.id,
      businessId: coupon.businessId,
      requiresReview: false, // Will be determined by the service
    });

    return NextResponse.json({
      success: true,
      message: "Coupon claimed successfully",
      claim: result,
    });
  } catch (error) {
    console.error("Failed to claim coupon:", error);
    return NextResponse.json(
      {
        error: "Failed to claim coupon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
