import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlatformSettingsService from "@/services/PlatformSettingsService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Get platform settings using the service
    const platformSettingsService = PlatformSettingsService.getInstance();
    const settings = await platformSettingsService.getSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Failed to fetch platform settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const settings = await request.json();

    // Validate settings
    if (
      typeof settings.minimumRedemptionAmount !== "number" ||
      settings.minimumRedemptionAmount < 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid minimum redemption amount" },
        { status: 400 },
      );
    }

    if (
      typeof settings.reviewRewardAmount !== "number" ||
      settings.reviewRewardAmount < 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid review reward amount" },
        { status: 400 },
      );
    }

    if (
      typeof settings.referralRewardAmount !== "number" ||
      settings.referralRewardAmount < 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid referral reward amount" },
        { status: 400 },
      );
    }

    if (
      typeof settings.businessRecommendationRewardAmount !== "number" ||
      settings.businessRecommendationRewardAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid business recommendation reward amount",
        },
        { status: 400 },
      );
    }

    if (
      typeof settings.minimumBusinessesForAgent !== "number" ||
      settings.minimumBusinessesForAgent < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid minimum businesses for agent (must be at least 1)",
        },
        { status: 400 },
      );
    }

    // Upsert settings using the actual schema fields
    const updatedSettings = await prisma.platformSettings.upsert({
      where: { id: "main" },
      update: {
        minimumRedemptionAmount: settings.minimumRedemptionAmount,
        reviewRewardAmount: settings.reviewRewardAmount,
        referralRewardAmount: settings.referralRewardAmount,
        businessRecommendationRewardAmount:
          settings.businessRecommendationRewardAmount,
        minimumBusinessesForAgent: settings.minimumBusinessesForAgent,
        updatedAt: new Date(),
      },
      create: {
        id: "main",
        minimumRedemptionAmount: settings.minimumRedemptionAmount,
        reviewRewardAmount: settings.reviewRewardAmount,
        referralRewardAmount: settings.referralRewardAmount,
        businessRecommendationRewardAmount:
          settings.businessRecommendationRewardAmount,
        minimumBusinessesForAgent: settings.minimumBusinessesForAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Clear the platform settings cache
    const platformSettingsService = PlatformSettingsService.getInstance();
    platformSettingsService.clearCache();

    // Log the admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: "UPDATE_PLATFORM_SETTINGS",
        targetType: "PLATFORM",
        targetId: "main",
        details: `Platform settings updated by ${session.user.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        minimumRedemptionAmount: updatedSettings.minimumRedemptionAmount,
        reviewRewardAmount: updatedSettings.reviewRewardAmount,
        referralRewardAmount: updatedSettings.referralRewardAmount,
        businessRecommendationRewardAmount:
          updatedSettings.businessRecommendationRewardAmount,
        minimumBusinessesForAgent: updatedSettings.minimumBusinessesForAgent,
        maxReviewsPerBusiness: 1, // Default value
        reviewModerationRequired: true, // Default value
        businessVerificationRequired: true, // Default value
      },
      message: "Platform settings updated successfully",
    });
  } catch (error) {
    console.error("Failed to update platform settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
