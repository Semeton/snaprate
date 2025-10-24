import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CouponService } from "@/services/CouponService";
import { CouponCreationData, CouponStatus, CouponVisibility } from "@/types";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only business owners can create coupons
    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can create coupons" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      value,
      minimumOrderAmount,
      maximumDiscount,
      maxUses,
      validFrom,
      validUntil,
      useType,
      couponType,
      requiresReview,
      allowedDaysOfWeek,
      allowedTimeStart,
      allowedTimeEnd,
      cannotCombineWithOtherCoupons,
      requiresIdVerification,
      maxUsesPerUser,
    } = body;

    // Validate required fields
    if (!title || !type || !value || !validFrom || !validUntil) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const couponData: CouponCreationData = {
      businessId: business.id,
      title,
      description,
      type,
      value: parseFloat(value),
      minimumOrderAmount: minimumOrderAmount
        ? parseFloat(minimumOrderAmount)
        : undefined,
      maximumDiscount: maximumDiscount
        ? parseFloat(maximumDiscount)
        : undefined,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      useType,
      couponType: (couponType as CouponVisibility) || CouponVisibility.PUBLIC,
      requiresReview: requiresReview || false,
      allowedDaysOfWeek,
      allowedTimeStart,
      allowedTimeEnd,
      cannotCombineWithOtherCoupons,
      requiresIdVerification,
      maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser) : undefined,
    };

    const couponService = new CouponService();
    const coupon = await couponService.createCoupon(couponData);

    return NextResponse.json({
      success: true,
      coupon,
      message: "Coupon created successfully",
    });
  } catch (error) {
    console.error("Failed to create coupon:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create coupon",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const couponService = new CouponService();

    if (session.user.role === "BUSINESS_OWNER") {
      // Business owner gets their business coupons
      const business = await prisma.business.findUnique({
        where: { ownerId: session.user.id },
      });

      if (!business) {
        return NextResponse.json(
          { error: "Business not found" },
          { status: 404 },
        );
      }

      const result = await couponService.getBusinessCoupons(business.id, {
        page,
        limit,
        status: status as CouponStatus | undefined,
      });

      return NextResponse.json(result);
    } else if (
      session.user.role === "REVIEWER" ||
      session.user.role === "AGENT"
    ) {
      // Reviewers and agents get their assigned coupons
      const coupons = await couponService.getUserCoupons(session.user.id);
      return NextResponse.json({ coupons });
    } else {
      return NextResponse.json(
        { error: "Invalid role for coupon access" },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error("Failed to fetch coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}
