import { prisma } from "@/lib/prisma";

export interface RecommendationRewardData {
  recommendationId: string;
  recommendedBy: string;
  businessId: string;
  businessName: string;
  rewardAmount: number;
}

export class RecommendationRewardService {
  /**
   * Create delayed reward when a recommended business becomes verified
   */
  static async createDelayedRecommendationReward(
    businessId: string,
    businessName: string,
  ): Promise<void> {
    try {
      // Find the original recommendation for this business
      const recommendation = await prisma.businessRecommendation.findFirst({
        where: {
          businessName: businessName,
          status: "APPROVED", // Only process approved recommendations
        },
        include: {
          recommendedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!recommendation) {
        console.log(
          `No approved recommendation found for business: ${businessName}`,
        );
        return;
      }

      // Check if reward already exists for this recommendation
      const existingReward = await prisma.reward.findFirst({
        where: {
          referrerId: recommendation.recommendedBy,
          type: "BUSINESS_RECOMMENDATION",
          description: {
            contains: businessName,
          },
        },
      });

      if (existingReward) {
        console.log(
          `Reward already exists for recommendation: ${recommendation.id}`,
        );
        return;
      }

      // Get platform settings for recommendation reward rate
      const platformSettings = await prisma.platformSettings.findFirst();
      const recommendationRewardRate =
        platformSettings?.businessRecommendationRewardAmount || 100;

      // Create the delayed reward
      await prisma.reward.create({
        data: {
          referrerId: recommendation.recommendedBy,
          amount: recommendationRewardRate,
          type: "BUSINESS_RECOMMENDATION",
          description: `Delayed reward for business recommendation: ${businessName}`,
          reviewId: null, // No review associated with recommendation rewards
        },
      });

      // Update the recommendation status to indicate reward was given
      await prisma.businessRecommendation.update({
        where: { id: recommendation.id },
        data: {
          status: "REWARDED",
          updatedAt: new Date(),
        },
      });

      console.log(
        `Created delayed reward for recommendation: ${recommendation.id}, Amount: ${recommendationRewardRate}`,
      );
    } catch (error) {
      console.error("Error creating delayed recommendation reward:", error);
      throw error;
    }
  }

  /**
   * Get pending recommendation rewards (recommendations that are approved but not yet rewarded)
   */
  static async getPendingRecommendationRewards(userId: string) {
    const pendingRecommendations = await prisma.businessRecommendation.findMany(
      {
        where: {
          recommendedBy: userId,
          status: "APPROVED", // Approved but not yet rewarded
        },
        orderBy: { createdAt: "desc" },
      },
    );

    return pendingRecommendations;
  }

  /**
   * Get completed recommendation rewards (recommendations that have been rewarded)
   */
  static async getCompletedRecommendationRewards(userId: string) {
    const completedRecommendations =
      await prisma.businessRecommendation.findMany({
        where: {
          recommendedBy: userId,
          status: "REWARDED",
        },
        orderBy: { updatedAt: "desc" },
      });

    return completedRecommendations;
  }

  /**
   * Get total earnings from business recommendations
   */
  static async getTotalRecommendationEarnings(userId: string): Promise<number> {
    const rewards = await prisma.reward.findMany({
      where: {
        referrerId: userId,
        type: "BUSINESS_RECOMMENDATION",
      },
    });

    return rewards.reduce((total, reward) => total + reward.amount, 0);
  }

  /**
   * Process all pending recommendation rewards for a specific business
   * This should be called when a business becomes verified
   */
  static async processPendingRewardsForBusiness(
    businessId: string,
    businessName: string,
  ): Promise<void> {
    await this.createDelayedRecommendationReward(businessId, businessName);
  }
}
