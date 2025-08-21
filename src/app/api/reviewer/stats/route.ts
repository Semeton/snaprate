import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total reviews
    const totalReviews = await prisma.review.count({
      where: { reviewerId: userId },
    });

    // Get total earnings from rewards
    const totalEarnings = await prisma.reward.aggregate({
      where: { referrerId: userId },
      _sum: { amount: true },
    });

    // Get total referrals (users who signed up with this user's referral code)
    const totalReferrals = await prisma.user.count({
      where: { referredBy: userId },
    });

    // Get total businesses recommended (this would be through a separate system)
    const totalBusinessesRecommended = 0; // Placeholder for now

    // Get pending rewards
    const pendingRewards = await prisma.reward.count({
      where: {
        referrerId: userId,
        isRedeemed: false,
      },
    });

    // Get average rating from reviews
    const averageRating = await prisma.review.aggregate({
      where: { reviewerId: userId },
      _avg: { rating: true },
    });

    const stats = {
      totalReviews,
      totalEarnings: totalEarnings._sum.amount || 0,
      totalReferrals,
      totalBusinessesRecommended,
      pendingRewards,
      averageRating: averageRating._avg.rating || 0,
    };

    logger.info("Reviewer stats retrieved successfully", { userId });

    return NextResponse.json(stats);
  } catch (error) {
    logger.error("Failed to get reviewer stats", { error });
    return NextResponse.json(
      { error: "Failed to get reviewer stats" },
      { status: 500 },
    );
  }
}
