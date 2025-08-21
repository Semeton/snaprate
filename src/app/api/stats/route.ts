import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get platform statistics
    const [
      totalUsers,
      totalBusinesses,
      totalReviews,
      totalRewards,
      verifiedBusinesses,
      activeUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.business.count(),
      prisma.review.count(),
      prisma.reward.aggregate({
        _sum: { amount: true },
      }),
      prisma.business.count({
        where: { verificationStatus: "VERIFIED" },
      }),
      prisma.user.count({
        where: { status: "ACTIVE" },
      }),
    ]);

    const stats = {
      totalUsers,
      totalBusinesses,
      totalReviews,
      totalRewards: totalRewards._sum.amount || 0,
      verifiedBusinesses,
      activeUsers,
      // Calculate some derived stats
      averageRating: 0, // This would be calculated from reviews
      totalEarnings: totalRewards._sum.amount || 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch platform stats" },
      { status: 500 },
    );
  }
}
