import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      businessName,
      category,
      phone,
      email,
      address,
      city,
      state,
      description,
      reason,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerState,
    } = body;

    // Validation
    if (
      !businessName ||
      !category ||
      !address ||
      !city ||
      !state ||
      !ownerName ||
      !ownerEmail ||
      !ownerPhone ||
      !ownerState
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if business already exists
    const existingBusiness = await prisma.business.findFirst({
      where: {
        OR: [
          { name: businessName, city, state },
          { phone: phone || "" },
          { email: email || "" },
        ],
      },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { success: false, error: "Business already exists" },
        { status: 409 },
      );
    }

    // Create business recommendation
    const recommendation = await prisma.businessRecommendation.create({
      data: {
        businessName,
        businessCategory: category as string,
        businessPhone: phone || null,
        businessEmail: email || null,
        businessAddress: address,
        businessCity: city,
        businessState: state as string,
        businessDescription: description || null,
        additionalNotes: reason || null,
        ownerName,
        ownerEmail,
        ownerPhone,
        ownerState,
        recommendedBy: user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Business recommendation submitted successfully! You'll earn ₦100 when approved.",
      data: recommendation,
    });
  } catch (error) {
    console.error("Business recommendation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit business recommendation" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const skip = (page - 1) * limit;
    const where: { recommendedBy: string; status?: string } = {
      recommendedBy: user.id,
    };

    if (status) {
      where.status = status;
    }

    const [recommendations, total] = await Promise.all([
      prisma.businessRecommendation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.businessRecommendation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recommendations" },
      { status: 500 },
    );
  }
}
