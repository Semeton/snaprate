import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlatformSettingsService from "@/services/PlatformSettingsService";

/**
 * Reviewer Stats API
 *
 * IMPORTANT: Reward Calculation Strategy
 *
 * This API calculates rewards based on ACTUAL stored values in the Reward model,
 * NOT by dynamically calculating from current platform settings.
 *
 * Why this approach?
 * 1. **Consistency**: Existing rewards remain unchanged when platform settings change
 * 2. **Accuracy**: Users see exactly what they've earned, not recalculated amounts
 * 3. **Fairness**: Historical rewards maintain their original value
 * 4. **Audit Trail**: Complete record of what was earned and when
 *
 * How it works:
 * - Review rewards: Sum of all stored reward amounts with type "REVIEW"
 * - Referral rewards: Sum of all stored reward amounts with type "REFERRAL"
 * - Business recommendation rewards: Sum of all stored reward amounts with type "BUSINESS_RECOMMENDATION"
 * - Monthly rewards: Sum of all stored reward amounts created in the current month
 *
 * Platform settings are only used for:
 * - Displaying current rates for new rewards
 * - Minimum redemption amounts
 * - User information about future earning potential
 *
 * This ensures that changes to platform settings only affect NEW rewards,
 * not existing earned rewards.
 */
export async function GET() {
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

    // Get unique businesses reviewed count
    const uniqueBusinessesReviewed = await prisma.review.groupBy({
      by: ["businessId"],
      where: { reviewerId: user.id },
      _count: { businessId: true },
    });

    // Ensure we have valid numbers
    const totalReviews = reviewStats._count.id || 0;
    const averageRating = reviewStats._avg.rating || 0;
    const uniqueBusinessesCount = uniqueBusinessesReviewed.length || 0;

    // Get referral stats (users who signed up using this user's referral code)
    const referralStats = await prisma.user.count({
      where: { referredBy: user.id },
    });

    // Get platform settings for current reward rates (for display purposes only)
    const platformSettingsService = PlatformSettingsService.getInstance();
    const platformSettings = await platformSettingsService.getSettings();

    const currentReviewRewardRate = platformSettings.reviewRewardAmount;
    const currentReferralRewardRate = platformSettings.referralRewardAmount;
    const currentBusinessRecommendationRewardRate =
      platformSettings.businessRecommendationRewardAmount;

    // Calculate rewards based on ACTUAL stored values in the Reward model
    // This ensures that changes to platform settings don't affect existing reward calculations
    const [
      reviewRewards,
      referralRewards,
      businessRecommendationRewards,
      businessRegistrationRewards,
    ] = await Promise.all([
      // Get actual review rewards earned
      prisma.reward.aggregate({
        where: {
          referrerId: user.id,
          type: "REVIEW",
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Get actual referral rewards earned
      prisma.reward.aggregate({
        where: {
          referrerId: user.id,
          type: "REFERRAL",
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Get actual business recommendation rewards earned
      prisma.reward.aggregate({
        where: {
          referrerId: user.id,
          type: "BUSINESS_RECOMMENDATION",
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // Get actual business registration rewards earned (from agent full registrations)
      prisma.reward.aggregate({
        where: {
          referrerId: user.id,
          type: "BUSINESS_REGISTRATION",
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Use actual stored amounts, not calculated amounts
    const actualReviewReward = reviewRewards._sum.amount || 0;
    const actualReferralReward = referralRewards._sum.amount || 0;
    const actualBusinessRecommendationReward =
      businessRecommendationRewards._sum.amount || 0;
    const actualBusinessRegistrationReward =
      businessRegistrationRewards._sum.amount || 0;

    // Calculate total rewards from actual stored values (including business registration rewards)
    const totalRewards =
      actualReviewReward +
      actualReferralReward +
      actualBusinessRecommendationReward +
      actualBusinessRegistrationReward;

    // Debug log to see what we're getting from the database vs platform settings
    console.log("Reward calculation comparison:", {
      userId: user.id,
      // Platform settings (current rates)
      currentReviewRewardRate,
      currentReferralRewardRate,
      currentBusinessRecommendationRewardRate,
      // Actual stored rewards
      actualReviewReward,
      actualReferralReward,
      actualBusinessRecommendationReward,
      actualBusinessRegistrationReward,
      // Counts
      totalReviews,
      referralStats,
      reviewRewardsCount: reviewRewards._count.id,
      referralRewardsCount: referralRewards._count.id,
      businessRecommendationRewardsCount:
        businessRecommendationRewards._count.id,
      businessRegistrationRewardsCount: businessRegistrationRewards._count.id,
    });

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

    // Calculate monthly rewards based on actual stored rewards for this month
    const monthlyRewards = await prisma.reward.aggregate({
      where: {
        referrerId: user.id,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const actualMonthlyRewards = monthlyRewards._sum.amount || 0;

    // Validate and format all numbers
    const validatedStats = {
      totalReviews: Math.max(0, totalReviews),
      averageRating: averageRating > 0 ? Number(averageRating.toFixed(1)) : 0,
      uniqueBusinessesReviewed: Math.max(0, uniqueBusinessesCount),
      totalRewards: Math.max(0, totalRewards),
      totalReferrals: Math.max(0, referralStats),
      currentStreak: Math.max(0, currentStreak),
      monthlyReviews: Math.max(0, monthlyReviews),
      monthlyRewards: Math.max(0, actualMonthlyRewards),
      rewardBreakdown: {
        reviewReward: Math.max(0, actualReviewReward),
        referralReward: Math.max(0, actualReferralReward),
        businessRecommendationReward: Math.max(
          0,
          actualBusinessRecommendationReward + actualBusinessRegistrationReward,
        ),
      },
      currentRates: {
        reviewReward: currentReviewRewardRate,
        referralReward: currentReferralRewardRate,
        businessRecommendationReward: currentBusinessRecommendationRewardRate,
      },
      userRole: user.role,
      minimumRedemption: platformSettings.minimumRedemptionAmount,
      canRedeem: totalRewards >= platformSettings.minimumRedemptionAmount,
    };

    // Log the final calculated values for debugging
    console.log("Final stats calculation:", {
      userId: user.id,
      actualMonthlyRewards,
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
