import { prisma } from "@/lib/prisma";
import { Reward, RewardType } from "@/types";
import PlatformSettingsService from "@/services/PlatformSettingsService";

export class RewardService {
  async createReward(rewardData: {
    type: RewardType;
    amount: number;
    description: string;
    referrerId: string;
    reviewId?: string;
  }): Promise<Reward> {
    try {
      const reward = await prisma.reward.create({
        data: {
          type: rewardData.type,
          amount: rewardData.amount,
          description: rewardData.description,
          referrerId: rewardData.referrerId,
          reviewId: rewardData.reviewId,
        },
        include: {
          referrer: true,
          review: {
            include: {
              business: true,
            },
          },
        },
      });

      return reward as Reward;
    } catch (error) {
      throw new Error(
        `Failed to create reward: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUserRewards(
    referrerId: string,
    options: {
      page: number;
      limit: number;
      type?: RewardType;
      isRedeemed?: boolean;
    },
  ) {
    try {
      const { page, limit, type, isRedeemed } = options;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { referrerId: referrerId };
      if (type) {
        where.type = type;
      }
      if (isRedeemed !== undefined) {
        where.isRedeemed = isRedeemed;
      }

      const [rewards, total] = await Promise.all([
        prisma.reward.findMany({
          where,
          include: {
            review: {
              include: {
                business: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.reward.count({ where }),
      ]);

      return {
        rewards: rewards as unknown as Reward[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get user rewards: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getRewardStats(referrerId: string) {
    try {
      const [
        totalEarnings,
        pendingRewards,
        redeemedRewards,
        referralEarnings,
        reviewEarnings,
      ] = await Promise.all([
        prisma.reward.aggregate({
          where: { referrerId },
          _sum: { amount: true },
        }),
        prisma.reward.aggregate({
          where: { referrerId, isRedeemed: false },
          _sum: { amount: true },
        }),
        prisma.reward.aggregate({
          where: { referrerId, isRedeemed: true },
          _sum: { amount: true },
        }),
        prisma.reward.aggregate({
          where: { referrerId, type: "REFERRAL_BONUS" },
          _sum: { amount: true },
        }),
        prisma.reward.aggregate({
          where: { referrerId, type: "CASH", reviewId: { not: null } },
          _sum: { amount: true },
        }),
      ]);

      return {
        totalEarnings: totalEarnings._sum.amount || 0,
        pendingRewards: pendingRewards._sum.amount || 0,
        redeemedRewards: redeemedRewards._sum.amount || 0,
        referralEarnings: referralEarnings._sum.amount || 0,
        reviewEarnings: reviewEarnings._sum.amount || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get reward stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async redeemReward(rewardId: string, referrerId: string): Promise<Reward> {
    try {
      const reward = await prisma.reward.findUnique({
        where: { id: rewardId },
      });

      if (!reward) {
        throw new Error("Reward not found");
      }

      if (reward.referrerId !== referrerId) {
        throw new Error("You can only redeem your own rewards");
      }

      if (reward.isRedeemed) {
        throw new Error("Reward has already been redeemed");
      }

      const updatedReward = await prisma.reward.update({
        where: { id: rewardId },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
        },
        include: {
          referrer: true,
          review: {
            include: {
              business: true,
            },
          },
        },
      });

      return updatedReward as Reward;
    } catch (error) {
      throw new Error(
        `Failed to redeem reward: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async createReferralBonus(referrerId: string): Promise<Reward> {
    try {
      // Get dynamic referral reward amount from platform settings
      const platformSettingsService = PlatformSettingsService.getInstance();
      const referralAmount =
        await platformSettingsService.getReferralRewardAmount();

      const reward = await prisma.reward.create({
        data: {
          type: "REFERRAL",
          amount: referralAmount,
          description: "Referral bonus for new user signup",
          referrerId: referrerId,
        },
        include: {
          referrer: true,
        },
      });

      return reward as unknown as Reward;
    } catch (error) {
      throw new Error(
        `Failed to create referral bonus: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async createBusinessOnboardingBonus(
    referrerId: string,
    businessName: string,
  ): Promise<Reward> {
    try {
      // Get dynamic business recommendation reward amount from platform settings
      const platformSettingsService = PlatformSettingsService.getInstance();
      const businessRecommendationAmount =
        await platformSettingsService.getBusinessRecommendationRewardAmount();

      const reward = await prisma.reward.create({
        data: {
          type: "BUSINESS_RECOMMENDATION",
          amount: businessRecommendationAmount,
          description: `Business onboarding bonus for ${businessName}`,
          referrerId: referrerId,
        },
        include: {
          referrer: true,
        },
      });

      return reward as Reward;
    } catch (error) {
      throw new Error(
        `Failed to create business onboarding bonus: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async createReviewReward(
    referrerId: string,
    reviewId: string,
    businessName: string,
  ): Promise<Reward> {
    try {
      // Get dynamic review reward amount from platform settings
      const platformSettingsService = PlatformSettingsService.getInstance();
      const reviewAmount =
        await platformSettingsService.getReviewRewardAmount();

      const reward = await prisma.reward.create({
        data: {
          type: "REVIEW",
          amount: reviewAmount,
          description: `Review reward for ${businessName}`,
          referrerId: referrerId,
        },
        include: {
          referrer: true,
        },
      });

      return reward as Reward;
    } catch (error) {
      throw new Error(
        `Failed to create review reward: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getPendingRewards(referrerId: string): Promise<Reward[]> {
    try {
      const rewards = await prisma.reward.findMany({
        where: {
          referrerId: referrerId,
          isRedeemed: false,
        },
        include: {
          review: {
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return rewards as unknown as Reward[];
    } catch (error) {
      throw new Error(
        `Failed to get pending rewards: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getTotalEarnings(referrerId: string): Promise<number> {
    try {
      const result = await prisma.reward.aggregate({
        where: { referrerId: referrerId },
        _sum: { amount: true },
      });

      return result._sum.amount || 0;
    } catch (error) {
      throw new Error(
        `Failed to get total earnings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getEarningsByType(
    referrerId: string,
  ): Promise<Record<RewardType, number>> {
    try {
      const rewards = await prisma.reward.groupBy({
        by: ["type"],
        where: { referrerId: referrerId },
        _sum: { amount: true },
      });

      const earningsByType: Record<RewardType, number> = {
        CASH: 0,
        AIRTIME: 0,
        COUPON: 0,
        REFERRAL_BONUS: 0,
        BUSINESS_ONBOARDING: 0,
      };

      rewards.forEach((reward) => {
        if (reward.type && reward._sum.amount) {
          earningsByType[reward.type as RewardType] = reward._sum.amount;
        }
      });

      return earningsByType;
    } catch (error) {
      throw new Error(
        `Failed to get earnings by type: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getMonthlyEarnings(
    referrerId: string,
    year: number,
    month: number,
  ): Promise<number> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const result = await prisma.reward.aggregate({
        where: {
          referrerId: referrerId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: { amount: true },
      });

      return result._sum.amount || 0;
    } catch (error) {
      throw new Error(
        `Failed to get monthly earnings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findByUser(referrerId: string, page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;

      const [rewards, total] = await Promise.all([
        prisma.reward.findMany({
          where: { referrerId: referrerId },
          include: {
            referrer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.reward.count({ where: { referrerId: referrerId } }),
      ]);

      return {
        data: rewards,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get user rewards: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
