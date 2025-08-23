import { prisma } from "@/lib/prisma";
import { Coupon } from "@prisma/client";

export interface CouponCreateData {
  code: string;
  businessId: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minimumSpend?: number;
  maximumDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  isActive?: boolean;
}

export interface CouponUpdateData {
  code?: string;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  minimumSpend?: number;
  maximumDiscount?: number;
  validFrom?: Date;
  validUntil?: Date;
  maxUses?: number;
  isActive?: boolean;
}

export interface CouponUsageData {
  couponId: string;
  userId: string;
  businessId: string;
  amount: number;
  discountApplied: number;
}

export class CouponService {
  async createCoupon(data: CouponCreateData): Promise<Coupon> {
    try {
      const coupon = await prisma.coupon.create({
        data: {
          ...data,
          currentUses: 0,
        },
      });

      return coupon;
    } catch (error) {
      throw new Error(
        `Failed to create coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getCouponById(id: string): Promise<Coupon | null> {
    try {
      return await prisma.coupon.findUnique({
        where: { id },
        include: {
          business: true,
          usages: {
            include: {
              user: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getCouponByCode(
    code: string,
    businessId: string,
  ): Promise<Coupon | null> {
    try {
      return await prisma.coupon.findFirst({
        where: {
          code,
          businessId,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get coupon by code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateCoupon(id: string, data: CouponUpdateData): Promise<Coupon> {
    try {
      return await prisma.coupon.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new Error(
        `Failed to update coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async deleteCoupon(id: string): Promise<void> {
    try {
      await prisma.coupon.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getBusinessCoupons(businessId: string): Promise<Coupon[]> {
    try {
      return await prisma.coupon.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw new Error(
        `Failed to get business coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async validateCoupon(
    code: string,
    businessId: string,
    userId: string,
    amount: number,
  ): Promise<{
    isValid: boolean;
    coupon?: Coupon;
    discountAmount?: number;
    error?: string;
  }> {
    try {
      const coupon = await this.getCouponByCode(code, businessId);

      if (!coupon) {
        return { isValid: false, error: "Coupon not found" };
      }

      // Check if user has already used this coupon
      const existingUsage = await prisma.couponUsage.findFirst({
        where: {
          couponId: coupon.id,
          userId,
        },
      });

      if (existingUsage) {
        return { isValid: false, error: "Coupon already used by this user" };
      }

      // Check minimum spend
      if (coupon.minimumSpend && amount < coupon.minimumSpend) {
        return {
          isValid: false,
          error: `Minimum spend of ${coupon.minimumSpend} required`,
        };
      }

      // Check max uses
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return { isValid: false, error: "Coupon usage limit reached" };
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === "PERCENTAGE") {
        discountAmount = (amount * coupon.discountValue) / 100;
        if (coupon.maximumDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      return {
        isValid: true,
        coupon,
        discountAmount,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  async useCoupon(data: CouponUsageData): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Create usage record
        await tx.couponUsage.create({
          data: {
            couponId: data.couponId,
            userId: data.userId,
            businessId: data.businessId,
            amount: data.amount,
            discountApplied: data.discountApplied,
          },
        });

        // Increment usage count
        await tx.coupon.update({
          where: { id: data.couponId },
          data: {
            currentUses: {
              increment: 1,
            },
          },
        });
      });
    } catch (error) {
      throw new Error(
        `Failed to use coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getCouponStats(businessId: string): Promise<{
    totalCoupons: number;
    activeCoupons: number;
    totalUsage: number;
    totalDiscount: number;
  }> {
    try {
      const [totalCoupons, activeCoupons, totalUsage, totalDiscount] =
        await Promise.all([
          prisma.coupon.count({ where: { businessId } }),
          prisma.coupon.count({
            where: { businessId, isActive: true },
          }),
          prisma.couponUsage.count({ where: { businessId } }),
          prisma.couponUsage.aggregate({
            where: { businessId },
            _sum: { discountApplied: true },
          }),
        ]);

      return {
        totalCoupons,
        activeCoupons,
        totalUsage,
        totalDiscount: totalDiscount._sum.discountApplied || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get coupon stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
