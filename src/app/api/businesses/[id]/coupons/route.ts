import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const businessId = params.id;

    // Get the business to verify it exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        isVerified: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Get all active coupons for this business
    const coupons = await prisma.coupon.findMany({
      where: {
        businessId: businessId,
        status: {
          in: ["ACTIVE", "DRAFT", "PAUSED", "EXPIRED"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            redemptions: true,
            assignments: {
              where: {
                status: "ASSIGNED",
              },
            },
          },
        },
      },
    });

    // Update coupon status based on validity
    const now = new Date();
    const updatedCoupons = coupons.map((coupon) => {
      let status = coupon.status;

      // Check if coupon should be expired
      if (coupon.validUntil < now && status === "ACTIVE") {
        status = "EXPIRED";
      }

      // Check if coupon should be active
      if (
        coupon.validFrom <= now &&
        coupon.validUntil >= now &&
        status === "DRAFT"
      ) {
        status = "ACTIVE";
      }

      return {
        ...coupon,
        status,
        currentUses: coupon._count.redemptions,
        totalAssignments: coupon._count.assignments,
      };
    });

    // Update expired coupons in database
    const expiredCoupons = updatedCoupons.filter(
      (coupon) =>
        coupon.status === "EXPIRED" &&
        coupon.status !== coupons.find((c) => c.id === coupon.id)?.status,
    );

    if (expiredCoupons.length > 0) {
      await prisma.coupon.updateMany({
        where: {
          id: {
            in: expiredCoupons.map((c) => c.id),
          },
        },
        data: {
          status: "EXPIRED",
        },
      });
    }

    logger.info(`Fetched coupons for business: ${businessId}`, {
      businessId,
      couponCount: coupons.length,
    });

    return NextResponse.json({
      success: true,
      coupons: updatedCoupons,
      business: {
        id: business.id,
        name: business.name,
        isVerified: business.isVerified,
      },
    });
  } catch (error) {
    logger.error("Failed to fetch business coupons", {
      error: error instanceof Error ? error.message : error,
      businessId: params.id,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch coupons",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
