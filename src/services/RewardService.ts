import { prisma } from "@/lib/prisma";
import { Reward } from "@prisma/client";

export interface RewardCreateData {
  referrerId: string;
  amount: number;
  type: string;
  description: string;
}

export interface RewardFilterData {
  referrerId?: string;
  type?: string;
  isRedeemed?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class RewardService {
  async createReward(data: RewardCreateData): Promise<Reward> {
    try {
      const reward = await prisma.reward.create({
        data,
      });

      return reward;
    } catch (error) {
      throw new Error(
        `Failed to create reward: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getRewardById(id: string): Promise<Reward | null> {
    try {
      return await prisma.reward.findUnique({
        where: { id },
        include: {
          referrer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get reward: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUserRewards(
    userId: string,
    options: {
      page: number;
      limit: number;
      isRedeemed?: boolean;
      type?: string;
    } = { page: 1, limit: 10 },
  ): Promise<{
    rewards: Reward[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page, limit, isRedeemed, type } = options;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { referrerId: userId };

      if (isRedeemed !== undefined) where.isRedeemed = isRedeemed;
      if (type) where.type = type;

      const [rewards, total] = await Promise.all([
        prisma.reward.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.reward.count({ where }),
      ]);

      return {
        rewards,
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

  async redeemReward(id: string): Promise<Reward> {
    try {
      return await prisma.reward.update({
        where: { id },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to redeem reward: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getRewardStats(userId: string): Promise<{
    totalRewards: number;
    totalAmount: number;
    redeemedRewards: number;
    redeemedAmount: number;
    pendingRewards: number;
    pendingAmount: number;
  }> {
    try {
      const [
        totalRewards,
        totalAmount,
        redeemedRewards,
        redeemedAmount,
        pendingRewards,
        pendingAmount,
      ] = await Promise.all([
        prisma.reward.count({ where: { referrerId: userId } }),
        prisma.reward.aggregate({
          where: { referrerId: userId },
          _sum: { amount: true },
        }),
        prisma.reward.count({
          where: { referrerId: userId, isRedeemed: true },
        }),
        prisma.reward.aggregate({
          where: { referrerId: userId, isRedeemed: true },
          _sum: { amount: true },
        }),
        prisma.reward.count({
          where: { referrerId: userId, isRedeemed: false },
        }),
        prisma.reward.aggregate({
          where: { referrerId: userId, isRedeemed: false },
          _sum: { amount: true },
        }),
      ]);

      return {
        totalRewards,
        totalAmount: totalAmount._sum.amount || 0,
        redeemedRewards,
        redeemedAmount: redeemedAmount._sum.amount || 0,
        pendingRewards,
        pendingAmount: pendingAmount._sum.amount || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get reward stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    successfulReferrals: number;
    totalEarnings: number;
    averageEarningsPerReferral: number;
  }> {
    try {
      const [totalReferrals, successfulReferrals, totalEarnings] =
        await Promise.all([
          prisma.user.count({
            where: { referredBy: userId },
          }),
          prisma.user.count({
            where: { referredBy: userId, status: "ACTIVE" },
          }),
          prisma.reward.aggregate({
            where: {
              referrerId: userId,
              type: "REFERRAL",
            },
            _sum: { amount: true },
          }),
        ]);

      const avgEarnings =
        totalReferrals > 0
          ? (totalEarnings._sum.amount || 0) / totalReferrals
          : 0;

      return {
        totalReferrals,
        successfulReferrals,
        totalEarnings: totalEarnings._sum.amount || 0,
        averageEarningsPerReferral: avgEarnings,
      };
    } catch (error) {
      throw new Error(
        `Failed to get referral stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
