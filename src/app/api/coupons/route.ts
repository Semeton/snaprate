import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CouponService } from "@/services/CouponService";
import { prisma } from "@/lib/prisma";

const couponService = new CouponService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      businessId,
      title,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      maxUses,
      validFrom,
      validUntil,
    } = body;

    // Validation
    if (
      !businessId ||
      !title ||
      !discountType ||
      !discountValue ||
      !validFrom ||
      !validUntil
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if user owns the business or is an admin
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    if (
      business.ownerId !== user.id &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized to create coupons for this business",
        },
        { status: 403 },
      );
    }

    // Create coupon
    const coupon = await couponService.createCoupon({
      businessId,
      title,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      maxUses,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
    });

    return NextResponse.json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Coupon creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create coupon" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (businessId) {
      const coupons = await couponService.getBusinessCoupons(businessId, {
        page,
        limit,
        status: status as any,
      });
      return NextResponse.json({ success: true, data: coupons });
    }

    return NextResponse.json(
      { success: false, error: "Business ID is required" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Coupon fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 },
    );
  }
}
