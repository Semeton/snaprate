import { prisma } from "@/lib/prisma";
import { Coupon, CouponStatus, CouponType } from "@/types";
import { generateCouponCode } from "@/lib/utils";

export class CouponService {
  async createCoupon(couponData: {
    businessId: string;
    title: string;
    description?: string;
    discountType: CouponType;
    discountValue: number;
    minPurchase?: number;
    maxDiscount?: number;
    maxUses?: number;
    validFrom: Date;
    validUntil: Date;
  }): Promise<Coupon> {
    try {
      // Generate unique coupon code
      const code = await generateCouponCode();

      const coupon = await prisma.coupon.create({
        data: {
          code,
          title: couponData.title,
          description: couponData.description,
          type: couponData.discountType as CouponType,
          value: couponData.discountValue,
          minimumOrderAmount: couponData.minPurchase,
          maximumDiscount: couponData.maxDiscount,
          maxUses: couponData.maxUses,
          validFrom: couponData.validFrom,
          validUntil: couponData.validUntil,
          businessId: couponData.businessId,
          currentUses: 0,
          totalIssued: 0,
          totalRedeemed: 0,
          status: "DRAFT",
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      return coupon as unknown as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to create coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getBusinessCoupons(
    businessId: string,
    options: {
      page: number;
      limit: number;
      status: CouponStatus;
    },
  ) {
    try {
      const { page, limit, status } = options;
      const skip = (page - 1) * limit;

      const where: { businessId: string; status?: CouponStatus } = {
        businessId,
      };
      if (status) {
        where.status = status;
      }

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where: {
            businessId,
            status: status as CouponStatus,
          },
          include: {
            business: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.coupon.count({
          where: {
            businessId,
            status: status as CouponStatus,
          },
        }),
      ]);

      return {
        coupons: coupons as unknown as Coupon[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get business coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code },
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
      });

      return coupon as unknown as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to get coupon by code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async validateCoupon(
    code: string,
    purchaseAmount: number,
  ): Promise<{
    isValid: boolean;
    coupon?: Coupon;
    error?: string;
  }> {
    try {
      const coupon = await this.getCouponByCode(code);
      if (!coupon) {
        return { isValid: false, error: "Coupon not found" };
      }

      // Check if coupon is active
      if (coupon.status !== "ACTIVE") {
        return { isValid: false, error: "Coupon is not active" };
      }

      // Check validity dates
      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return { isValid: false, error: "Coupon is expired or not yet valid" };
      }

      // Check usage limits
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return { isValid: false, error: "Coupon usage limit reached" };
      }

      // Check minimum purchase requirement
      if (
        coupon.minimumOrderAmount &&
        purchaseAmount < coupon.minimumOrderAmount
      ) {
        return {
          isValid: false,
          error: `Minimum purchase amount of ₦${coupon.minimumOrderAmount} required`,
        };
      }

      return { isValid: true, coupon };
    } catch (error) {
      console.error(error);
      return {
        isValid: false,
        error: "Failed to validate coupon",
      };
    }
  }

  async useCoupon(code: string): Promise<Coupon> {
    try {
      const coupon = await prisma.coupon.update({
        where: { code },
        data: {
          currentUses: {
            increment: 1,
          },
          status: "USED" as CouponStatus,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      return coupon as unknown as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to use coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateCoupon(
    couponId: string,
    updateData: Partial<Coupon>,
  ): Promise<Coupon> {
    try {
      const coupon = await prisma.coupon.update({
        where: { id: couponId },
        data: {
          ...updateData,
          status: updateData.status as CouponStatus,
        },
        include: {
          business: true,
        },
      });

      return coupon as unknown as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to update coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async deleteCoupon(couponId: string): Promise<void> {
    try {
      await prisma.coupon.delete({
        where: { id: couponId },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getCouponStats(businessId: string) {
    try {
      const [totalCoupons, activeCoupons, usedCoupons, expiredCoupons] =
        await Promise.all([
          prisma.coupon.count({ where: { businessId } }),
          prisma.coupon.count({
            where: { businessId, status: "ACTIVE" },
          }),
          prisma.coupon.count({
            where: { businessId, status: "USED" },
          }),
          prisma.coupon.count({
            where: { businessId, status: "EXPIRED" as CouponStatus },
          }),
        ]);

      return {
        totalCoupons,
        activeCoupons,
        usedCoupons,
        expiredCoupons,
      };
    } catch (error) {
      throw new Error(
        `Failed to get coupon stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async generateQRCode(couponId: string): Promise<string> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        select: { code: true },
      });

      if (!coupon) {
        throw new Error("Coupon not found");
      }

      // In a real app, you'd generate an actual QR code
      // For now, we'll return a data URL that represents the coupon code
      const qrData = `https://snaprate.com/coupon/${coupon.code}`;

      // This is a placeholder - in production you'd use a QR code library
      return qrData;
    } catch (error) {
      throw new Error(
        `Failed to generate QR code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
