import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

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
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    logger.info("Business details retrieved successfully", { businessId: id });

    return NextResponse.json(business);
  } catch (error) {
    logger.error("Failed to get business details", { error });
    return NextResponse.json(
      { error: "Failed to get business details" },
      { status: 500 },
    );
  }
}
