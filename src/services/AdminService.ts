import { prisma } from "@/lib/prisma";
import { IAdminService } from "./interfaces";
import {
  BaseUser,
  Business,
  Agent,
  Review,
  AdminAction,
  UserRole,
  AccountStatus,
  BusinessVerificationStatus,
  ReviewStatus,
  User,
} from "@/types";
import { InputJsonValue } from "@prisma/client/runtime/library";

export class AdminService implements IAdminService {
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
        pendingBusinesses,
        pendingAgents,
        pendingReviews,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.review.count(),
        prisma.reward.count(),
        prisma.business.count({
          where: { verificationStatus: BusinessVerificationStatus.PENDING },
        }),
        prisma.agent.count({
          where: { isApproved: false },
        }),
        prisma.review.count({
          where: { status: ReviewStatus.PENDING },
        }),
      ]);

      const pendingApprovals =
        pendingBusinesses + pendingAgents + pendingReviews;

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
    filters?: {
      role?: UserRole;
      status?: AccountStatus;
      state?: string;
      search?: string;
    },
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
      const where: Record<string, unknown> = {};

      if (filters?.role) {
        where.role = filters.role;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.state) {
        where.state = filters.state;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            business: true,
            agentProfile: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: users as unknown as User[],
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
    filters?: {
      verificationStatus?: BusinessVerificationStatus;
      category?: string;
      state?: string;
      search?: string;
    },
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
      const where: Record<string, unknown> = {};

      if (filters?.verificationStatus) {
        where.verificationStatus = filters.verificationStatus;
      }

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.state) {
        where.state = filters.state;
      }

      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          { city: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      const skip = (page - 1) * limit;

      const [businesses, total] = await Promise.all([
        prisma.business.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            ownerId: true,
            name: true,
            description: true,
            category: true,
            phone: true,
            email: true,
            website: true,
            logo: true,
            coverImage: true,
            servicesImages: true,
            address: true,
            city: true,
            state: true,
            latitude: true,
            longitude: true,
            verificationStatus: true,
            reviewStatus: true,
            verificationNotes: true,
            verifiedAt: true,
            verificationDocuments: true,
            averageRating: true,
            totalReviews: true,
            totalVisits: true,
            isActive: true,
            onboardedByAgentId: true,
            cacNumber: true,
            utilityBill: true,
            createdAt: true,
            updatedAt: true,
            owner: true,
            onboardedByAgent: true,
          },
        }),
        prisma.business.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Convert Prisma results to Business interface
      const businessResults = businesses.map((business) => ({
        id: business.id,
        ownerId: business.ownerId,
        name: business.name,
        description: business.description || undefined,
        category: business.category,
        phone: business.phone,
        email: business.email,
        website: business.website || undefined,
        logo: business.logo || undefined,
        coverImage: business.coverImage || undefined,
        servicesImages: business.servicesImages || [],
        address: business.address,
        city: business.city,
        state: business.state,
        latitude: business.latitude || undefined,
        longitude: business.longitude || undefined,
        verificationStatus: business.verificationStatus,
        reviewStatus: business.reviewStatus,
        verificationNotes: business.verificationNotes || undefined,
        verifiedAt: business.verifiedAt || undefined,
        verificationDocuments: business.verificationDocuments || [],
        averageRating: business.averageRating,
        totalReviews: business.totalReviews,
        totalVisits: business.totalVisits,
        isActive: business.isActive,
        onboardedByAgentId: business.onboardedByAgentId || undefined,
        cacNumber: business.cacNumber || undefined,
        utilityBill: business.utilityBill || undefined,
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
        owner: business.owner as BaseUser,
        onboardedByAgent: business.onboardedByAgent as unknown as Agent,
        reviews: [],
        coupons: [],
        businessHours: [],
        businessSettings: undefined,
        analytics: [],
        views: [],
      }));

      return {
        data: businessResults as Business[],
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

  async getAgents(
    page: number = 1,
    limit: number = 10,
    filters?: {
      isApproved?: boolean;
      state?: string;
      search?: string;
    },
  ): Promise<{
    data: Agent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: Record<string, unknown> = {};

      if (filters?.isApproved !== undefined) {
        where.isApproved = filters.isApproved;
      }

      if (filters?.state) {
        where.user = {
          state: filters.state,
        };
      }

      if (filters?.search) {
        where.user = {
          ...(where.user as Record<string, unknown>),
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        };
      }

      const skip = (page - 1) * limit;

      const [agents, total] = await Promise.all([
        prisma.agent.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
          },
        }),
        prisma.agent.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: agents as unknown as Agent[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get agents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getReviews(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: ReviewStatus;
      reported?: boolean;
      businessId?: string;
      userId?: string;
    },
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
      const where: Record<string, unknown> = {};

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.reported !== undefined) {
        where.reported = filters.reported;
      }

      if (filters?.businessId) {
        where.businessId = filters.businessId;
      }

      if (filters?.userId) {
        where.reviewerId = filters.userId;
      }

      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: true,
            business: true,
          },
        }),
        prisma.review.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: reviews as unknown as Review[],
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
        data: {
          status: AccountStatus.SUSPENDED,
        },
        include: {
          business: true,
          agentProfile: true,
          referrals: true,
          accounts: true,
          sessions: true,
          agentApplications: true,
          adminInvitations: true,
          adminActions: true,
          reportedContent: true,
          rewards: true,
          reviews: true,
          businessRecommendations: true,
          businessViews: true,
          resolvedReports: true,
        },
      });

      // Log admin action
      await this.logAdminAction(
        "SUSPEND_USER",
        "USER",
        userId,
        adminId,
        "Admin",
        { reason, previousStatus: user.status },
      );

      return user as unknown as User;
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
        data: {
          status: AccountStatus.BANNED,
        },
        include: {
          business: true,
          agentProfile: true,
          referrals: true,
          accounts: true,
          sessions: true,
          agentApplications: true,
          adminInvitations: true,
          adminActions: true,
          reportedContent: true,
          rewards: true,
          reviews: true,
          businessRecommendations: true,
          businessViews: true,
          resolvedReports: true,
        },
      });

      // Log admin action
      await this.logAdminAction("BAN_USER", "USER", userId, adminId, "Admin", {
        reason,
        previousStatus: user.status,
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to ban user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async activateUser(userId: string, adminId: string): Promise<BaseUser> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: AccountStatus.ACTIVE,
        },
        include: {
          business: true,
          agentProfile: true,
          referrals: true,
          accounts: true,
          sessions: true,
          agentApplications: true,
          adminInvitations: true,
          adminActions: true,
          reportedContent: true,
          rewards: true,
          reviews: true,
          businessRecommendations: true,
          businessViews: true,
          resolvedReports: true,
        },
      });

      // Log admin action
      await this.logAdminAction(
        "ACTIVATE_USER",
        "USER",
        userId,
        adminId,
        "Admin",
        { previousStatus: user.status },
      );

      return user as unknown as BaseUser;
    } catch (error) {
      throw new Error(
        `Failed to activate user: ${
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
    adminName: string,
    details?: InputJsonValue,
  ): Promise<AdminAction> {
    try {
      const adminAction = await prisma.adminAction.create({
        data: {
          action,
          targetType,
          targetId,
          adminId,
          adminName,
          details,
          ipAddress: "127.0.0.1", // In a real app, get from request
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
          where: { status: ReviewStatus.APPROVED },
          _avg: { rating: true },
        }),
        // Top business categories
        prisma.business.groupBy({
          by: ["category"],
          _count: { category: true },
          orderBy: { _count: { category: "desc" } },
          take: 5,
        }),
        // User growth over last 6 months
        this.getUserGrowthData(),
      ]);

      return {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyActiveUsers,
        totalReviewsThisMonth,
        averageRating: averageRating._avg.rating || 0,
        topCategories: topCategories
          .filter(
            (cat): cat is typeof cat & { category: string } =>
              cat.category !== null,
          )
          .map((cat) => ({
            category: cat.category,
            count: cat._count.category,
          })),
        userGrowth,
      };
    } catch (error) {
      throw new Error(
        `Failed to get system metrics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  private async getUserGrowthData(): Promise<
    Array<{ month: string; count: number }>
  > {
    try {
      const months = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          1,
        );

        const count = await prisma.user.count({
          where: {
            createdAt: {
              gte: month,
              lt: nextMonth,
            },
          },
        });

        months.push({
          month: month.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          count,
        });
      }

      return months;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getReportedContent(): Promise<{
    reportedReviews: Review[];
    reportedUsers: BaseUser[];
  }> {
    try {
      const [reportedReviews, reportedUsers] = await Promise.all([
        prisma.review.findMany({
          where: { reported: true },
          include: {
            reviewer: true,
            business: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          where: {
            OR: [
              { status: AccountStatus.SUSPENDED },
              { status: AccountStatus.BANNED },
            ],
          },
          include: {
            business: true,
            agentProfile: true,
            referrals: true,
            accounts: true,
            sessions: true,
            agentApplications: true,
            adminInvitations: true,
            adminActions: true,
            reportedContent: true,
            rewards: true,
            reviews: true,
            businessRecommendations: true,
            businessViews: true,
            resolvedReports: true,
          },
          orderBy: { updatedAt: "desc" },
        }),
      ]);
      return {
        reportedReviews: reportedReviews as unknown as Review[],
        reportedUsers: reportedUsers as BaseUser[],
      };
    } catch (error) {
      throw new Error(
        `Failed to get reported content: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
