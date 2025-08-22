import { prisma } from "@/lib/prisma";
import { Review, ReviewStatus, Business } from "@/types";
import { RewardService } from "./RewardService";

export class ReviewService {
  private rewardService: RewardService;

  constructor() {
    this.rewardService = new RewardService();
  }

  async createReview(reviewData: {
    userId: string;
    businessId: string;
    rating: number;
    content: string;
    images: string[];
    video?: string | null;
  }): Promise<Review> {
    try {
      // Start a transaction to create review and update business metrics
      const result = await prisma.$transaction(async (tx) => {
        // Create the review
        const review = await tx.review.create({
          data: {
            rating: reviewData.rating,
            content: reviewData.content,
            images: reviewData.images,
            video: reviewData.video,
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

      // Create reward for the review (NGN 50)
      await this.rewardService.createReward({
        type: "REVIEW" as any,
        amount: 50,
        description: `Review reward for ${result.business?.name || "business"}`,
        userId: reviewData.userId,
        reviewId: result.id,
      });

      return result as Review;
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

      return review as Review;
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

      const where: any = { businessId };
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

      const where: any = { reviewerId: userId };
      if (status) {
        where.status = status;
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
            user: {
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
          user: true,
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

      return review as Review;
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
          user: true,
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

      return review as Review;
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
    reporterId: string,
  ): Promise<Review> {
    try {
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          reported: true,
          reportReason: reason,
        },
        include: {
          user: true,
          business: true,
        },
      });

      return review as Review;
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

      if (review.userId !== userId) {
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
    tx?: any,
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
            rating: 0,
            reviewCount: 0,
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
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          reviewCount,
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
          prisma.review.count({ where: { userId } }),
          prisma.review.count({
            where: { userId, status: ReviewStatus.APPROVED },
          }),
          prisma.review.count({
            where: { userId, status: ReviewStatus.PENDING },
          }),
          prisma.reward.aggregate({
            where: {
              userId,
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
        totalEarnings: totalEarnings._sum.amount || 0,
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
