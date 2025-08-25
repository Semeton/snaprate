import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlatformSettingsService from "@/services/PlatformSettingsService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

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

    // Check if user is already an agent
    if (user.role === "AGENT") {
      return NextResponse.json(
        { success: false, error: "User is already an agent" },
        { status: 400 },
      );
    }

    // Get platform settings for dynamic validation
    const platformSettingsService = PlatformSettingsService.getInstance();
    const platformSettings = await platformSettingsService.getSettings();
    const requiredBusinesses = platformSettings.minimumBusinessesForAgent;

    // Check if user has reviewed enough unique businesses
    const uniqueBusinessesReviewed = await prisma.review.groupBy({
      by: ["businessId"],
      where: { reviewerId: user.id },
      _count: { businessId: true },
    });

    const uniqueBusinessesCount = uniqueBusinessesReviewed.length;

    // Log validation details for debugging
    console.log("Agent application validation:", {
      userId: user.id,
      requiredBusinesses,
      uniqueBusinessesCount,
      uniqueBusinesses: uniqueBusinessesReviewed.map((b) => b.businessId),
    });

    // Check if user has any reviews at all
    if (uniqueBusinessesCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `You need to write at least one review before applying to become an agent.`,
        },
        { status: 400 },
      );
    }

    if (uniqueBusinessesCount < requiredBusinesses) {
      return NextResponse.json(
        {
          success: false,
          error: `Need to review at least ${requiredBusinesses} different businesses to apply. You have reviewed ${uniqueBusinessesCount} unique businesses.`,
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { motivation, experience, businessKnowledge, commitment } = body;

    // Validate required fields
    if (!motivation || !experience || !businessKnowledge || !commitment) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    // Create agent application
    const application = await prisma.agentApplication.create({
      data: {
        userId: user.id,
        motivation,
        experience,
        businessKnowledge,
        commitment,
        status: "PENDING",
      },
    });

    // Log successful application creation
    console.log("Agent application created successfully:", {
      applicationId: application.id,
      userId: user.id,
      uniqueBusinessesCount,
      requiredBusinesses,
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: "Agent application submitted successfully",
    });
  } catch (error) {
    console.error("Agent application error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
