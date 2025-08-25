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

    // Only agents can view their recommendations
    if (user.role !== "AGENT") {
      return NextResponse.json(
        { success: false, error: "Agent access required" },
        { status: 403 },
      );
    }

    // Get user's business recommendations
    const recommendations = await prisma.businessRecommendation.findMany({
      where: { recommendedBy: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Failed to fetch business recommendations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}

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

    // Only agents can create recommendations
    if (user.role !== "AGENT") {
      return NextResponse.json(
        { success: false, error: "Agent access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { business, owner } = body;

    // Validate required business fields
    if (
      !business.businessName ||
      !business.businessCategory ||
      !business.businessAddress ||
      !business.businessCity ||
      !business.businessState
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required business information" },
        { status: 400 },
      );
    }

    // Validate required owner fields
    if (!owner.ownerName || !owner.ownerPhone || !owner.ownerEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required owner information" },
        { status: 400 },
      );
    }

    // Check if business already exists (by name and location)
    const existingBusiness = await prisma.business.findFirst({
      where: {
        name: business.businessName,
        city: business.businessCity,
        state: business.businessState,
      },
    });

    if (existingBusiness) {
      return NextResponse.json(
        {
          success: false,
          error: "A business with this name already exists in this location",
        },
        { status: 400 },
      );
    }

    // Check if owner already exists (by email)
    const existingOwner = await prisma.user.findUnique({
      where: { email: owner.ownerEmail },
    });

    if (existingOwner) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 400 },
      );
    }

    // Create business recommendation
    const recommendation = await prisma.businessRecommendation.create({
      data: {
        businessName: business.businessName,
        businessCategory: business.businessCategory,
        businessAddress: business.businessAddress,
        businessCity: business.businessCity,
        businessState: business.businessState,
        businessPhone: business.businessPhone || null,
        businessEmail: business.businessEmail || null,
        businessWebsite: business.businessWebsite || null,
        businessDescription: business.businessDescription || null,
        ownerName: owner.ownerName,
        ownerPhone: owner.ownerPhone,
        ownerEmail: owner.ownerEmail,
        ownerAddress: owner.ownerAddress || null,
        ownerCity: owner.ownerCity || null,
        ownerState: owner.ownerState || null,
        additionalNotes: owner.additionalNotes || null,
        recommendedBy: user.id,
        status: "PENDING",
      },
    });

    // Log the recommendation creation
    console.log("Business recommendation created:", {
      recommendationId: recommendation.id,
      agentId: user.id,
      businessName: business.businessName,
      ownerEmail: owner.ownerEmail,
    });

    return NextResponse.json({
      success: true,
      data: recommendation,
      message: "Business recommendation submitted successfully",
    });
  } catch (error) {
    console.error("Failed to create business recommendation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit recommendation" },
      { status: 500 },
    );
  }
}
