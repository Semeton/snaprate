import { prisma } from "@/lib/prisma";
import { CouponStatus, CouponType } from "@/types";

export interface CouponAnalytics {
  totalCoupons: number;
  activeCoupons: number;
  redeemedCoupons: number;
  expiredCoupons: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  averageRedemptionRate: number;
  topPerformingCoupons: Array<{
    id: string;
    title: string;
    redemptions: number;
    discountGiven: number;
    redemptionRate: number;
  }>;
  redemptionTrends: Array<{
    date: string;
    redemptions: number;
    discountGiven: number;
  }>;
  couponTypeDistribution: Array<{
    type: CouponType;
    count: number;
    percentage: number;
  }>;
  monthlyStats: Array<{
    month: string;
    couponsCreated: number;
    redemptions: number;
    discountGiven: number;
  }>;
}

export interface BusinessCouponInsights {
  businessId: string;
  businessName: string;
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  averageRedemptionRate: number;
  customerAcquisition: number;
  revenueImpact: number;
  topPerformingCoupons: Array<{
    id: string;
    title: string;
    redemptions: number;
    discountGiven: number;
    redemptionRate: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    averageRedemptions: number;
  }>;
  seasonalTrends: Array<{
    period: string;
    redemptions: number;
    discountGiven: number;
  }>;
}

export class CouponAnalyticsService {
  /**
   * Get comprehensive coupon analytics for a business
   */
  static async getBusinessCouponAnalytics(
    businessId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CouponAnalytics> {
    try {
      const whereClause: any = { businessId };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      // Get basic coupon counts
      const [
        totalCoupons,
        activeCoupons,
        redeemedCoupons,
        expiredCoupons,
        redemptions,
      ] = await Promise.all([
        prisma.coupon.count({ where: whereClause }),
        prisma.coupon.count({
          where: { ...whereClause, status: CouponStatus.ACTIVE },
        }),
        prisma.coupon.count({
          where: { ...whereClause, status: CouponStatus.USED },
        }),
        prisma.coupon.count({
          where: { ...whereClause, status: CouponStatus.EXPIRED },
        }),
        prisma.couponRedemption.findMany({
          where: {
            coupon: whereClause,
          },
          include: {
            coupon: {
              select: {
                id: true,
                title: true,
                type: true,
                value: true,
                maxUses: true,
                currentUses: true,
              },
            },
          },
        }),
      ]);

      // Calculate total discount given
      const totalDiscountGiven = redemptions.reduce((sum, redemption) => {
        return sum + redemption.discountApplied;
      }, 0);

      // Calculate average redemption rate
      const averageRedemptionRate =
        totalCoupons > 0 ? (redemptions.length / totalCoupons) * 100 : 0;

      // Get top performing coupons
      const couponPerformance = new Map();
      redemptions.forEach((redemption) => {
        const couponId = redemption.coupon.id;
        if (!couponPerformance.has(couponId)) {
          couponPerformance.set(couponId, {
            id: couponId,
            title: redemption.coupon.title,
            redemptions: 0,
            discountGiven: 0,
            redemptionRate: 0,
          });
        }
        const performance = couponPerformance.get(couponId);
        performance.redemptions += 1;
        performance.discountGiven += redemption.discountApplied;
      });

      // Calculate redemption rates for each coupon
      const coupons = await prisma.coupon.findMany({
        where: whereClause,
        select: {
          id: true,
          maxUses: true,
          currentUses: true,
        },
      });

      coupons.forEach((coupon) => {
        const performance = couponPerformance.get(coupon.id);
        if (performance) {
          const maxUses = coupon.maxUses || 1;
          performance.redemptionRate =
            (performance.redemptions / maxUses) * 100;
        }
      });

      const topPerformingCoupons = Array.from(couponPerformance.values())
        .sort((a, b) => b.redemptions - a.redemptions)
        .slice(0, 10);

      // Get redemption trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const redemptionTrends = await prisma.couponRedemption.groupBy({
        by: ["redeemedAt"],
        where: {
          coupon: whereClause,
          redeemedAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
        _sum: { discountApplied: true },
        orderBy: { redeemedAt: "asc" },
      });

      const trends = redemptionTrends.map((trend) => ({
        date: trend.redeemedAt.toISOString().split("T")[0],
        redemptions: trend._count.id,
        discountGiven: trend._sum.discountApplied || 0,
      }));

      // Get coupon type distribution
      const typeDistribution = await prisma.coupon.groupBy({
        by: ["type"],
        where: whereClause,
        _count: { id: true },
      });

      const couponTypeDistribution = typeDistribution.map((dist) => ({
        type: dist.type,
        count: dist._count.id,
        percentage:
          totalCoupons > 0 ? (dist._count.id / totalCoupons) * 100 : 0,
      }));

      // Get monthly stats (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyCoupons = await prisma.coupon.groupBy({
        by: ["createdAt"],
        where: {
          ...whereClause,
          createdAt: { gte: twelveMonthsAgo },
        },
        _count: { id: true },
      });

