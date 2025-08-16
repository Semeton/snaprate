import { prisma } from "@/lib/prisma";

export interface PlatformStats {
  totalUsers: number;
  totalBusinesses: number;
  totalReviews: number;
  totalRewards: number;
  topCategories: Array<{ category: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: "REVIEW" | "BUSINESS" | "USER" | "REWARD";
    title: string;
    description: string;
    timestamp: Date;
  }>;
}

export class PlatformStatsService {
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const [
        totalUsers,
        totalBusinesses,
        totalReviews,
        totalRewards,
        topCategories,
        recentReviews,
        recentBusinesses,
        recentUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.review.count(),
        prisma.reward.aggregate({
          _sum: { amount: true },
        }),
        prisma.business.groupBy({
          by: ["category"],
          _count: { category: true },
          orderBy: { _count: { category: "desc" } },
          take: 5,
        }),
        prisma.review.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true } },
            business: { select: { name: true } },
          },
        }),
        prisma.business.findMany({
          take: 2,
          orderBy: { createdAt: "desc" },
          select: { name: true, category: true },
        }),
        prisma.user.findMany({
          take: 2,
          orderBy: { createdAt: "desc" },
          select: { name: true, role: true },
        }),
      ]);

      // Build recent activity from real data
      const recentActivity = [
        ...recentReviews.map((review) => ({
          id: review.id,
          type: "REVIEW" as const,
          title: `New review for ${review.business.name}`,
          description: `by ${review.user.name}`,
          timestamp: review.createdAt,
        })),
        ...recentBusinesses.map((business) => ({
          id: business.name,
          type: "BUSINESS" as const,
          title: `New business: ${business.name}`,
          description: `Category: ${business.category}`,
          timestamp: new Date(), // We don't have createdAt in select
        })),
        ...recentUsers.map((user) => ({
          id: user.name,
          type: "USER" as const,
          title: `New user: ${user.name}`,
          description: `Role: ${user.role}`,
          timestamp: new Date(), // We don't have createdAt in select
        })),
      ]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);

      return {
        totalUsers,
        totalBusinesses,
        totalReviews,
        totalRewards: totalRewards._sum.amount || 0,
        topCategories: topCategories.map((cat) => ({
          category: cat.category,
          count: cat._count.category,
        })),
        recentActivity,
      };
    } catch (error) {
      // Return fallback data if database is not available
      console.error("Failed to fetch platform stats:", error);
      return {
        totalUsers: 0,
        totalBusinesses: 0,
        totalReviews: 0,
        totalRewards: 0,
        topCategories: [],
        recentActivity: [],
      };
    }
  }

  async getCategoryStats(): Promise<
    Array<{ category: string; count: number; demand: string }>
  > {
    try {
      const categories = await prisma.business.groupBy({
        by: ["category"],
        _count: { category: true },
      });

      // Calculate demand based on count
      const totalBusinesses = categories.reduce(
        (sum, cat) => sum + cat._count.category,
        0,
      );

      return categories
        .map((cat) => {
          const percentage = (cat._count.category / totalBusinesses) * 100;
          let demand = "Low";

          if (percentage > 25) demand = "High";
          else if (percentage > 10) demand = "Medium";

          return {
            category: cat.category,
            count: cat._count.category,
            demand,
          };
        })
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error("Failed to fetch category stats:", error);
      return [];
    }
  }
}
