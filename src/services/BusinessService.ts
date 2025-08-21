import {
  PrismaClient,
  Business,
  BusinessCategory,
  State,
  BusinessVerificationStatus,
  Coupon,
  Review,
  ReviewStatus,
  CouponStatus,
  CouponType,
} from "@prisma/client";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

export interface CreateBusinessData {
  name: string;
  description?: string;
  category: BusinessCategory;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: State;
  latitude?: number;
  longitude?: number;
  verificationDocuments?: string[];
}

export interface UpdateBusinessData {
  name?: string;
  description?: string;
  category?: BusinessCategory;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: State;
  latitude?: number;
  longitude?: number;
  logo?: string;
  coverImage?: string;
}

export interface CreateCouponData {
  title: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
}

export interface CreateReviewData {
  businessId: string;
  reviewerId: string;
  rating: number;
  content: string;
  images?: string[];
  video?: string;
}

export interface BusinessAnalyticsData {
  totalVisits: number;
  totalReviews: number;
  averageRating: number;
  activeCoupons: number;
  totalRevenue: number;
  monthlyGrowth: number;
  topPerformingCoupons: Array<{
    name: string;
    redemptions: number;
    revenue: number;
  }>;
  customerDemographics: Array<{
    ageGroup: string;
    percentage: number;
  }>;
  peakHours: Array<{
    hour: string;
    visits: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    visits: number;
    reviews: number;
    revenue: number;
  }>;
}

