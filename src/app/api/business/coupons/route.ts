import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow BUSINESS_OWNER role and verified businesses
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
      validFrom,
      validUntil,
      maxUses,
    } = body;

    // Validate required fields
    if (!title || !type || !value || !validFrom || !validUntil) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, type, value, validFrom, validUntil",
        },
        { status: 400 },
      );
    }

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

    // Check if business is verified
    if (!business.isVerified) {
      return NextResponse.json(
        { error: "Only verified businesses can create coupons" },
        { status: 403 },
      );
    }

    // Generate unique coupon code
    const generateCouponCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let baseCode;
    let isUnique = false;
    do {
      baseCode = generateCouponCode();
      const existingCoupon = await prisma.coupon.findUnique({
        where: { baseCode: baseCode },
      });
      isUnique = !existingCoupon;
    } while (!isUnique);

    const coupon = await prisma.coupon.create({
      data: {
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
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        maxUses: maxUses ? parseInt(maxUses) : undefined,
        baseCode: baseCode,
        businessId: business.id,
      },
    });

    logger.info(`Coupon created successfully: ${coupon.id}`, {
      couponId: coupon.id,
      businessId: business.id,
      ownerId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      coupon,
      message: "Coupon created successfully",
    });
  } catch (error) {
    logger.error("Failed to create coupon", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to create coupon",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can access coupons" },
        { status: 403 },
      );
    }

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

    // Check if business is verified
    if (!business.isVerified) {
      return NextResponse.json(
        { error: "Only verified businesses can access coupons" },
        { status: 403 },
      );
    }

    const coupons = await prisma.coupon.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    logger.error("Failed to get coupons", { error });
    return NextResponse.json(
      {
        error: "Failed to get coupons",
      },
      { status: 500 },
    );
  }
}
