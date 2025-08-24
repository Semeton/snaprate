import { prisma } from "@/lib/prisma";
import { RewardService } from "./RewardService";
import { PlatformSettingsService } from "./PlatformSettingsService";
import { RewardType, Review, ReviewStatus } from "@/types";
import { PrismaClient } from "@prisma/client";

export class ReviewService {
  private rewardService: RewardService;
  private platformSettingsService: PlatformSettingsService;

  constructor() {
    this.rewardService = new RewardService();
    this.platformSettingsService = PlatformSettingsService.getInstance();
  }

  async createReview(reviewData: {
    userId: string;
    businessId: string;
    rating: number;
    title?: string;
    content: string;
    images: string[];
    video?: string | null;
    isAnonymous?: boolean;
  }): Promise<Review> {
    try {
      // Get platform settings for reward amount
      const platformSettings = await this.platformSettingsService.getSettings();

      const result = await prisma.$transaction(async (tx) => {
        // Create the review
        const review = await tx.review.create({
          data: {
            rating: reviewData.rating,
            // title: reviewData.title,
            content: reviewData.content,
            images: reviewData.images || [],
            video: reviewData.video || null,
            isAnonymous: reviewData.isAnonymous || false,
            status: ReviewStatus.PENDING,
            reviewerId: reviewData.userId,
            businessId: reviewData.businessId,
          },
          include: {
            reviewer: true,
            business: true,
          },
        });

        // Update business rating and review count
        await this.updateBusinessMetrics(reviewData.businessId, tx);

        return review;
      });

      // Create reward for the review using platform settings
      await this.rewardService.createReward({
        type: "REVIEW" as RewardType,
        amount: platformSettings.reviewRewardAmount,
        description: `Review reward for ${result.businessId}`,
        referrerId: reviewData.userId,
        reviewId: result.id,
      });

      return result as unknown as Review;
    } catch (error) {
      throw new Error(
        `Failed to create review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUserReviewForBusiness(
    userId: string,
    businessId: string,
  ): Promise<Review | null> {
    try {
      const review = await prisma.review.findFirst({
        where: {
          reviewerId: userId,
          businessId,
        },
        include: {
          reviewer: true,
          business: true,
        },
      });

      return review as unknown as Review;
    } catch (error) {
      throw new Error(
        `Failed to get user review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getBusinessReviews(
    businessId: string,
    options: {
      page: number;
      limit: number;
      status?: ReviewStatus;
    },
  ) {
    try {
      const { page, limit, status } = options;
      const skip = (page - 1) * limit;

      const where = { businessId };
      if (status) {
        where.status = status;
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            business: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.review.count({ where }),
      ]);

      return {
        reviews: reviews as Review[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get business reviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUserReviews(
    userId: string,
    options: {
      page: number;
      limit: number;
      status?: ReviewStatus;
    },
  ) {
    try {
      const { page, limit, status } = options;
      const skip = (page - 1) * limit;

      const where = { reviewerId: userId };
      if (status) {
        where.status = status;
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            business: {
              select: {
                id: true,
                name: true,
                category: true,
                state: true,
                city: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.review.count({ where }),
      ]);

      return {
        reviews: reviews as Review[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get user reviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async approveReview(reviewId: string, adminId: string): Promise<Review> {
    try {
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.APPROVED,
        },
        include: {
          reviewer: true,
          business: true,
        },
      });

      // Update business metrics after approval
      await this.updateBusinessMetrics(review.businessId);

      // Log admin action
      await prisma.adminAction.create({
        data: {
          action: "APPROVE_REVIEW",
          targetType: "REVIEW",
          targetId: reviewId,
          adminId,
          adminName: "Admin", // You'd get this from the session
        },
      });

      return review as unknown as Review;
    } catch (error) {
      throw new Error(
        `Failed to approve review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async rejectReview(
    reviewId: string,
    adminId: string,
    reason: string,
  ): Promise<Review> {
    try {
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: ReviewStatus.REJECTED,
        },
        include: {
          reviewer: true,
          business: true,
        },
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          action: "REJECT_REVIEW",
          targetType: "REVIEW",
          targetId: reviewId,
          adminId,
          adminName: "Admin",
          details: { reason },
        },
      });

      return review as unknown as Review;
    } catch (error) {
      throw new Error(
        `Failed to reject review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async reportReview(
    reviewId: string,
    reason: string,
    // reporterId: string,
  ): Promise<Review> {
    try {
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          reported: true,
          reportReason: reason,
        },
        include: {
          reviewer: true,
          business: true,
        },
      });

      return review as unknown as Review;
    } catch (error) {
      throw new Error(
        `Failed to report review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new Error("Review not found");
      }

      if (review.reviewerId !== userId) {
        throw new Error("You can only delete your own reviews");
      }

      await prisma.review.delete({
        where: { id: reviewId },
      });

      // Update business metrics after deletion
      await this.updateBusinessMetrics(review.businessId);
    } catch (error) {
      throw new Error(
        `Failed to delete review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  private async updateBusinessMetrics(
    businessId: string,
    tx?: PrismaClient,
  ): Promise<void> {
    try {
      const prismaClient = tx || prisma;

      // Get all approved reviews for the business
      const reviews = await prismaClient.review.findMany({
        where: {
          businessId,
          status: ReviewStatus.APPROVED,
        },
        select: {
          rating: true,
        },
      });

      if (reviews.length === 0) {
        // No approved reviews, reset to defaults
        await prismaClient.business.update({
          where: { id: businessId },
          data: {
            averageRating: 0,
            totalReviews: 0,
          },
        });
        return;
      }

      // Calculate new rating and review count
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      const averageRating = totalRating / reviews.length;
      const reviewCount = reviews.length;

      await prismaClient.business.update({
        where: { id: businessId },
        data: {
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          totalReviews: reviewCount,
        },
      });
    } catch (error) {
      console.error("Failed to update business metrics:", error);
    }
  }

  async getReviewStats(userId: string) {
    try {
      const [totalReviews, approvedReviews, pendingReviews, totalEarnings] =
        await Promise.all([
          prisma.review.count({ where: { reviewerId: userId } }),
          prisma.review.count({
            where: { reviewerId: userId, status: ReviewStatus.APPROVED },
          }),
          prisma.review.count({
            where: { reviewerId: userId, status: ReviewStatus.PENDING },
          }),
          prisma.reward.aggregate({
            where: {
              referrerId: userId,
              reviewId: { not: null },
              isRedeemed: false,
            },
            _sum: { amount: true },
          }),
        ]);

      return {
        totalReviews,
        approvedReviews,
        pendingReviews,
        totalEarnings: totalEarnings._sum?.amount || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get review stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
