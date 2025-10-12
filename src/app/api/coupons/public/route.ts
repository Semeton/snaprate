import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CouponVisibility } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereClause: any = {
      couponType: CouponVisibility.PUBLIC,
      status: "ACTIVE",
      validFrom: { lte: new Date() },
      validUntil: { gte: new Date() },
    };

    if (businessId) {
      whereClause.businessId = businessId;
    }

    if (category) {
      whereClause.business = {
        category: category,
      };
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where: whereClause,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
              logo: true,
              address: true,
              city: true,
              state: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.coupon.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      success: true,
      coupons,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Failed to fetch public coupons:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch public coupons",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
