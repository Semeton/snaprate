import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BusinessService } from "@/services/BusinessService";
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
    const business = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const coupon = await BusinessService.createCoupon(business.id, {
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
    const business = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const coupons = await BusinessService.getBusinessCoupons(business.id);

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
