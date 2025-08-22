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
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
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

    let couponCode;
    let isUnique = false;
    do {
      couponCode = generateCouponCode();
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
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
        code: couponCode,
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
    logger.error("Failed to create coupon", { error });
    return NextResponse.json(
      {
        error: "Failed to create coupon",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
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
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
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
