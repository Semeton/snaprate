import { prisma } from '@/lib/prisma';
import { IRewardService } from './interfaces';
import { Reward, RewardType } from '@/types';

export class RewardService implements IRewardService {
  // Single Responsibility: This service only handles reward-related operations
  
  async createReward(rewardData: {
    type: RewardType;
    amount: number;
    description: string;
    userId: string;
    reviewId?: string;
  }): Promise<Reward> {
    try {
      const reward = await prisma.reward.create({
        data: {
          type: rewardData.type,
          amount: rewardData.amount,
          description: rewardData.description,
          userId: rewardData.userId,
          reviewId: rewardData.reviewId,
          isRedeemed: false,
        },
        include: {
          user: true,
          review: true,
        }
      });

      return reward as Reward;
    } catch (error) {
      throw new Error(`Failed to create reward: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<Reward | null> {
    try {
      const reward = await prisma.reward.findUnique({
        where: { id },
        include: {
          user: true,
          review: true,
        }
      });

      return reward as Reward;
    } catch (error) {
      throw new Error(`Failed to find reward: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10): Promise<{
    data: Reward[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [rewards, total] = await Promise.all([
        prisma.reward.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            review: {
              include: {
                business: true,
              }
            },
          }
        }),
        prisma.reward.count({ where: { userId } })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: rewards as Reward[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        }
      };
    } catch (error) {
      throw new Error(`Failed to find rewards by user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateReward(id: string, data: Partial<Reward>): Promise<Reward> {
    try {
      const reward = await prisma.reward.update({
        where: { id },
        data,
        include: {
          user: true,
          review: true,
        }
      });

      return reward as Reward;
    } catch (error) {
      throw new Error(`Failed to update reward: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteReward(id: string): Promise<void> {
    try {
      await prisma.reward.delete({
        where: { id }
      });
    } catch (error) {
      throw new Error(`Failed to delete reward: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async redeemReward(id: string, type: 'AIRTIME' | 'COUPON'): Promise<Reward> {
    try {
      const reward = await prisma.reward.findUnique({
        where: { id }
      });

      if (!reward) {
        throw new Error('Reward not found');
      }

      if (reward.isRedeemed) {
        throw new Error('Reward has already been redeemed');
      }

      if (reward.amount < 1000) {
        throw new Error('Minimum amount required for redemption is NGN 1,000');
      }

      const redeemedReward = await prisma.reward.update({
        where: { id },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
        },
        include: {
          user: true,
          review: true,
        }
      });

      return redeemedReward as Reward;
    } catch (error) {
      throw new Error(`Failed to redeem reward: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async calculateReviewReward(reviewId: string): Promise<number> {
    try {
      const review = await prisma.reward.findUnique({
        where: { reviewId }
      });

      if (review) {
        throw new Error('Reward already exists for this review');
      }

      // Standard reward for review: NGN 50
      return 50;
    } catch (error) {
      throw new Error(`Failed to calculate review reward: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processReferralBonus(referrerId: string, referredId: string): Promise<Reward> {
    try {
      // Check if referral bonus already exists
      const existingBonus = await prisma.reward.findFirst({
        where: {
          userId: referrerId,
          type: RewardType.REFERRAL_BONUS,
          description: {
            contains: referredId
          }
        }
      });

      if (existingBonus) {
        throw new Error('Referral bonus already processed');
      }

      // Create referral bonus: NGN 20
      const reward = await prisma.reward.create({
        data: {
          type: RewardType.REFERRAL_BONUS,
          amount: 20,
          description: `Referral bonus for user ${referredId}`,
          userId: referrerId,
          isRedeemed: false,
        },
        include: {
          user: true,
        }
      });

      return reward as Reward;
    } catch (error) {
      throw new Error(`Failed to process referral bonus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processBusinessOnboardingBonus(agentId: string, businessId: string): Promise<Reward> {
    try {
      // Check if onboarding bonus already exists
      const existingBonus = await prisma.reward.findFirst({
        where: {
          userId: agentId,
          type: RewardType.BUSINESS_ONBOARDING,
          description: {
            contains: businessId
          }
        }
      });

      if (existingBonus) {
        throw new Error('Onboarding bonus already processed');
      }

      // Create onboarding bonus: NGN 1,000
      const reward = await prisma.reward.create({
        data: {
          type: RewardType.BUSINESS_ONBOARDING,
          amount: 1000,
          description: `Business onboarding bonus for business ${businessId}`,
          userId: agentId,
          isRedeemed: false,
        },
        include: {
          user: true,
        }
      });

      return reward as Reward;
    } catch (error) {
      throw new Error(`Failed to process business onboarding bonus: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserRewardStats(userId: string): Promise<{
    totalReviews: number;
    totalEarnings: number;
    pendingRewards: number;
    referralCount: number;
    referralEarnings: number;
  }> {
    try {
      const [reviews, rewards, referrals] = await Promise.all([
        prisma.review.count({
          where: { 
            userId,
            status: 'APPROVED'
          }
        }),
        prisma.reward.aggregate({
          where: { userId },
          _sum: { amount: true }
        }),
        prisma.user.count({
          where: { referredBy: userId }
        })
      ]);

      const referralEarnings = await prisma.reward.aggregate({
        where: {
          userId,
          type: RewardType.REFERRAL_BONUS
        },
        _sum: { amount: true }
      });

      const pendingRewards = await prisma.reward.count({
        where: {
          userId,
          isRedeemed: false
        }
      });

      return {
        totalReviews: reviews,
        totalEarnings: rewards._sum.amount || 0,
        pendingRewards,
        referralCount: referrals,
        referralEarnings: referralEarnings._sum.amount || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get user reward stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRewardHistory(userId: string, type?: RewardType): Promise<Reward[]> {
    try {
      const where: Record<string, unknown> = { userId };
      
      if (type) {
        where.type = type;
      }

      const rewards = await prisma.reward.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          review: {
            include: {
              business: true,
            }
          },
        }
      });

      return rewards as Reward[];
    } catch (error) {
      throw new Error(`Failed to get reward history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTotalEarnings(userId: string): Promise<number> {
    try {
      const result = await prisma.reward.aggregate({
        where: { userId },
        _sum: { amount: true }
      });

      return result._sum.amount || 0;
    } catch (error) {
      throw new Error(`Failed to get total earnings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPendingEarnings(userId: string): Promise<number> {
    try {
      const result = await prisma.reward.aggregate({
        where: {
          userId,
          isRedeemed: false
        },
        _sum: { amount: true }
      });

      return result._sum.amount || 0;
    } catch (error) {
      throw new Error(`Failed to get pending earnings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