      const monthlyRedemptions = await prisma.couponRedemption.groupBy({
        by: ["redeemedAt"],
        where: {
          coupon: whereClause,
          redeemedAt: { gte: twelveMonthsAgo },
        },
        _count: { id: true },
        _sum: { discountApplied: true },
      });

      // Combine monthly data
      const monthlyStatsMap = new Map();

      monthlyCoupons.forEach((month) => {
        const monthKey = month.createdAt.toISOString().substring(0, 7); // YYYY-MM
        monthlyStatsMap.set(monthKey, {
          month: monthKey,
          couponsCreated: month._count.id,
          redemptions: 0,
          discountGiven: 0,
        });
      });

      monthlyRedemptions.forEach((month) => {
        const monthKey = month.redeemedAt.toISOString().substring(0, 7);
        const existing = monthlyStatsMap.get(monthKey) || {
          month: monthKey,
          couponsCreated: 0,
          redemptions: 0,
          discountGiven: 0,
        };
        existing.redemptions = month._count.id;
        existing.discountGiven = month._sum.discountApplied || 0;
        monthlyStatsMap.set(monthKey, existing);
      });

      const monthlyStats = Array.from(monthlyStatsMap.values()).sort((a, b) =>
        a.month.localeCompare(b.month),
      );

      return {
        totalCoupons,
        activeCoupons,
        redeemedCoupons,
        expiredCoupons,
        totalRedemptions: redemptions.length,
        totalDiscountGiven,
        averageRedemptionRate,
        topPerformingCoupons,
        redemptionTrends: trends,
        couponTypeDistribution,
        monthlyStats,
      };
    } catch (error) {
      throw new Error(
        `Failed to get coupon analytics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get business insights for coupon performance
   */
  static async getBusinessInsights(
    businessId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BusinessCouponInsights> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true },
      });

      if (!business) {
        throw new Error("Business not found");
      }

      const analytics = await this.getBusinessCouponAnalytics(
        businessId,
        startDate,
        endDate,
      );

      // Calculate customer acquisition (unique users who redeemed coupons)
      const uniqueCustomers = await prisma.couponRedemption.findMany({
        where: {
          coupon: { businessId },
          ...(startDate || endDate
            ? {
                redeemedAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        select: { userId: true },
        distinct: ["userId"],
      });

      // Calculate revenue impact (estimated based on discount given)
      const revenueImpact = analytics.totalDiscountGiven * 3; // Assume 3x multiplier

      // Get customer segments based on redemption frequency
      const customerRedemptions = await prisma.couponRedemption.groupBy({
        by: ["userId"],
        where: {
          coupon: { businessId },
          ...(startDate || endDate
            ? {
                redeemedAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        _count: { id: true },
      });

      const customerSegments = [
        {
          segment: "One-time",
          count: customerRedemptions.filter((c) => c._count.id === 1).length,
          averageRedemptions: 1,
        },
        {
          segment: "Regular (2-5)",
          count: customerRedemptions.filter(
            (c) => c._count.id >= 2 && c._count.id <= 5,
          ).length,
          averageRedemptions: 3.5,
        },
        {
          segment: "Frequent (6+)",
          count: customerRedemptions.filter((c) => c._count.id > 5).length,
          averageRedemptions: 8,
        },
      ];

      // Get seasonal trends (by quarter)
      const quarterlyRedemptions = await prisma.couponRedemption.groupBy({
        by: ["redeemedAt"],
        where: {
          coupon: { businessId },
          ...(startDate || endDate
            ? {
                redeemedAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        _count: { id: true },
        _sum: { discountApplied: true },
      });

      const seasonalTrends = quarterlyRedemptions.map((quarter) => {
        const date = new Date(quarter.redeemedAt);
        const quarterNum = Math.floor(date.getMonth() / 3) + 1;
        return {
          period: `Q${quarterNum} ${date.getFullYear()}`,
          redemptions: quarter._count.id,
          discountGiven: quarter._sum.discountApplied || 0,
        };
      });

      return {
        businessId: business.id,
        businessName: business.name,
        totalCoupons: analytics.totalCoupons,
        activeCoupons: analytics.activeCoupons,
        totalRedemptions: analytics.totalRedemptions,
        totalDiscountGiven: analytics.totalDiscountGiven,
        averageRedemptionRate: analytics.averageRedemptionRate,
        customerAcquisition: uniqueCustomers.length,
        revenueImpact,
        topPerformingCoupons: analytics.topPerformingCoupons,
        customerSegments,
        seasonalTrends,
      };
    } catch (error) {
      throw new Error(
        `Failed to get business insights: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Export analytics data to CSV
   */
  static async exportAnalyticsToCSV(
    businessId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    try {
      const analytics = await this.getBusinessCouponAnalytics(
        businessId,
        startDate,
        endDate,
      );

      const csvRows = [
        // Header
        ["Metric", "Value", "Period", "Generated At"],
        // Basic metrics
        [
          "Total Coupons",
          analytics.totalCoupons.toString(),
          "All Time",
          new Date().toISOString(),
        ],
        [
          "Active Coupons",
          analytics.activeCoupons.toString(),
          "All Time",
          new Date().toISOString(),
        ],
        [
          "Redeemed Coupons",
          analytics.redeemedCoupons.toString(),
          "All Time",
          new Date().toISOString(),
        ],
        [
          "Expired Coupons",
          analytics.expiredCoupons.toString(),
          "All Time",
          new Date().toISOString(),
        ],
        [
          "Total Redemptions",
          analytics.totalRedemptions.toString(),
          "All Time",
          new Date().toISOString(),
        ],
        [
          "Total Discount Given",
          analytics.totalDiscountGiven.toString(),
          "All Time",
          new Date().toISOString(),
        ],
        [
          "Average Redemption Rate",
          `${analytics.averageRedemptionRate.toFixed(2)}%`,
          "All Time",
          new Date().toISOString(),
        ],
        // Empty row
        ["", "", "", ""],
        // Top performing coupons
        ["Top Performing Coupons", "", "", ""],
        ["Coupon Title", "Redemptions", "Discount Given", "Redemption Rate"],
        ...analytics.topPerformingCoupons.map((coupon) => [
          coupon.title,
          coupon.redemptions.toString(),
          coupon.discountGiven.toString(),
          `${coupon.redemptionRate.toFixed(2)}%`,
        ]),
        // Empty row
        ["", "", "", ""],
        // Monthly stats
        ["Monthly Statistics", "", "", ""],
        ["Month", "Coupons Created", "Redemptions", "Discount Given"],
        ...analytics.monthlyStats.map((month) => [
          month.month,
          month.couponsCreated.toString(),
          month.redemptions.toString(),
          month.discountGiven.toString(),
        ]),
      ];

      return csvRows.map((row) => row.join(",")).join("\n");
    } catch (error) {
      throw new Error(
        `Failed to export analytics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
