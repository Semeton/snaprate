import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    } = body;

    // Validate required fields
    if (!businessName || !category || !address || !city || !state) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: businessName, category, address, city, state",
        },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // Create business recommendation
    const recommendation = await prisma.businessRecommendation.create({
      data: {
        businessName,
        category,
        phone: phone || null,
        email: email || null,
        address,
        city,
        state,
        description: description || null,
        reason: reason || null,
        recommendedBy: userId,
        status: "PENDING",
      },
    });

    logger.info("Business recommendation submitted successfully", {
      userId,
      recommendationId: recommendation.id,
      businessName,
    });

    return NextResponse.json({
      success: true,
      message: "Business recommendation submitted successfully",
      recommendation,
    });
  } catch (error) {
    logger.error("Failed to submit business recommendation", { error });
    return NextResponse.json(
      { error: "Failed to submit business recommendation" },
      { status: 500 },
    );
  }
}
