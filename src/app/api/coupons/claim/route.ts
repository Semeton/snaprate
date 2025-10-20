import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CouponService } from "@/services/CouponService";
import { ReviewRequirementService } from "@/services/ReviewRequirementService";

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

    // Get the coupon details
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            isVerified: true,
          },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check if business is verified
    if (!coupon.business.isVerified) {
      return NextResponse.json(
        { error: "Cannot claim coupons from unverified businesses" },
        { status: 403 },
      );
    }

    // Check if coupon is available for claiming
    if (coupon.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Coupon is not active" },
        { status: 400 },
      );
    }

    // For private coupons, check if user has been assigned this coupon
    if (coupon.couponType === "PRIVATE") {
      const userAssignment = await prisma.couponAssignment.findFirst({
        where: {
          couponId: couponId,
          userId: session.user.id,
          status: "ASSIGNED",
        },
      });

      if (!userAssignment) {
        return NextResponse.json(
          { error: "This coupon is not assigned to you" },
          { status: 400 },
        );
      }
    }

    // For public coupons, check if user has already claimed this coupon
    if (coupon.couponType === "PUBLIC") {
      const existingAssignment = await prisma.couponAssignment.findFirst({
        where: {
          couponId: couponId,
          userId: session.user.id,
          status: "ASSIGNED",
        },
      });

      if (existingAssignment) {
        return NextResponse.json(
          { error: "You have already claimed this coupon" },
          { status: 400 },
        );
      }
    }

    // Check if coupon is still valid
    const now = new Date();
    if (coupon.validFrom > now || coupon.validUntil < now) {
      return NextResponse.json(
        { error: "Coupon is not currently valid" },
        { status: 400 },
      );
    }

    // Check if coupon has remaining uses
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json(
        { error: "Coupon has reached maximum usage limit" },
        { status: 400 },
      );
    }

    // Check if user has already claimed this coupon (for single-use coupons)
    if (coupon.useType === "SINGLE_USE") {
      const existingClaim = await prisma.couponRedemption.findFirst({
        where: {
          couponId: couponId,
          userId: session.user.id,
        },
      });

      if (existingClaim) {
        return NextResponse.json(
          { error: "You have already claimed this coupon" },
          { status: 400 },
        );
      }
    }

    // Check if user has reached the maximum uses per user limit
    if (coupon.maxUsesPerUser) {
      const userRedemptions = await prisma.couponRedemption.count({
        where: {
          couponId: couponId,
          userId: session.user.id,
        },
      });

      if (userRedemptions >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          {
            error: `You can only use this coupon ${coupon.maxUsesPerUser} time(s)`,
          },
          { status: 400 },
        );
      }
    }

    // Check if user has reached the 5 active coupons limit
    const activeCouponsCount = await prisma.couponAssignment.count({
      where: {
        userId: session.user.id,
        status: "ASSIGNED",
        expiresAt: { gte: now },
      },
    });

    if (activeCouponsCount >= 5) {
      return NextResponse.json(
        { error: "You can only have 5 active coupons at a time" },
        { status: 400 },
      );
    }

    // Check review requirements
    const reviewCheck = await ReviewRequirementService.canUserClaimCoupon(
      session.user.id,
      coupon.businessId,
      couponId,
    );

    if (!reviewCheck.canClaim) {
      return NextResponse.json({ error: reviewCheck.reason }, { status: 400 });
    }

    // Claim the coupon
    const couponService = new CouponService();
    const result = await couponService.assignCouponToUser({
      couponId,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Coupon claimed successfully",
      coupon: result,
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
