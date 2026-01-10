import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get platform settings
    const settings = await prisma.platformSettings.findFirst({
      where: { id: "main" },
    });

    return NextResponse.json({
      success: true,
      data: settings || {
        id: "main",
        minimumRedemptionAmount: 5000,
        reviewRewardAmount: 50,
        referralRewardAmount: 20,
        businessRecommendationRewardAmount: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Admin settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      minimumRedemptionAmount,
      reviewRewardAmount,
      referralRewardAmount,
      businessRecommendationRewardAmount,
    } = body;

    // Validate amounts
    if (minimumRedemptionAmount && minimumRedemptionAmount < 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Minimum redemption amount must be at least ₦100",
        },
        { status: 400 },
      );
    }

    if (reviewRewardAmount && reviewRewardAmount < 0) {
      return NextResponse.json(
        { success: false, error: "Review reward amount cannot be negative" },
        { status: 400 },
      );
    }

    if (referralRewardAmount && referralRewardAmount < 0) {
      return NextResponse.json(
        { success: false, error: "Referral reward amount cannot be negative" },
        { status: 400 },
      );
    }

    if (
      businessRecommendationRewardAmount &&
      businessRecommendationRewardAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Business recommendation reward amount cannot be negative",
        },
        { status: 400 },
      );
    }

    // Upsert platform settings
    const settings = await prisma.platformSettings.upsert({
      where: { id: "main" },
      update: {
        minimumRedemptionAmount,
        reviewRewardAmount,
        referralRewardAmount,
        businessRecommendationRewardAmount,
        updatedAt: new Date(),
      },
      create: {
        id: "main",
        minimumRedemptionAmount: minimumRedemptionAmount || 5000,
        reviewRewardAmount: reviewRewardAmount || 50,
        referralRewardAmount: referralRewardAmount || 20,
        businessRecommendationRewardAmount:
          businessRecommendationRewardAmount || 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Platform settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Admin settings update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 },
    );
  }
}
