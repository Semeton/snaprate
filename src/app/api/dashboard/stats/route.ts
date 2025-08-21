import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReviewService } from "@/services/ReviewService";
import { RewardService } from "@/services/RewardService";
import { UserService } from "@/services/UserService";
import { prisma } from "@/lib/prisma";

const reviewService = new ReviewService();
const rewardService = new RewardService();
const userService = new UserService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user by email since session doesn't have ID
    const user = await userService.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const userId = user.id;

    // Get review stats
    const reviewStats = await reviewService.getReviewStats(userId);

    // Get reward stats
    const rewardStats = await rewardService.getRewardStats(userId);

    // Get referral count
    const referralStats = await userService.getReferralStats(userId);

    // Calculate current streak (simplified - in real app you'd track daily reviews)
    const currentStreak = await calculateCurrentStreak(userId);

    // Calculate level and progress
    const { level, nextLevelProgress } = calculateUserLevel(
      reviewStats.totalReviews,
    );

    const dashboardStats = {
      totalReviews: reviewStats.totalReviews,
      totalEarnings: rewardStats.totalEarnings,
      pendingRewards: rewardStats.pendingRewards,
      referralCount: referralStats.count,
      referralEarnings: rewardStats.referralEarnings,
      currentStreak,
      level,
      nextLevelProgress,
      approvedReviews: reviewStats.approvedReviews,
      pendingReviews: reviewStats.pendingReviews,
      reviewEarnings: rewardStats.reviewEarnings,
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}

async function calculateCurrentStreak(userId: string): Promise<number> {
  try {
    // Get reviews from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await prisma.review.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (recentReviews.length === 0) return 0;

    let currentStreak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check consecutive days with reviews
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);

      const hasReviewOnDate = recentReviews.some((review) => {
        const reviewDate = new Date(review.createdAt);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate.getTime() === checkDate.getTime();
      });

      if (hasReviewOnDate) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }

    return currentStreak;
  } catch (error) {
    console.error("Error calculating streak:", error);
    return 0;
  }
}

function calculateUserLevel(totalReviews: number): {
  level: string;
  nextLevelProgress: number;
} {
  const levels = [
    { name: "New Reviewer", minReviews: 0 },
    { name: "Local Explorer", minReviews: 5 },
    { name: "Community Contributor", minReviews: 15 },
    { name: "Local Hero", minReviews: 30 },
    { name: "Review Champion", minReviews: 50 },
    { name: "Business Expert", minReviews: 100 },
    { name: "Legendary Reviewer", minReviews: 200 },
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];

  for (let i = 0; i < levels.length - 1; i++) {
    if (
      totalReviews >= levels[i].minReviews &&
      totalReviews < levels[i + 1].minReviews
    ) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1];
      break;
    }
  }

  if (totalReviews >= levels[levels.length - 1].minReviews) {
    currentLevel = levels[levels.length - 1];
    return { level: currentLevel.name, nextLevelProgress: 100 };
  }

  const progressInCurrentLevel = totalReviews - currentLevel.minReviews;
  const reviewsNeededForNextLevel =
    nextLevel.minReviews - currentLevel.minReviews;
  const progress = Math.round(
    (progressInCurrentLevel / reviewsNeededForNextLevel) * 100,
  );

  return { level: currentLevel.name, nextLevelProgress: progress };
}
