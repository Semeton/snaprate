import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        phone: true,
        email: true,
        website: true,
        address: true,
        city: true,
        state: true,
        logo: true,
        coverImage: true,
        servicesImages: true,
        averageRating: true,
        totalReviews: true,
        totalVisits: true,
        verificationStatus: true,
        isVerified: true,
        verificationSource: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!business) {
      logger.warn("Business not found", { businessId: id });
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    logger.info("Business details retrieved successfully", {
      businessId: id,
      businessName: business.name,
    });

    return NextResponse.json(business);
  } catch (error) {
    logger.error("Failed to get business details", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      businessId: (await params).id,
    });
    return NextResponse.json(
      { error: "Failed to get business details" },
      { status: 500 },
    );
  }
}
