import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { CouponStatus } from "@/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can update coupon status" },
        { status: 403 },
      );
    }

    const couponId = params.id;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !Object.values(CouponStatus).includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be one of: DRAFT, ACTIVE, PAUSED, EXPIRED",
        },
        { status: 400 },
      );
    }

    // Get the user's business to verify ownership
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Verify the coupon exists and belongs to the business owner
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { id: true, businessId: true, status: true },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (coupon.businessId !== business.id) {
      return NextResponse.json(
        { error: "You can only update your own coupons" },
        { status: 403 },
      );
    }

    // Update the coupon status
    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: { status },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    logger.info(`Coupon status updated: ${couponId}`, {
      couponId,
      businessId: business.id,
      ownerId: session.user.id,
      oldStatus: coupon.status,
      newStatus: status,
    });

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon,
      message: "Coupon status updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update coupon status", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update coupon status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
