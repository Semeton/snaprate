import { prisma } from "@/lib/prisma";
import { AdminAction, User, Business, Review } from "@prisma/client";
import {
  UserFilterData,
  BusinessFilterData,
  ReviewFilterDataAdmin,
} from "./interfaces";

export class AdminService {
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalBusinesses: number;
    totalReviews: number;
    totalRewards: number;
    pendingApprovals: number;
  }> {
    try {
      const [
        totalUsers,
        totalBusinesses,
        totalReviews,
        totalRewards,
        pendingApprovals,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.review.count(),
        prisma.reward.count(),
        prisma.business.count({
          where: { isActive: false },
        }),
      ]);

      return {
        totalUsers,
        totalBusinesses,
        totalReviews,
        totalRewards,
        pendingApprovals,
      };
    } catch (error) {
      throw new Error(
        `Failed to get dashboard stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUsers(
    page: number = 1,
    limit: number = 10,
    filters?: UserFilterData,
  ): Promise<{
    data: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;
      const where: Record<string, unknown> = {};

      if (filters?.role) {
        where.role = filters.role;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: limit,
          where,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get users: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getBusinesses(
    page: number = 1,
    limit: number = 10,
    filters?: BusinessFilterData,
  ): Promise<{
    data: Business[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;
      const where: Record<string, unknown> = {};

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.state) {
        where.state = filters.state;
      }

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { address: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [businesses, total] = await Promise.all([
        prisma.business.findMany({
          skip,
          take: limit,
          where,
          orderBy: { createdAt: "desc" },
        }),
        prisma.business.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: businesses,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get businesses: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getReviews(
    page: number = 1,
    limit: number = 10,
    filters?: ReviewFilterDataAdmin,
  ): Promise<{
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
      const where: Record<string, unknown> = {};

      if (filters?.businessId) {
        where.businessId = filters.businessId;
      }

      if (filters?.reviewerId) {
        where.reviewerId = filters.reviewerId;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.rating) {
        where.rating = filters.rating;
      }

      if (filters?.search) {
        where.OR = [
          { content: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          skip,
          take: limit,
          where,
          orderBy: { createdAt: "desc" },
        }),
        prisma.review.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get reviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async suspendUser(
    userId: string,
    reason: string,
    adminId: string,
  ): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });

      await this.logAdminAction("SUSPEND_USER", "USER", userId, adminId, {
        reason,
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to suspend user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async banUser(
    userId: string,
    reason: string,
    adminId: string,
  ): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { status: "BANNED" },
      });

      await this.logAdminAction("BAN_USER", "USER", userId, adminId, {
        reason,
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to ban user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async logAdminAction(
    action: string,
    targetType: string,
    targetId: string,
    adminId: string,
    details?: Record<string, unknown>,
  ): Promise<AdminAction> {
    try {
      const adminAction = await prisma.adminAction.create({
        data: {
          action,
          targetType,
          targetId,
          adminId,
          details: details ? JSON.parse(JSON.stringify(details)) : null,
        },
      });

      return adminAction as AdminAction;
    } catch (error) {
      throw new Error(
        `Failed to log admin action: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getAdminActions(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: AdminAction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [actions, total] = await Promise.all([
        prisma.adminAction.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.adminAction.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: actions as AdminAction[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get admin actions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getSystemMetrics(): Promise<{
    totalRevenue: number;
    monthlyActiveUsers: number;
    totalReviewsThisMonth: number;
    averageRating: number;
    topCategories: Array<{ category: string; count: number }>;
    userGrowth: Array<{ month: string; count: number }>;
  }> {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalRevenue,
        monthlyActiveUsers,
        totalReviewsThisMonth,
        averageRating,
        topCategories,
        userGrowth,
      ] = await Promise.all([
        // Total revenue from rewards
        prisma.reward.aggregate({
          _sum: { amount: true },
        }),
        // Monthly active users
        prisma.user.count({
          where: {
            lastLoginAt: {
              gte: thirtyDaysAgo,
            },
          },
        }),
        // Total reviews this month
        prisma.review.count({
          where: {
            createdAt: {
              gte: firstDayOfMonth,
            },
          },
        }),
        // Average rating
        prisma.review.aggregate({
          _avg: { rating: true },
        }),
        // Top business categories
        prisma.business.groupBy({
          by: ["category"],
          _count: {
            category: true,
          },
          orderBy: {
            _count: {
              category: "desc",
            },
          },
          take: 5,
        }),
        // User growth over last 6 months
        prisma.$queryRaw<Array<{ month: string; count: number }>>`
          SELECT 
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
            COUNT(*) as count
          FROM "User"
          WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY month ASC
        `,
      ]);

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyActiveUsers,
        totalReviewsThisMonth,
        averageRating: averageRating._avg.rating || 0,
        topCategories: topCategories.map((cat) => ({
          category: cat.category,
          count: cat._count.category,
        })),
        userGrowth: userGrowth || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to get system metrics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
