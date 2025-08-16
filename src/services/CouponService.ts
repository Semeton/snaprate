import { prisma } from "@/lib/prisma";
import { ICouponService } from "./interfaces";
import { Coupon, CouponStatus, Business } from "@/types";
import { generateCouponCode } from "@/lib/utils";

export class CouponService implements ICouponService {
  // Single Responsibility: This service only handles coupon-related operations

  async createCoupon(
    couponData: {
      title: string;
      description?: string;
      discountType: "PERCENTAGE" | "FIXED_AMOUNT";
      discountValue: number;
      minPurchase?: number;
      maxDiscount?: number;
      maxUses?: number;
      validFrom: Date;
      validUntil: Date;
    },
    businessId: string,
  ): Promise<Coupon> {
    try {
      // Validate discount values
      if (couponData.discountValue <= 0) {
        throw new Error("Discount value must be greater than 0");
      }

      if (
        couponData.discountType === "PERCENTAGE" &&
        couponData.discountValue > 100
      ) {
        throw new Error("Percentage discount cannot exceed 100%");
      }

      if (couponData.validUntil <= couponData.validFrom) {
        throw new Error("Valid until date must be after valid from date");
      }

      // Generate unique coupon code
      const code = await this.generateUniqueCouponCode();

      const coupon = await prisma.coupon.create({
        data: {
          code,
          title: couponData.title,
          description: couponData.description,
          discountType: couponData.discountType,
          discountValue: couponData.discountValue,
          minPurchase: couponData.minPurchase,
          maxDiscount: couponData.maxDiscount,
          maxUses: couponData.maxUses,
          validFrom: couponData.validFrom,
          validUntil: couponData.validUntil,
          status: CouponStatus.ACTIVE,
          businessId,
          currentUses: 0,
        },
        include: {
          business: true,
        },
      });

      return coupon as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to create coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findById(id: string): Promise<Coupon | null> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { id },
        include: {
          business: true,
        },
      });

      return coupon as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to find coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findByCode(code: string): Promise<Coupon | null> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code },
        include: {
          business: true,
        },
      });

      return coupon as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to find coupon by code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findByBusiness(
    businessId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Coupon[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where: { businessId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            business: true,
          },
        }),
        prisma.coupon.count({ where: { businessId } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: coupons as Coupon[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to find coupons by business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon> {
    try {
      // Remove fields that shouldn't be updated
      const { businessId, code, currentUses, ...updateData } = data;

      const coupon = await prisma.coupon.update({
        where: { id },
        data: updateData,
        include: {
          business: true,
        },
      });

      return coupon as Coupon;
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

  async validateCoupon(code: string, businessId: string): Promise<boolean> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code },
      });

      if (!coupon) {
        return false;
      }

      // Check if coupon belongs to the business
      if (coupon.businessId !== businessId) {
        return false;
      }

      // Check if coupon is active
      if (coupon.status !== CouponStatus.ACTIVE) {
        return false;
      }

      // Check if coupon is within validity period
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return false;
      }

      // Check usage limits
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async useCoupon(code: string, userId: string): Promise<Coupon> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code },
      });

      if (!coupon) {
        throw new Error("Coupon not found");
      }

      if (coupon.status !== CouponStatus.ACTIVE) {
        throw new Error("Coupon is not active");
      }

      // Check validity period
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        throw new Error("Coupon is not valid at this time");
      }

      // Check usage limits
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        throw new Error("Coupon usage limit exceeded");
      }

      // Mark coupon as used
      const updatedCoupon = await prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          currentUses: {
            increment: 1,
          },
          status:
            coupon.maxUses && coupon.currentUses + 1 >= coupon.maxUses
              ? CouponStatus.USED
              : CouponStatus.ACTIVE,
        },
        include: {
          business: true,
        },
      });

      return updatedCoupon as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to use coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async generateCouponCode(): Promise<string> {
    try {
      let code: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        code = generateCouponCode();

        const existingCoupon = await prisma.coupon.findUnique({
          where: { code },
        });

        if (!existingCoupon) {
          isUnique = true;
        }

        attempts++;
      }

      if (!isUnique) {
        throw new Error("Failed to generate unique coupon code");
      }

      return code!;
    } catch (error) {
      throw new Error(
        `Failed to generate coupon code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getCouponStats(businessId: string): Promise<{
    active: number;
    used: number;
    expired: number;
    total: number;
  }> {
    try {
      const [active, used, expired, total] = await Promise.all([
        prisma.coupon.count({
          where: {
            businessId,
            status: CouponStatus.ACTIVE,
            validUntil: {
              gt: new Date(),
            },
          },
        }),
        prisma.coupon.count({
          where: {
            businessId,
            status: CouponStatus.USED,
          },
        }),
        prisma.coupon.count({
          where: {
            businessId,
            OR: [
              { status: CouponStatus.EXPIRED },
              {
                status: CouponStatus.ACTIVE,
                validUntil: {
                  lte: new Date(),
                },
              },
            ],
          },
        }),
        prisma.coupon.count({
          where: { businessId },
        }),
      ]);

      return {
        active,
        used,
        expired,
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get coupon stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async expireExpiredCoupons(): Promise<void> {
    try {
      await prisma.coupon.updateMany({
        where: {
          status: CouponStatus.ACTIVE,
          validUntil: {
            lte: new Date(),
          },
        },
        data: {
          status: CouponStatus.EXPIRED,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to expire expired coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getActiveCoupons(businessId: string): Promise<Coupon[]> {
    try {
      const coupons = await prisma.coupon.findMany({
        where: {
          businessId,
          status: CouponStatus.ACTIVE,
          validUntil: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          business: true,
        },
      });

      return coupons as Coupon[];
    } catch (error) {
      throw new Error(
        `Failed to get active coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async searchCoupons(
    filters: {
      businessId?: string;
      status?: CouponStatus;
      discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
      minDiscountValue?: number;
      maxDiscountValue?: number;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Coupon[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: Record<string, unknown> = {};

      if (filters.businessId) {
        where.businessId = filters.businessId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.discountType) {
        where.discountType = filters.discountType;
      }

      if (filters.minDiscountValue) {
        where.discountValue = {
          gte: filters.minDiscountValue,
        };
      }

      if (filters.maxDiscountValue) {
        where.discountValue = {
          ...(where.discountValue as Record<string, unknown>),
          lte: filters.maxDiscountValue,
        };
      }

      const skip = (page - 1) * limit;

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            business: true,
          },
        }),
        prisma.coupon.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: coupons as Coupon[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to search coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  private async generateUniqueCouponCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = generateCouponCode();

      const existingCoupon = await prisma.coupon.findUnique({
        where: { code },
      });

      if (!existingCoupon) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      throw new Error("Failed to generate unique coupon code");
    }

    return code!;
  }
}
