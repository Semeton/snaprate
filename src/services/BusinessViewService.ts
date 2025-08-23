import { prisma } from "@/lib/prisma";
import { BusinessView } from "@prisma/client";

export class BusinessViewService {
  async trackView(
    businessId: string,
    viewerId?: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
      source?: string;
      viewType?: string;
      sessionId?: string;
    },
  ): Promise<BusinessView> {
    try {
      const view = await prisma.businessView.create({
        data: {
          businessId,
          viewerId,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
          referrer: metadata?.referrer,
          source: metadata?.source || "DIRECT",
          viewType: metadata?.viewType || "PROFILE",
          sessionId: metadata?.sessionId,
        },
      });

      return view;
    } catch (error) {
      throw new Error(
        `Failed to track business view: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getBusinessViews(
    businessId: string,
    page: number = 1,
    limit: number = 50,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      source?: string;
      viewType?: string;
    },
  ): Promise<{
    data: BusinessView[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;
      const where: Record<string, unknown> = { businessId };

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          (where.createdAt as Record<string, unknown>).gte = filters.startDate;
        }
        if (filters.endDate) {
          (where.createdAt as Record<string, unknown>).lte = filters.endDate;
        }
      }

      if (filters?.source) {
        where.source = filters.source;
      }

      if (filters?.viewType) {
        where.viewType = filters.viewType;
      }

      const [views, total] = await Promise.all([
        prisma.businessView.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            viewer: true,
          },
        }),
        prisma.businessView.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: views,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get business views: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getBusinessAnalytics(
    businessId: string,
    period: "day" | "week" | "month" | "year" = "month",
  ): Promise<{
    totalViews: number;
    uniqueVisitors: number;
    averageViewsPerDay: number;
    topSources: Array<{ source: string; count: number }>;
    topViewTypes: Array<{ viewType: string; count: number }>;
    viewsByDate: Array<{ date: string; views: number }>;
  }> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "day":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const [
        totalViews,
        uniqueVisitors,
        topSources,
        topViewTypes,
        viewsByDate,
      ] = await Promise.all([
        prisma.businessView.count({
          where: {
            businessId,
            createdAt: { gte: startDate },
          },
        }),
        prisma.businessView.groupBy({
          by: ["viewerId"],
          where: {
            businessId,
            createdAt: { gte: startDate },
          },
          _count: { viewerId: true },
        }),
        prisma.businessView.groupBy({
          by: ["source"],
          where: {
            businessId,
            createdAt: { gte: startDate },
          },
          _count: { source: true },
          orderBy: { _count: { source: "desc" } },
          take: 5,
        }),
        prisma.businessView.groupBy({
          by: ["viewType"],
          where: {
            businessId,
            createdAt: { gte: startDate },
          },
          _count: { viewType: true },
          orderBy: { _count: { viewType: "desc" } },
          take: 5,
        }),
        prisma.businessView.groupBy({
          by: ["createdAt"],
          where: {
            businessId,
            createdAt: { gte: startDate },
          },
          _count: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      const daysDiff = Math.ceil(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const averageViewsPerDay = daysDiff > 0 ? totalViews / daysDiff : 0;

      return {
        totalViews,
        uniqueVisitors: uniqueVisitors.length,
        averageViewsPerDay: Math.round(averageViewsPerDay * 100) / 100,
        topSources: topSources.map((source) => ({
          source: source.source,
          count: source._count.source,
        })),
        topViewTypes: topViewTypes.map((viewType) => ({
          viewType: viewType.viewType,
          count: viewType._count.viewType,
        })),
        viewsByDate: viewsByDate.map((view) => ({
          date: view.createdAt.toISOString().split("T")[0],
          views: view._count.createdAt,
        })),
      };
    } catch (error) {
      throw new Error(
        `Failed to get business analytics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getPopularBusinesses(
    limit: number = 10,
    period: "day" | "week" | "month" = "month",
  ): Promise<
    Array<{
      businessId: string;
      businessName: string;
      totalViews: number;
      uniqueVisitors: number;
    }>
  > {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "day":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const popularBusinesses = await prisma.businessView.groupBy({
        by: ["businessId"],
        where: {
          createdAt: { gte: startDate },
        },
        _count: { businessId: true },
        orderBy: { _count: { businessId: "desc" } },
        take: limit,
      });

      const businessDetails = await Promise.all(
        popularBusinesses.map(async (business) => {
          const businessInfo = await prisma.business.findUnique({
            where: { id: business.businessId },
            select: { name: true },
          });

          const uniqueVisitors = await prisma.businessView.groupBy({
            by: ["viewerId"],
            where: {
              businessId: business.businessId,
              createdAt: { gte: startDate },
            },
            _count: { viewerId: true },
          });

          return {
            businessId: business.businessId,
            businessName: businessInfo?.name || "Unknown Business",
            totalViews: business._count.businessId,
            uniqueVisitors: uniqueVisitors.length,
          };
        }),
      );

      return businessDetails;
    } catch (error) {
      throw new Error(
        `Failed to get popular businesses: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateViewDuration(
    viewId: string,
    duration: number,
  ): Promise<BusinessView> {
    try {
      const view = await prisma.businessView.update({
        where: { id: viewId },
        data: { duration },
      });

      return view;
    } catch (error) {
      throw new Error(
        `Failed to update view duration: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async deleteOldViews(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.businessView.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      return result.count;
    } catch (error) {
      throw new Error(
        `Failed to delete old views: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
