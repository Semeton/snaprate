import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: couponId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      type,
      value,
      validFrom,
      validUntil,
      maxUses,
      status,
      couponType,
      requiresReview,
    } = body;

    // Get the user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
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

    if (!business.isVerified) {
      return NextResponse.json(
        { error: "Only verified businesses can edit coupons" },
        { status: 403 },
      );
    }

    // Check if the coupon exists and belongs to the business
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        businessId: business.id,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Update the coupon
    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(validFrom && { validFrom: new Date(validFrom) }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        ...(maxUses !== undefined && {
          maxUses: maxUses ? parseInt(maxUses) : null,
        }),
        ...(status && { status }),
        ...(couponType && { couponType }),
        ...(requiresReview !== undefined && { requiresReview }),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            userIdentifier: true,
          },
        },
      },
    });

    logger.info(`Coupon updated successfully: ${couponId}`, {
      couponId,
      businessId: business.id,
      ownerId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    logger.error("Failed to update coupon", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update coupon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id: couponId } = await params;

    // Get the user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Check if the coupon exists and belongs to the business
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        id: couponId,
        businessId: business.id,
      },
    });

    if (!existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Soft delete the coupon
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    logger.info(`Coupon deleted successfully: ${couponId}`, {
      couponId,
      businessId: business.id,
      ownerId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete coupon", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to delete coupon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