export class BusinessService {
  /**
   * Create a new business
   */
  static async createBusiness(
    ownerId: string,
    data: CreateBusinessData,
  ): Promise<Business> {
    try {
      logger.info(`Creating business for owner: ${ownerId}`, {
        businessName: data.name,
      });

      const business = await prisma.business.create({
        data: {
          ...data,
          ownerId,
          verificationDocuments: data.verificationDocuments || [],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // Create default business settings
      await prisma.businessSettings.create({
        data: {
          businessId: business.id,
        },
      });

      // Create default business hours (Monday-Friday, 9 AM - 5 PM)
      const defaultHours = [
        { dayOfWeek: 1, openTime: "09:00", closeTime: "17:00" }, // Monday
        { dayOfWeek: 2, openTime: "09:00", closeTime: "17:00" }, // Tuesday
        { dayOfWeek: 3, openTime: "09:00", closeTime: "17:00" }, // Wednesday
        { dayOfWeek: 4, openTime: "09:00", closeTime: "17:00" }, // Thursday
        { dayOfWeek: 5, openTime: "09:00", closeTime: "17:00" }, // Friday
        { dayOfWeek: 6, openTime: "10:00", closeTime: "16:00" }, // Saturday
        { dayOfWeek: 0, openTime: "12:00", closeTime: "18:00" }, // Sunday
      ];

      await prisma.businessHours.createMany({
        data: defaultHours.map((hour) => ({
          ...hour,
          businessId: business.id,
        })),
      });

      logger.info(`Business created successfully: ${business.id}`);
      return business;
    } catch (error) {
      logger.error("Failed to create business", { error, ownerId, data });
      throw new Error(
        `Failed to create business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get business by ID with full details
   */
  static async getBusinessById(businessId: string): Promise<Business | null> {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          businessHours: true,
          businessSettings: true,
          reviews: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          coupons: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      return business;
    } catch (error) {
      logger.error("Failed to get business by ID", { error, businessId });
      throw new Error(
        `Failed to get business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get business by owner ID
   */
  static async getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
    try {
      const business = await prisma.business.findUnique({
        where: { ownerId },
        include: {
          businessHours: true,
          businessSettings: true,
        },
      });

      return business;
    } catch (error) {
      logger.error("Failed to get business by owner ID", { error, ownerId });
      throw new Error(
        `Failed to get business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Update business information
   */
  static async updateBusiness(
    businessId: string,
    data: UpdateBusinessData,
  ): Promise<Business> {
    try {
      logger.info(`Updating business: ${businessId}`, {
        updates: Object.keys(data),
      });

      const business = await prisma.business.update({
        where: { id: businessId },
        data,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      logger.info(`Business updated successfully: ${businessId}`);
      return business;
    } catch (error) {
      logger.error("Failed to update business", { error, businessId, data });
      throw new Error(
        `Failed to update business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Create a new coupon
   */
  static async createCoupon(
    businessId: string,
    data: CreateCouponData,
  ): Promise<Coupon> {
    try {
      logger.info(`Creating coupon for business: ${businessId}`, {
        couponTitle: data.title,
      });

      // Generate unique coupon code
      const code = await this.generateUniqueCouponCode();

      const coupon = await prisma.coupon.create({
        data: {
          ...data,
          businessId,
          code,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      logger.info(`Coupon created successfully: ${coupon.id}`);
      return coupon;
    } catch (error) {
      logger.error("Failed to create coupon", { error, businessId, data });
      throw new Error(
        `Failed to create coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get all coupons for a business
   */
  static async getBusinessCoupons(businessId: string): Promise<Coupon[]> {
    try {
      const coupons = await prisma.coupon.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        include: {
          redemptions: {
            select: {
              id: true,
              redeemedAt: true,
              orderAmount: true,
              discountApplied: true,
            },
          },
        },
      });

      return coupons;
    } catch (error) {
      logger.error("Failed to get business coupons", { error, businessId });
      throw new Error(
        `Failed to get coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Update coupon status
   */
  static async updateCouponStatus(
    couponId: string,
    status: CouponStatus,
  ): Promise<Coupon> {
    try {
      const coupon = await prisma.coupon.update({
        where: { id: couponId },
        data: { status },
      });

      logger.info(`Coupon status updated: ${couponId} -> ${status}`);
      return coupon;
    } catch (error) {
      logger.error("Failed to update coupon status", {
        error,
        couponId,
        status,
      });
      throw new Error(
        `Failed to update coupon status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get all reviews for a business
   */
  static async getBusinessReviews(
    businessId: string,
    status?: ReviewStatus,
  ): Promise<Review[]> {
    try {
      const where: { businessId: string; status?: ReviewStatus } = {
        businessId,
      };
      if (status) {
        where.status = status;
      }

      const reviews = await prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return reviews;
    } catch (error) {
      logger.error("Failed to get business reviews", {
        error,
        businessId,
        status,
      });
      throw new Error(
        `Failed to get reviews: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Respond to a review
   */
  static async respondToReview(
    reviewId: string,
    businessId: string,
    response: string,
  ): Promise<Review> {
    try {
      logger.info(`Business responding to review: ${reviewId}`);

      const review = await prisma.review.update({
        where: {
          id: reviewId,
          businessId, // Ensure the business owns this review
        },
        data: {
          businessResponse: response,
          businessResponseDate: new Date(),
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      logger.info(`Review response added successfully: ${reviewId}`);
      return review;
    } catch (error) {
      logger.error("Failed to respond to review", {
        error,
        reviewId,
        businessId,
      });
      throw new Error(
        `Failed to respond to review: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get business analytics
   */
  static async getBusinessAnalytics(
    businessId: string,
    days: number = 30,
  ): Promise<BusinessAnalyticsData> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get business data
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: {
          totalVisits: true,
          totalReviews: true,
          averageRating: true,
        },
      });

      if (!business) {
        throw new Error("Business not found");
      }

      // Get coupons data
      const coupons = await prisma.coupon.findMany({
        where: {
          businessId,
          status: "ACTIVE",
        },
        select: {
          title: true,
          totalRedeemed: true,
          type: true,
          value: true,
        },
      });

      // Get analytics data
      const analytics = await prisma.businessAnalytics.findMany({
        where: {
          businessId,
          date: {
            gte: startDate,
          },
        },
        orderBy: { date: "asc" },
      });

      // Calculate top performing coupons
      const topPerformingCoupons = coupons
        .map((coupon) => ({
          name: coupon.title,
          redemptions: coupon.totalRedeemed,
          revenue:
            coupon.type === "PERCENTAGE"
              ? coupon.totalRedeemed * (coupon.value / 100) * 1000 // Assuming avg order value
              : coupon.totalRedeemed * coupon.value,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      // Mock data for demographics and peak hours (replace with real analytics)
      const customerDemographics = [
        { ageGroup: "18-25", percentage: 25 },
        { ageGroup: "26-35", percentage: 40 },
        { ageGroup: "36-45", percentage: 20 },
        { ageGroup: "46+", percentage: 15 },
      ];

      const peakHours = [
        { hour: "12:00 PM", visits: 89 },
        { hour: "1:00 PM", visits: 76 },
        { hour: "6:00 PM", visits: 92 },
        { hour: "7:00 PM", visits: 85 },
        { hour: "8:00 PM", visits: 78 },
      ];

      // Calculate monthly trends
      const monthlyTrends = analytics.map((day) => ({
        month: day.date.toLocaleDateString("en-US", { month: "short" }),
        visits: day.visits,
        reviews: day.reviews,
        revenue: day.revenue,
      }));

      // Calculate growth
      const currentMonth = analytics[analytics.length - 1];
      const previousMonth = analytics[analytics.length - 2];
      const monthlyGrowth = previousMonth
        ? ((currentMonth.visits - previousMonth.visits) /
            previousMonth.visits) *
          100
        : 0;

      return {
        totalVisits: business.totalVisits,
        totalReviews: business.totalReviews,
        averageRating: business.averageRating,
        activeCoupons: coupons.length,
        totalRevenue: analytics.reduce((sum, day) => sum + day.revenue, 0),
        monthlyGrowth,
        topPerformingCoupons,
        customerDemographics,
        peakHours,
        monthlyTrends,
      };
    } catch (error) {
      logger.error("Failed to get business analytics", {
        error,
        businessId,
        days,
      });
      throw new Error(
        `Failed to get analytics: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Update business settings
   */
  static async updateBusinessSettings(
    businessId: string,
    settings: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    try {
      const updatedSettings = await prisma.businessSettings.update({
        where: { businessId },
        data: settings,
      });

      logger.info(`Business settings updated: ${businessId}`);
      return updatedSettings;
    } catch (error) {
      logger.error("Failed to update business settings", {
        error,
        businessId,
        settings,
      });
      throw new Error(
        `Failed to update settings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get business settings
   */
  static async getBusinessSettings(
    businessId: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const settings = await prisma.businessSettings.findUnique({
        where: { businessId },
      });

      return settings;
    } catch (error) {
      logger.error("Failed to get business settings", { error, businessId });
      throw new Error(
        `Failed to get settings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Generate unique coupon code
   */
  private static async generateUniqueCouponCode(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code: string;
    let isUnique = false;

    do {
      code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const existingCoupon = await prisma.coupon.findUnique({
        where: { code },
      });

      isUnique = !existingCoupon;
    } while (!isUnique);

    return code;
  }

  /**
   * Record business visit
   */
  static async recordVisit(businessId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update business total visits
      await prisma.business.update({
        where: { id: businessId },
        data: {
          totalVisits: {
            increment: 1,
          },
        },
      });

      // Update daily analytics
      await prisma.businessAnalytics.upsert({
        where: {
          businessId_date: {
            businessId,
            date: today,
          },
        },
        update: {
          visits: {
            increment: 1,
          },
        },
        create: {
          businessId,
          date: today,
          visits: 1,
        },
      });

      logger.debug(`Visit recorded for business: ${businessId}`);
    } catch (error) {
      logger.error("Failed to record business visit", { error, businessId });
      // Don't throw error for visit recording as it's not critical
    }
  }
}
