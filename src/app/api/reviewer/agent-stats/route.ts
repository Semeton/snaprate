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

    // Only agents can view their stats
    if (user.role !== "AGENT") {
      return NextResponse.json(
        { success: false, error: "Agent access required" },
        { status: 403 },
      );
    }

    // Get business recommendation stats
    const [
      totalRecommendations,
      approvedRecommendations,
      pendingRecommendations,
      rejectedRecommendations,
    ] = await Promise.all([
      // Total recommendations
      prisma.businessRecommendation.count({
        where: { recommendedBy: user.id },
      }),
      // Approved recommendations
      prisma.businessRecommendation.count({
        where: {
          recommendedBy: user.id,
          status: "APPROVED",
        },
      }),
      // Pending recommendations
      prisma.businessRecommendation.count({
        where: {
          recommendedBy: user.id,
          status: "PENDING",
        },
      }),
      // Rejected recommendations
      prisma.businessRecommendation.count({
        where: {
          recommendedBy: user.id,
          status: "REJECTED",
        },
      }),
    ]);

    // Get total earnings from business recommendation rewards
    const totalEarnings = await prisma.reward.aggregate({
      where: {
        referrerId: user.id,
        type: "BUSINESS_RECOMMENDATION",
      },
      _sum: { amount: true },
    });

    // Get monthly earnings from business recommendation rewards
    const monthlyEarnings = await prisma.reward.aggregate({
      where: {
        referrerId: user.id,
        type: "BUSINESS_RECOMMENDATION",
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    });

    // Get average rating from reviews
    const averageRating = await prisma.review.aggregate({
      where: { reviewerId: user.id },
      _avg: { rating: true },
    });

    // Get current streak (consecutive days with reviews)
    const reviews = await prisma.review.findMany({
      where: { reviewerId: user.id },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    let currentStreak = 0;
    if (reviews.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(today);
      for (let i = 0; i < 30; i++) {
        // Check last 30 days
        const hasReview = reviews.some((review) => {
          const reviewDate = new Date(review.createdAt);
          reviewDate.setHours(0, 0, 0, 0);
          return reviewDate.getTime() === currentDate.getTime();
        });

        if (hasReview) {
          currentStreak++;
        } else {
          break;
        }

        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    const stats = {
      totalRecommendations,
      approvedRecommendations,
      pendingRecommendations,
      rejectedRecommendations,
      totalEarnings: totalEarnings._sum.amount || 0,
      monthlyEarnings: monthlyEarnings._sum.amount || 0,
      averageRating: averageRating._avg.rating || 0,
      currentStreak,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Failed to fetch agent stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch agent stats" },
      { status: 500 },
    );
  }
}
