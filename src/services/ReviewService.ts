import { prisma } from '@/lib/prisma';
import { IReviewService } from './interfaces';
import { Review, ReviewStatus } from '@/types';

export class ReviewService implements IReviewService {
  // Single Responsibility: This service only handles review-related operations
  
  async createReview(reviewData: {
    rating: number;
    title?: string;
    content: string;
    images?: string[];
    video?: string;
    isAnonymous: boolean;
  }, userId: string, businessId: string): Promise<Review> {
    try {
      // Validate rating
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Check if user has already reviewed this business
      const existingReview = await prisma.review.findFirst({
        where: {
          userId,
          businessId,
        }
      });

      if (existingReview) {
        throw new Error('You have already reviewed this business');
      }

      // Create review
      const review = await prisma.review.create({
        data: {
          rating: reviewData.rating,
          title: reviewData.title,
          content: reviewData.content,
          images: reviewData.images || [],
          video: reviewData.video,
          isAnonymous: reviewData.isAnonymous,
          userId,
          businessId,
          status: ReviewStatus.PENDING,
        },
        include: {
          user: true,
          business: true,
          reward: true,
        }
      });

      return review as Review;
    } catch (error) {
      throw new Error(`Failed to create review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: string): Promise<Review | null> {
    try {
      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          user: true,
          business: true,
          reward: true,
        }
      });

      return review as Review;
    } catch (error) {
      throw new Error(`Failed to find review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10): Promise<{
    data: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            business: true,
            reward: true,
          }
        }),
        prisma.review.count({ where: { userId } })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: reviews as Review[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        }
      };
    } catch (error) {
      throw new Error(`Failed to find reviews by user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByBusiness(businessId: string, page: number = 1, limit: number = 10): Promise<{
    data: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { 
            businessId,
            status: ReviewStatus.APPROVED
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            reward: true,
          }
        }),
        prisma.review.count({ 
          where: { 
            businessId,
            status: ReviewStatus.APPROVED
          }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: reviews as Review[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        }
      };
    } catch (error) {
      throw new Error(`Failed to find reviews by business: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateReview(id: string, data: Partial<Review>): Promise<Review> {
    try {
      // Remove fields that shouldn't be updated
      const { userId, businessId, status, ...updateData } = data;

      const review = await prisma.review.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          business: true,
          reward: true,
        }
      });

      return review as Review;
    } catch (error) {
      throw new Error(`Failed to update review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteReview(id: string): Promise<void> {
    try {
      await prisma.review.delete({
        where: { id }
      });
    } catch (error) {
      throw new Error(`Failed to delete review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async approveReview(id: string, adminId: string): Promise<Review> {
    try {
      const review = await prisma.review.update({
        where: { id },
        data: {
          status: ReviewStatus.APPROVED,
        },
        include: {
          user: true,
          business: true,
          reward: true,
        }
      });

      return review as Review;
    } catch (error) {
      throw new Error(`Failed to approve review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async rejectReview(id: string, adminId: string, reason: string): Promise<Review> {
    try {
      const review = await prisma.review.update({
        where: { id },
        data: {
          status: ReviewStatus.REJECTED,
        },
        include: {
          user: true,
          business: true,
          reward: true,
        }
      });

      return review as Review;
    } catch (error) {
      throw new Error(`Failed to reject review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reportReview(id: string, reason: string): Promise<Review> {
    try {
      const review = await prisma.review.update({
        where: { id },
        data: {
          reported: true,
          reportReason: reason,
        },
        include: {
          user: true,
          business: true,
          reward: true,
        }
      });

      return review as Review;
    } catch (error) {
      throw new Error(`Failed to report review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchReviews(filters: {
    status?: ReviewStatus;
    rating?: number;
    dateFrom?: Date;
    dateTo?: Date;
  }, page: number = 1, limit: number = 10): Promise<{
    data: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: Record<string, unknown> = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.rating) {
        where.rating = filters.rating;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
        }
      }

      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            business: true,
            reward: true,
          }
        }),
        prisma.review.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: reviews as Review[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        }
      };
    } catch (error) {
      throw new Error(`Failed to search reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getReviewStats(businessId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    try {
      const reviews = await prisma.review.findMany({
        where: { 
          businessId,
          status: ReviewStatus.APPROVED
        },
        select: { rating: true }
      });

      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      return {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: reviews.length,
        ratingDistribution,
      };
    } catch (error) {
      throw new Error(`Failed to get review stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getReportedReviews(page: number = 1, limit: number = 10): Promise<{
    data: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { reported: true },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
            business: true,
          }
        }),
        prisma.review.count({ where: { reported: true } })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: reviews as Review[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        }
      };
    } catch (error) {
      throw new Error(`Failed to get reported reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
