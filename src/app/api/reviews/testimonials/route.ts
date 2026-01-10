import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

// GET /api/reviews/testimonials - Get testimonials for landing page
export async function GET(request: NextRequest) {
  try {
    // Get top testimonials from verified users with high ratings
    const testimonials = await prisma.review.findMany({
      where: {
        status: "APPROVED",
        rating: {
          gte: 4, // Only 4+ star reviews
        },
        reviewer: {
          status: "ACTIVE",
          isVerified: true,
        },
        business: {
          verificationStatus: "VERIFIED",
          isActive: true,
        },
      },
      orderBy: [
        { rating: "desc" },
        { helpfulCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 6, // Limit to 6 testimonials
      include: {
        reviewer: {
          select: {
            name: true,
            role: true,
          },
        },
        business: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    });

    logger.info(`Retrieved ${testimonials.length} testimonials`);

    return NextResponse.json({
      success: true,
      count: testimonials.length,
      testimonials: testimonials,
    });
  } catch (error) {
    logger.error("Failed to fetch testimonials", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch testimonials" },
      { status: 500 },
    );
  }
}
