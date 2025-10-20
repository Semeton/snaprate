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

    // Find coupon by base code or user-specific code
    const coupon = await prisma.coupon.findFirst({
      where: {
        OR: [{ baseCode: code }, { userSpecificCode: code }],
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
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
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

    let isValid = true;
    let message = "Coupon is valid";
    let canRedeem = true;

    if (isExpired) {
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

    logger.info(`Coupon verification: ${code}`, {
      couponId: coupon.id,
      isValid,
      canRedeem,
      businessId: coupon.businessId,
    });

    return NextResponse.json({
      success: true,
      coupon: {
        ...coupon,
        currentUses: coupon._count.redemptions,
        totalAssignments: coupon._count.assignments,
      },
      business: coupon.business,
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
