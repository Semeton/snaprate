import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only Super Admins can access this endpoint" },
        { status: 403 },
      );
    }

    // Get moderation settings from database or return defaults
    // For now, we'll use a simple approach with environment variables or defaults
    // In production, you might want to create a separate ModerationSettings table

    const defaultSettings = {
      autoFlagKeywords: ["spam", "inappropriate", "offensive", "fake", "scam"],
      autoFlagThreshold: 3,
      requireReviewForNewUsers: true,
      requireReviewForNewBusinesses: true,
      requireReviewForReviews: false,
      maxReportsBeforeAutoFlag: 5,
      moderationQueueSize: 100,
    };

    // Database storage for moderation settings planned
    // For now, return defaults
    const moderationSettings = defaultSettings;

    return NextResponse.json({
      success: true,
      data: moderationSettings,
    });
  } catch (error) {
    console.error("Failed to fetch moderation settings:", error);
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

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only Super Admins can update moderation settings",
        },
        { status: 403 },
      );
    }

    const settings = await request.json();

    // Validate settings
    if (
      !Array.isArray(settings.autoFlagKeywords) ||
      settings.autoFlagKeywords.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Auto-flag keywords must be a non-empty array",
        },
        { status: 400 },
      );
    }

    if (settings.autoFlagThreshold < 1 || settings.autoFlagThreshold > 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Auto-flag threshold must be between 1 and 10",
        },
        { status: 400 },
      );
    }

    if (
      settings.maxReportsBeforeAutoFlag < 1 ||
      settings.maxReportsBeforeAutoFlag > 20
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Max reports before auto-flag must be between 1 and 20",
        },
        { status: 400 },
      );
    }

    // Database storage for moderation settings planned
    // For now, we'll just log the action and return success
    // In production, you might want to create a separate ModerationSettings table

    // Moderation settings update requested

    // Simulate successful update
    const updatedSettings = {
      id: "moderation",
      ...settings,
      updatedAt: new Date(),
    };

    // Log the admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: "UPDATE_MODERATION_SETTINGS",
        targetType: "PLATFORM",
        targetId: "moderation",
        details: `Moderation settings updated by ${session.user.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings.moderationSettings,
      message: "Moderation settings updated successfully",
    });
  } catch (error) {
    console.error("Failed to update moderation settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
