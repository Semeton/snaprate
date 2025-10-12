import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CouponService } from "@/services/CouponService";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const businessId = params.id;

    // Check if business exists and is verified
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        isVerified: true,
        reviewStatus: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Only show coupons for verified businesses
    if (!business.isVerified) {
      return NextResponse.json(
        { error: "Business is not verified" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "ACTIVE";

    const couponService = new CouponService();
    const result = await couponService.getPublicCouponsForBusiness(businessId, {
      page,
      limit,
      status: status as any,
    });

    return NextResponse.json({
      success: true,
      ...result,
      business: {
        id: business.id,
        name: business.name,
      },
    });
  } catch (error) {
    console.error("Failed to get business coupons:", error);
    return NextResponse.json(
      {
        error: "Failed to get business coupons",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
