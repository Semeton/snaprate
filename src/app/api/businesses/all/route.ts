import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

// GET /api/businesses/all - Get all businesses (for debugging)
export async function GET(request: NextRequest) {
  try {
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Retrieved ${businesses.length} businesses`);

    return NextResponse.json({
      success: true,
      count: businesses.length,
      businesses: businesses,
    });
  } catch (error) {
    logger.error("Failed to fetch all businesses", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch businesses" },
      { status: 500 },
    );
  }
}
