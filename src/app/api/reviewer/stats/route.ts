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

    // Get review stats with proper aggregation
    const reviewStats = await prisma.review.aggregate({
      where: { reviewerId: user.id },
      _count: { id: true },
      _avg: { rating: true },
    });

    // Ensure we have valid numbers
    const totalReviews = reviewStats._count.id || 0;
    const averageRating = reviewStats._avg.rating || 0;

    // Get referral stats (users who signed up using this user's referral code)
    const referralStats = await prisma.user.count({
      where: { referredBy: user.id },
    });

    // Get platform settings for reward amounts
    let platformSettings = null;
    try {
      platformSettings = await prisma.platformSettings.findFirst({
        where: { id: "main" },
      });
    } catch (error) {
      console.log(
        "PlatformSettings table not found, using default values:",
        error,
      );
      // Table doesn't exist yet, use default values
    }

    const reviewRewardAmount = platformSettings?.reviewRewardAmount || 50;
    const referralRewardAmount = platformSettings?.referralRewardAmount || 20;
    const businessRecommendationRewardAmount =
      platformSettings?.businessRecommendationRewardAmount || 100;

    // Calculate rewards dynamically based on activities
    const reviewReward = totalReviews * reviewRewardAmount;
    const referralReward = referralStats * referralRewardAmount;

    // Reward for business recommendations (if agent): dynamic amount per approved business
    let businessRecommendationReward = 0;
    if (user.role === "AGENT") {
      // Count approved business recommendations (you'll need to implement this table)
      // For now, we'll set it to 0
      businessRecommendationReward = 0;
    }

    const totalRewards =
      reviewReward + referralReward + businessRecommendationReward;

    // Calculate current streak (consecutive days with reviews)
    const reviews = await prisma.review.findMany({
      where: { reviewerId: user.id },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    let currentStreak = 0;
    if (reviews.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentDate = new Date(today);
      let dayCount = 0;

      while (true) {
        const hasReviewOnDate = reviews.some((review) => {
          const reviewDate = new Date(review.createdAt);
          reviewDate.setHours(0, 0, 0, 0);
          return reviewDate.getTime() === currentDate.getTime();
        });

        if (hasReviewOnDate) {
          dayCount++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      currentStreak = dayCount;
    }

    // Get monthly stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyReviews = await prisma.review.count({
      where: {
        reviewerId: user.id,
        createdAt: { gte: startOfMonth },
      },
    });

    // Calculate monthly rewards dynamically
    const monthlyRewards = monthlyReviews * reviewRewardAmount;

    // Validate and format all numbers
    const validatedStats = {
      totalReviews: Math.max(0, totalReviews),
      averageRating: averageRating > 0 ? Number(averageRating.toFixed(1)) : 0,
      totalRewards: Math.max(0, totalRewards),
      totalReferrals: Math.max(0, referralStats),
      currentStreak: Math.max(0, currentStreak),
      monthlyReviews: Math.max(0, monthlyReviews),
      monthlyRewards: Math.max(0, monthlyRewards),
      rewardBreakdown: {
        reviewReward: Math.max(0, reviewReward),
        referralReward: Math.max(0, referralReward),
        businessRecommendationReward: Math.max(0, businessRecommendationReward),
      },
      userRole: user.role,
    };

    // Log the calculated values for debugging
    console.log("Stats calculation:", {
      userId: user.id,
      ...validatedStats,
    });

    return NextResponse.json({
      success: true,
      data: validatedStats,
    });
  } catch (error) {
    console.error("Reviewer stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
