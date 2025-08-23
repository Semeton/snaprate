import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export interface BusinessViewData {
  businessId: string;
  viewerId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  source?: "DIRECT" | "SEARCH" | "SOCIAL" | "REFERRAL" | "FEATURED";
  viewType?: "PROFILE" | "SEARCH_RESULT" | "FEATURED_LIST" | "RECOMMENDATION";
  sessionId?: string;
}

export interface BusinessViewStats {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  thisWeekViews: number;
  thisMonthViews: number;
  viewsBySource: Record<string, number>;
  viewsByType: Record<string, number>;
}

export class BusinessViewService {
  private static instance: BusinessViewService;

  private constructor() {}

  public static getInstance(): BusinessViewService {
    if (!BusinessViewService.instance) {
      BusinessViewService.instance = new BusinessViewService();
    }
    return BusinessViewService;
  }

  /**
   * Track a business view
   */
  public async trackView(viewData: BusinessViewData): Promise<void> {
    try {
      // Create the view record
      await prisma.businessView.create({
        data: {
          businessId: viewData.businessId,
          viewerId: viewData.viewerId,
          ipAddress: viewData.ipAddress,
          userAgent: viewData.userAgent,
          referrer: viewData.referrer,
          source: viewData.source || "DIRECT",
          viewType: viewData.viewType || "PROFILE",
          sessionId: viewData.sessionId,
        },
      });

      // Update business total visits
      await prisma.business.update({
        where: { id: viewData.businessId },
        data: {
          totalVisits: {
            increment: 1,
          },
        },
      });

      // Update daily analytics
      await this.updateDailyAnalytics(viewData.businessId);

      logger.info("Business view tracked successfully", { businessId: viewData.businessId });
    } catch (error) {
      logger.error("Failed to track business view", { error, viewData });
      throw error;
    }
  }

  /**
   * Update daily analytics for a business
   */
  private async updateDailyAnalytics(businessId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's views
      const todayViews = await prisma.businessView.count({
        where: {
          businessId,
          createdAt: {
            gte: today,
          },
        },
      });

      // Get unique visitors today
      const uniqueVisitors = await prisma.businessView.groupBy({
        by: ["viewerId"],
        where: {
          businessId,
          createdAt: {
            gte: today,
          },
        },
        _count: {
          viewerId: true,
        },
      });

      // Get total page views today
      const pageViews = await prisma.businessView.count({
        where: {
          businessId,
          createdAt: {
            gte: today,
          },
        },
      });

      // Get business data for rating
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          averageRating: true,
          totalReviews: true,
        },
      });

      // Upsert daily analytics
      await prisma.businessAnalytics.upsert({
        where: {
          businessId_date: {
            businessId,
            date: today,
          },
        },
        update: {
          visits: todayViews,
          uniqueVisitors: uniqueVisitors.length,
          pageViews,
          averageRating: business?.averageRating || 0,
          reviews: business?.totalReviews || 0,
        },
        create: {
          businessId,
          date: today,
          visits: todayViews,
          uniqueVisitors: uniqueVisitors.length,
          pageViews,
          averageRating: business?.averageRating || 0,
          reviews: business?.totalReviews || 0,
        },
      });
    } catch (error) {
      logger.error("Failed to update daily analytics", { error, businessId });
    }
  }

  /**
   * Get business view statistics
   */
  public async getBusinessViewStats(businessId: string): Promise<BusinessViewStats> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get total views
      const totalViews = await prisma.businessView.count({
        where: { businessId },
      });

      // Get unique visitors
      const uniqueVisitors = await prisma.businessView.groupBy({
        by: ["viewerId"],
        where: { businessId },
        _count: {
          viewerId: true,
        },
      });

      // Get today's views
      const todayViews = await prisma.businessView.count({
        where: {
          businessId,
          createdAt: { gte: today },
        },
      });

      // Get this week's views
      const thisWeekViews = await prisma.businessView.count({
        where: {
          businessId,
          createdAt: { gte: thisWeek },
        },
      });

      // Get this month's views
      const thisMonthViews = await prisma.businessView.count({
        where: {
          businessId,
          createdAt: { gte: thisMonth },
        },
      });

      // Get views by source
      const viewsBySource = await prisma.businessView.groupBy({
        by: ["source"],
        where: { businessId },
        _count: {
          source: true,
        },
      });

      // Get views by type
      const viewsByType = await prisma.businessView.groupBy({
        by: ["viewType"],
        where: { businessId },
        _count: {
          viewType: true,
        },
      });

      return {
        totalViews,
        uniqueVisitors: uniqueVisitors.length,
        todayViews,
        thisWeekViews,
        thisMonthViews,
        viewsBySource: viewsBySource.reduce((acc, item) => {
          acc[item.source] = item._count.source;
          return acc;
        }, {} as Record<string, number>),
        viewsByType: viewsByType.reduce((acc, item) => {
          acc[item.viewType] = item._count.viewType;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error("Failed to get business view stats", { error, businessId });
      throw error;
    }
  }

  /**
   * Get recent views for a business
   */
  public async getRecentViews(businessId: string, limit: number = 10): Promise<any[]> {
    try {
      return await prisma.businessView.findMany({
        where: { businessId },
        include: {
          viewer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      logger.error("Failed to get recent views", { error, businessId });
      throw error;
    }
  }

  /**
   * Get platform-wide view statistics
   */
  public async getPlatformViewStats(): Promise<any> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalViews, todayViews, thisWeekViews, thisMonthViews] = await Promise.all([
        prisma.businessView.count(),
        prisma.businessView.count({ where: { createdAt: { gte: today } } }),
        prisma.businessView.count({ where: { createdAt: { gte: thisWeek } } }),
        prisma.businessView.count({ where: { createdAt: { gte: thisMonth } } }),
      ]);

      return {
        totalViews,
        todayViews,
        thisWeekViews,
        thisMonthViews,
      };
    } catch (error) {
      logger.error("Failed to get platform view stats", { error });
      throw error;
    }
  }
}

export default BusinessViewService;
