import { prisma } from "@/lib/prisma";
import { Review, ReviewStatus } from "@prisma/client";

export interface ReviewCreateData {
  businessId: string;
  reviewerId: string;
  rating: number;
  content: string;
  images: string[];
  video?: string;
}

export interface ReviewUpdateData {
  rating?: number;
  content?: string;
  images?: string[];
  video?: string;
  status?: ReviewStatus;
}

export interface ReviewFilterData {
  businessId?: string;
  reviewerId?: string;
  status?: ReviewStatus;
  minRating?: number;
  maxRating?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ReviewSearchData {
  query: string;
  businessId?: string;
  status?: ReviewStatus;
  minRating?: number;
  maxRating?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export class ReviewService {
  async createReview(data: ReviewCreateData): Promise<Review> {
    try {
      const review = await prisma.review.create({
        data: {
          ...data,
          status: ReviewStatus.PENDING,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
              state: true,
              city: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return review;
    } catch (error) {
      throw new Error(
        `Failed to create review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getReviewById(id: string): Promise<Review | null> {
    try {
      return await prisma.review.findUnique({
        where: { id },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
              state: true,
              city: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get review: ${
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
      minRating?: number;
      maxRating?: number;
      sortBy?: "rating" | "createdAt" | "helpfulCount";
      sortOrder?: "asc" | "desc";
    } = { page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
  ): Promise<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page, limit, status, minRating, maxRating, sortBy, sortOrder } =
        options;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { businessId };

      if (status) where.status = status;
      if (minRating && maxRating) {
        where.rating = { gte: minRating, lte: maxRating };
      } else if (minRating) {
        where.rating = { gte: minRating };
      } else if (maxRating) {
        where.rating = { lte: maxRating };
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
          },
          orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" },
          skip,
          take: limit,
        }),
        prisma.review.count({ where }),
      ]);

      return {
        reviews,
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
    } = { page: 1, limit: 10 },
  ): Promise<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page, limit, status } = options;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { reviewerId: userId };

      if (status) where.status = status;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          include: {
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
        reviews,
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

  async updateReview(id: string, data: ReviewUpdateData): Promise<Review> {
    try {
      return await prisma.review.update({
        where: { id },
        data,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to update review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async deleteReview(id: string): Promise<void> {
    try {
      await prisma.review.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async approveReview(id: string): Promise<Review> {
    try {
      return await prisma.review.update({
        where: { id },
        data: { status: ReviewStatus.APPROVED },
      });
    } catch (error) {
      throw new Error(
        `Failed to approve review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async rejectReview(id: string): Promise<Review> {
    try {
      return await prisma.review.update({
        where: { id },
        data: {
          status: ReviewStatus.REJECTED,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to reject review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async searchReviews(searchData: ReviewSearchData): Promise<Review[]> {
    try {
      const {
        query,
        businessId,
        status,
        minRating,
        maxRating,
        dateFrom,
        dateTo,
      } = searchData;

      const where: Record<string, unknown> = {
        OR: [{ content: { contains: query, mode: "insensitive" } }],
      };

      if (businessId) where.businessId = businessId;
      if (status) where.status = status;
      if (minRating && maxRating) {
        where.rating = { gte: minRating, lte: maxRating };
      } else if (minRating) {
        where.rating = { gte: minRating };
      } else if (maxRating) {
        where.rating = { lte: maxRating };
      }
      if (dateFrom && dateTo) {
        where.createdAt = { gte: dateFrom, lte: dateTo };
      } else if (dateFrom) {
        where.createdAt = { gte: dateFrom };
      } else if (dateTo) {
        where.createdAt = { lte: dateTo };
      }

      return await prisma.review.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } catch (error) {
      throw new Error(
        `Failed to search reviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getReviewStats(businessId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    statusDistribution: Record<string, number>;
  }> {
    try {
      const [
        totalReviews,
        averageRating,
        ratingDistribution,
        statusDistribution,
      ] = await Promise.all([
        prisma.review.count({ where: { businessId } }),
        prisma.review.aggregate({
          where: { businessId },
          _avg: { rating: true },
        }),
        prisma.review.groupBy({
          by: ["rating"],
          where: { businessId },
          _count: { rating: true },
        }),
        prisma.review.groupBy({
          by: ["status"],
          where: { businessId },
          _count: { status: true },
        }),
      ]);

      const ratingDist: Record<number, number> = {};
      ratingDistribution.forEach((item) => {
        ratingDist[item.rating] = item._count.rating;
      });

      const statusDist: Record<string, number> = {};
      statusDistribution.forEach((item) => {
        statusDist[item.status] = item._count.status;
      });

      return {
        totalReviews,
        averageRating: averageRating._avg.rating || 0,
        ratingDistribution: ratingDist,
        statusDistribution: statusDist,
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
