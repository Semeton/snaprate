import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

// GET /api/businesses/featured - Get featured businesses for landing page
export async function GET(request: NextRequest) {
  try {
    // Get top-rated businesses with verified status and good reviews
    const featuredBusinesses = await prisma.business.findMany({
      where: {
        verificationStatus: "VERIFIED",
        isActive: true,
        // averageRating: {
        //   gte: 4.0, // Only businesses with 4+ star rating
        // },
        // // totalReviews: {
        // //   gte: 5, // At least 5 reviews
        // // },
      },
      orderBy: [
        { averageRating: "desc" },
        { totalReviews: "desc" },
        { totalVisits: "desc" },
      ],
      take: 6, // Limit to 6 featured businesses
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        reviews: {
          where: {
            status: "APPROVED",
          },
          select: {
            id: true,
          },
        },
      },
    });

    logger.info(`Retrieved ${featuredBusinesses.length} featured businesses`);

    return NextResponse.json({
      success: true,
      count: featuredBusinesses.length,
      businesses: featuredBusinesses,
    });
  } catch (error) {
    logger.error("Failed to fetch featured businesses", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch featured businesses" },
      { status: 500 },
    );
  }
}
