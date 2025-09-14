import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CouponStatus } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: businessId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Verify business exists and is verified
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        address: true,
        city: true,
        state: true,
        logo: true,
        isVerified: true,
        reviewStatus: true,
        addressVerificationStatus: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Only show coupons from verified businesses
    if (!business.isVerified) {
      return NextResponse.json(
        { error: "Business is not verified" },
        { status: 403 },
      );
    }

    // Get available coupons (not assigned to any user)
    const coupons = await prisma.coupon.findMany({
      where: {
        businessId: businessId,
        status: status as CouponStatus,
        assignedUserId: null, // Only show unassigned coupons
        validFrom: { lte: new Date() }, // Valid from date has passed
        validUntil: { gte: new Date() }, // Valid until date hasn't passed
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        value: true,
        minimumOrderAmount: true,
        maximumDiscount: true,
        validFrom: true,
        validUntil: true,
        maxUses: true,
        currentUses: true,
        totalIssued: true,
        totalRedeemed: true,
        useType: true,
        allowedDaysOfWeek: true,
        allowedTimeStart: true,
        allowedTimeEnd: true,
        cannotCombineWithOtherCoupons: true,
        requiresIdVerification: true,
        maxUsesPerUser: true,
        createdAt: true,
      },
      orderBy: [
        { validUntil: "asc" }, // Show expiring soon first
        { createdAt: "desc" }, // Then newest first
      ],
      take: limit,
    });

    // Format the response
    const formattedCoupons = coupons.map((coupon) => ({
      ...coupon,
      validFrom: coupon.validFrom.toISOString(),
      validUntil: coupon.validUntil.toISOString(),
      createdAt: coupon.createdAt.toISOString(),
      // Calculate availability
      isAvailable: coupon.maxUses ? coupon.currentUses < coupon.maxUses : true,
      remainingUses: coupon.maxUses
        ? coupon.maxUses - coupon.currentUses
        : null,
    }));

    return NextResponse.json({
      success: true,
      business: {
        id: business.id,
        name: business.name,
        description: business.description,
        category: business.category,
        address: business.address,
        city: business.city,
        state: business.state,
        logo: business.logo,
      },
      coupons: formattedCoupons,
      totalCount: formattedCoupons.length,
    });
  } catch (error) {
    console.error("Failed to fetch business coupons:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch business coupons",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
