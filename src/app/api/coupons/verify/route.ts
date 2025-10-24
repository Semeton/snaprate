import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 },
      );
    }

    // First, find the coupon assignment by user-specific code (both assigned and redeemed)
    const assignment = await prisma.couponAssignment.findFirst({
      where: {
        userSpecificCode: code,
        status: { in: ["ASSIGNED", "REDEEMED"] },
      },
      include: {
        coupon: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                logo: true,
                city: true,
                state: true,
                averageRating: true,
                totalReviews: true,
                isVerified: true,
                ownerId: true,
              },
            },
            _count: {
              select: {
                redemptions: true,
                assignments: true,
              },
            },
          },
        },
      },
    });

    let coupon = assignment?.coupon || null;
    if (!coupon) {
      coupon = await prisma.coupon.findFirst({
        where: {
          baseCode: code,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              logo: true,
              city: true,
              state: true,
              averageRating: true,
              totalReviews: true,
              isVerified: true,
              ownerId: true,
            },
          },
          _count: {
            select: {
              redemptions: true,
              assignments: true,
            },
          },
        },
      });
      if (!coupon) {
        return NextResponse.json(
          { error: "Coupon not found" },
          { status: 404 },
        );
      }
    }

    // Check if business is verified
    if (!coupon.business.isVerified) {
      return NextResponse.json(
        {
          error: "Cannot verify coupons from unverified businesses",
          verification: {
            isValid: false,
            message: "This business is not verified",
            canRedeem: false,
          },
        },
        { status: 403 },
      );
    }

    // Check coupon validity
    const now = new Date();
    const isExpired = coupon.validUntil < now;
    const isNotYetValid = coupon.validFrom > now;
    const isActive = coupon.status === "ACTIVE";
    const hasReachedMaxUses =
      coupon.maxUses && (coupon.currentUses || 0) >= coupon.maxUses;
    const isRedeemed = assignment?.status === "REDEEMED";

    let isValid = true;
    let message = "Coupon is valid";
    let canRedeem = true;

    if (isRedeemed) {
      isValid = true; // Still valid to view, just can't redeem again
      message = "This coupon has been redeemed";
      canRedeem = false;
    } else if (isExpired) {
      isValid = false;
      message = "This coupon has expired";
      canRedeem = false;
    } else if (isNotYetValid) {
      isValid = false;
      message = "This coupon is not yet valid";
      canRedeem = false;
    } else if (!isActive) {
      isValid = false;
      message = "This coupon is not active";
      canRedeem = false;
    } else if (hasReachedMaxUses) {
      isValid = false;
      message = "This coupon has reached its maximum usage limit";
      canRedeem = false;
    }

    // Update coupon status if expired
    if (isExpired && coupon.status === "ACTIVE") {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: "EXPIRED" },
      });
    }

    // Get user information if coupon is assigned
    let userInfo = null;
    if (assignment?.userId) {
      const user = await prisma.user.findUnique({
        where: { id: assignment.userId },
        select: {
          id: true,
          name: true,
          email: true,
          userIdentifier: true,
          phone: true,
        },
      });
      userInfo = user;
    }

    return NextResponse.json({
      success: true,
      coupon: {
        ...coupon,
        currentUses: coupon._count.redemptions,
        totalAssignments: coupon._count.assignments,
      },
      business: coupon.business,
      assignment: assignment
        ? {
            id: assignment.id,
            userId: assignment.userId,
            userSpecificCode: assignment.userSpecificCode,
            status: assignment.status,
            assignedAt: assignment.assignedAt,
          }
        : null,
      user: userInfo,
      verification: {
        isValid,
        message,
        canRedeem,
      },
    });
  } catch (error) {
    logger.error("Failed to verify coupon", {
      error: error instanceof Error ? error.message : error,
      code: request.nextUrl.searchParams.get("code"),
    });
    return NextResponse.json(
      {
        error: "Failed to verify coupon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      orderAmount,
      redemptionMethod = "IN_PERSON",
      staffNotes,
      idVerified = false,
    } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 },
      );
    }

    // First, find the coupon assignment by user-specific code (only assigned for redemption)
    const assignment = await prisma.couponAssignment.findFirst({
      where: {
        userSpecificCode: code,
        status: "ASSIGNED",
      },
      include: {
        coupon: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                isVerified: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Coupon assignment not found" },
        { status: 404 },
      );
    }

    const coupon = assignment.coupon;

    // Check if business is verified
    if (!coupon.business.isVerified) {
      return NextResponse.json(
        {
          error: "Cannot redeem coupons from unverified businesses",
        },
        { status: 403 },
      );
    }

    // Check coupon validity
    const now = new Date();
    const isExpired = coupon.validUntil < now;
    const isNotYetValid = coupon.validFrom > now;
    const isActive = coupon.status === "ACTIVE";
    const hasReachedMaxUses =
      coupon.maxUses && (coupon.currentUses || 0) >= coupon.maxUses;

    if (isExpired || isNotYetValid || !isActive || hasReachedMaxUses) {
      return NextResponse.json(
        { error: "Coupon is not valid for redemption" },
        { status: 400 },
      );
    }

    // Check minimum order amount if specified
    if (
      coupon.minimumOrderAmount &&
      orderAmount &&
      orderAmount < coupon.minimumOrderAmount
    ) {
      return NextResponse.json(
        {
          error: `Minimum order amount is ₦${coupon.minimumOrderAmount.toLocaleString()}`,
        },
        { status: 400 },
      );
    }

    // Calculate discount applied
    const discountApplied =
      coupon.type === "PERCENTAGE"
        ? orderAmount
          ? (orderAmount * coupon.value) / 100
          : 0
        : coupon.value;

    // Create redemption record
    const redemption = await prisma.couponRedemption.create({
      data: {
        couponId: coupon.id,
        userId: assignment.userId,
        orderAmount: orderAmount ? parseFloat(orderAmount.toString()) : null,
        discountApplied,
        redemptionMethod,
        staffNotes,
        idVerified,
        redeemedAt: new Date(),
      },
    });

    // Update coupon usage count
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        currentUses: {
          increment: 1,
        },
      },
    });

    // Update assignment status to redeemed
    await prisma.couponAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "REDEEMED",
      },
    });

    logger.info(`Coupon redeemed: ${code}`, {
      couponId: coupon.id,
      assignmentId: assignment.id,
      userId: assignment.userId,
      redemptionId: redemption.id,
      orderAmount,
    });

    return NextResponse.json({
      success: true,
      redemption: {
        id: redemption.id,
        orderAmount: redemption.orderAmount,
        redemptionMethod: redemption.redemptionMethod,
        redeemedAt: redemption.redeemedAt,
      },
      coupon: {
        id: coupon.id,
        title: coupon.title,
        value: coupon.value,
        type: coupon.type,
      },
      business: {
        id: coupon.business.id,
        name: coupon.business.name,
      },
    });
  } catch (error) {
    logger.error("Failed to redeem coupon", {
      error: error instanceof Error ? error.message : error,
      code: request.body ? JSON.parse(request.body.toString()).code : null,
    });
    return NextResponse.json(
      {
        error: "Failed to redeem coupon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
