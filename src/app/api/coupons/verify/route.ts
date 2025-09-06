import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/services/CouponService";
import { CouponVerificationData } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderAmount, redemptionMethod, staffNotes, idVerified } =
      body;

    // Validate required fields
    if (!code || !redemptionMethod) {
      return NextResponse.json(
        { error: "code and redemptionMethod are required" },
        { status: 400 },
      );
    }

    const verificationData: CouponVerificationData = {
      code,
      orderAmount: orderAmount ? parseFloat(orderAmount) : undefined,
      redemptionMethod,
      staffNotes,
      idVerified: idVerified || false,
    };

    const couponService = new CouponService();
    const result = await couponService.redeemCoupon(verificationData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      redemption: result.redemption,
      message: "Coupon redeemed successfully",
    });
  } catch (error) {
    console.error("Failed to verify coupon:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify coupon",
      },
      { status: 500 },
    );
  }
}

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

    const couponService = new CouponService();
    const coupon = await couponService.getCouponByCode(code);

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Return coupon details for verification page
    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        title: coupon.title,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minimumOrderAmount: coupon.minimumOrderAmount,
        maximumDiscount: coupon.maximumDiscount,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        status: coupon.status,
        useType: coupon.useType,
        allowedDaysOfWeek: coupon.allowedDaysOfWeek,
        allowedTimeStart: coupon.allowedTimeStart,
        allowedTimeEnd: coupon.allowedTimeEnd,
        requiresIdVerification: coupon.requiresIdVerification,
        business: {
          id: coupon.business.id,
          name: coupon.business.name,
          category: coupon.business.category,
          state: coupon.business.state,
          city: coupon.business.city,
        },
        assignedUser: coupon.assignedUser
          ? {
              id: coupon.assignedUser.id,
              name: coupon.assignedUser.name,
              userIdentifier: coupon.assignedUser.userIdentifier,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to get coupon details:", error);
    return NextResponse.json(
      { error: "Failed to get coupon details" },
      { status: 500 },
    );
  }
}
