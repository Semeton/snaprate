import { prisma } from "@/lib/prisma";
import {
  Coupon,
  CouponStatus,
  CouponType,
  CouponUseType,
  CouponVisibility,
  RedemptionMethod,
  CouponCreationData,
  CouponAssignmentData,
  CouponVerificationData,
  CouponClaim,
  CouponClaimData,
} from "@/types";
import {
  generateCouponCode,
  generateUserSpecificCouponCode,
  extractUserIdentifierFromCode,
} from "@/lib/utils";
import { QRCodeService, CouponPDFData } from "./QRCodeService";

export class CouponService {
  async createCoupon(couponData: CouponCreationData): Promise<Coupon> {
    try {
      // Check if business has more than 5 active coupons
      const activeCouponsCount = await prisma.coupon.count({
        where: {
          businessId: couponData.businessId,
          status: "ACTIVE",
        },
      });

      if (activeCouponsCount >= 5) {
        throw new Error(
          "Business cannot have more than 5 active coupons at the same time",
        );
      }

      // Check if business already has a coupon with the same value
      const existingCoupon = await prisma.coupon.findFirst({
        where: {
          businessId: couponData.businessId,
          value: couponData.value,
          status: "ACTIVE",
        },
      });

      if (existingCoupon) {
        throw new Error(
          "Business already has an active coupon with this value",
        );
      }

      // Generate unique base coupon code
      let baseCode: string;
      let isUnique = false;

      while (!isUnique) {
        baseCode = generateCouponCode();
        const existing = await prisma.coupon.findUnique({
          where: { baseCode },
        });
        if (!existing) {
          isUnique = true;
        }
      }

      const coupon = await prisma.coupon.create({
        data: {
          baseCode: baseCode!,
          title: couponData.title,
          description: couponData.description,
          type: couponData.type as CouponType,
          value: couponData.value,
          minimumOrderAmount: couponData.minimumOrderAmount,
          maximumDiscount: couponData.maximumDiscount,
          maxUses: couponData.maxUses,
          validFrom: couponData.validFrom,
          validUntil: couponData.validUntil,
          businessId: couponData.businessId,
          currentUses: 0,
          totalIssued: 0,
          totalRedeemed: 0,
          status: "DRAFT",

          // Advanced restrictions
          useType: couponData.useType || CouponUseType.SINGLE_USE,
          allowedDaysOfWeek: couponData.allowedDaysOfWeek || [],
          allowedTimeStart: couponData.allowedTimeStart,
          allowedTimeEnd: couponData.allowedTimeEnd,
          cannotCombineWithOtherCoupons:
            couponData.cannotCombineWithOtherCoupons ?? true,
          requiresIdVerification: couponData.requiresIdVerification ?? false,
          maxUsesPerUser: couponData.maxUsesPerUser || 1,

          // Visibility control
          visibility: couponData.visibility || CouponVisibility.PUBLIC,
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

  async assignCouponToUser(
    assignmentData: CouponAssignmentData,
  ): Promise<Coupon> {
    try {
      const { couponId, userId } = assignmentData;

      // Get the coupon and user
      const [coupon, user] = await Promise.all([
        prisma.coupon.findUnique({
          where: { id: couponId },
          include: { business: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { userIdentifier: true },
        }),
      ]);

      if (!coupon) {
        throw new Error("Coupon not found");
      }

      if (!user) {
        throw new Error("User not found");
      }

      if (coupon.status !== "ACTIVE") {
        throw new Error("Coupon is not active");
      }

      if (coupon.assignedUserId) {
        throw new Error("Coupon is already assigned to a user");
      }

      // Generate user-specific code
      const userSpecificCode = generateUserSpecificCouponCode(
        coupon.baseCode!,
        user.userIdentifier!,
      );

      // Check if user-specific code already exists
      const existingCode = await prisma.coupon.findUnique({
        where: { userSpecificCode },
      });

      if (existingCode) {
        throw new Error("User-specific coupon code already exists");
      }

      // Update coupon with user assignment
      const updatedCoupon = await prisma.coupon.update({
        where: { id: couponId },
        data: {
          userSpecificCode,
          assignedUserId: userId,
          assignedAt: new Date(),
          totalIssued: { increment: 1 },
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              userIdentifier: true,
            },
          },
        },
      });

      return updatedCoupon as unknown as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to assign coupon to user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async validateCoupon(
    code: string,
    purchaseAmount: number = 0,
    userId?: string,
  ): Promise<{
    isValid: boolean;
    coupon?: Coupon;
    error?: string;
    discountAmount?: number;
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

      // Check day of week restrictions
      if (coupon.allowedDaysOfWeek.length > 0) {
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        if (!coupon.allowedDaysOfWeek.includes(currentDay)) {
          return {
            isValid: false,
            error: "Coupon cannot be used on this day of the week",
          };
        }
      }

      // Check time restrictions
      if (coupon.allowedTimeStart && coupon.allowedTimeEnd) {
        const currentTime = now.toTimeString().slice(0, 5); // Format: "HH:MM"
        if (
          currentTime < coupon.allowedTimeStart ||
          currentTime > coupon.allowedTimeEnd
        ) {
          return {
            isValid: false,
            error: "Coupon cannot be used at this time",
          };
        }
      }

      // Check user-specific restrictions
      if (coupon.assignedUserId && userId) {
        if (coupon.assignedUserId !== userId) {
          return {
            isValid: false,
            error: "Coupon is not assigned to this user",
          };
        }

        // Check per-user usage limits
        if (coupon.maxUsesPerUser) {
          const userUsageCount = await prisma.couponRedemption.count({
            where: {
              couponId: coupon.id,
              userId,
            },
          });
          if (userUsageCount >= coupon.maxUsesPerUser) {
            return {
              isValid: false,
              error:
                "You have already used this coupon the maximum number of times",
            };
          }
        }
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (coupon.type === CouponType.PERCENTAGE) {
        discountAmount = (purchaseAmount * coupon.value) / 100;
        if (coupon.maximumDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
        }
      } else {
        discountAmount = coupon.value;
      }

      return {
        isValid: true,
        coupon,
        discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      };
    } catch (error) {
      console.error(error);
      return {
        isValid: false,
        error: "Failed to validate coupon",
      };
    }
  }

  async redeemCoupon(verificationData: CouponVerificationData): Promise<{
    success: boolean;
    redemption?: unknown;
    error?: string;
  }> {
    try {
      const {
        code,
        orderAmount = 0,
        redemptionMethod,
        staffNotes,
        idVerified = false,
      } = verificationData;

      // Validate the coupon
      const validation = await this.validateCoupon(code, orderAmount);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const coupon = validation.coupon!;
      const discountAmount = validation.discountAmount!;

      // Extract user identifier from code
      const userIdentifier = extractUserIdentifierFromCode(code);
      if (!userIdentifier) {
        return { success: false, error: "Invalid coupon code format" };
      }

      // Find user by identifier
      const user = await prisma.user.findFirst({
        where: { userIdentifier },
      });

      if (!user) {
        return { success: false, error: "User not found for this coupon" };
      }

      // Check if coupon is assigned to this user
      if (coupon.assignedUserId && coupon.assignedUserId !== user.id) {
        return { success: false, error: "Coupon is not assigned to this user" };
      }

      // Create redemption record
      const redemption = await prisma.couponRedemption.create({
        data: {
          couponId: coupon.id,
          userId: user.id,
          orderAmount,
          discountApplied: discountAmount,
          redemptionMethod: redemptionMethod as RedemptionMethod,
          staffNotes,
          idVerified,
          verificationCode: code,
        },
        include: {
          coupon: {
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              userIdentifier: true,
            },
          },
        },
      });

      // Update coupon usage
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          currentUses: { increment: 1 },
          totalRedeemed: { increment: 1 },
          status:
            coupon.useType === CouponUseType.SINGLE_USE ? "USED" : "ACTIVE",
        },
      });

      return { success: true, redemption };
    } catch (error) {
      console.error("Failed to redeem coupon:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to redeem coupon",
      };
    }
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    try {
      // Try to find by user-specific code first
      let coupon = await prisma.coupon.findUnique({
        where: { userSpecificCode: code },
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
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              userIdentifier: true,
            },
          },
        },
      });

      // If not found, try base code
      if (!coupon) {
        coupon = await prisma.coupon.findUnique({
          where: { baseCode: code },
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
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                userIdentifier: true,
              },
            },
          },
        });
      }

      return coupon as unknown as Coupon;
    } catch (error) {
      throw new Error(
        `Failed to get coupon by code: ${
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
      status?: CouponStatus;
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
          where,
          include: {
            business: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
                userIdentifier: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.coupon.count({ where }),
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

  async getUserCoupons(userId: string) {
    try {
      const coupons = await prisma.coupon.findMany({
        where: {
          assignedUserId: userId,
          status: "ACTIVE",
        },
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
        orderBy: { createdAt: "desc" },
      });

      return coupons as unknown as Coupon[];
    } catch (error) {
      throw new Error(
        `Failed to get user coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async generateQRCode(couponId: string): Promise<string> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        select: { userSpecificCode: true, baseCode: true },
      });

      if (!coupon) {
        throw new Error("Coupon not found");
      }

      // Use user-specific code if available, otherwise use base code
      const code = coupon.userSpecificCode || coupon.baseCode!;
      return await QRCodeService.generateVerificationQRCode(code);
    } catch (error) {
      throw new Error(
        `Failed to generate QR code: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async generateCouponPDF(couponId: string): Promise<Buffer> {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              userIdentifier: true,
            },
          },
        },
      });

      if (!coupon) {
        throw new Error("Coupon not found");
      }

      const code = coupon.userSpecificCode || coupon.baseCode!;
      const value =
        coupon.type === CouponType.PERCENTAGE
          ? `${coupon.value}% off`
          : `₦${coupon.value.toLocaleString()} off`;

      const pdfData: CouponPDFData = {
        couponCode: code,
        businessName: coupon.business.name,
        couponTitle: coupon.title,
        couponDescription: coupon.description || undefined,
        couponValue: value,
        validUntil: coupon.validUntil.toLocaleDateString(),
        userIdentifier: coupon.assignedUser?.userIdentifier || undefined,
        userName: coupon.assignedUser?.name || undefined,
      };

      return await QRCodeService.generateCouponPDF(pdfData);
    } catch (error) {
      throw new Error(
        `Failed to generate coupon PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getCouponStats(businessId: string) {
    try {
      const [
        totalCoupons,
        activeCoupons,
        usedCoupons,
        expiredCoupons,
        assignedCoupons,
      ] = await Promise.all([
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
        prisma.coupon.count({
          where: {
            businessId,
            assignedUserId: { not: null },
            status: "ACTIVE",
          },
        }),
      ]);

      return {
        totalCoupons,
        activeCoupons,
        usedCoupons,
        expiredCoupons,
        assignedCoupons,
      };
    } catch (error) {
      throw new Error(
        `Failed to get coupon stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  // New methods for public/private coupon handling and review requirements

  /**
   * Check if user has ever claimed a coupon from a specific business
   */
  async hasUserClaimedFromBusiness(
    userId: string,
    businessId: string,
  ): Promise<boolean> {
    try {
      const claimCount = await prisma.couponClaim.count({
        where: {
          userId,
          businessId,
        },
      });

      return claimCount > 0;
    } catch (error) {
      throw new Error(
        `Failed to check user claim history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Check if user has reviewed a specific business
   */
  async hasUserReviewedBusiness(
    userId: string,
    businessId: string,
  ): Promise<boolean> {
    try {
      const reviewCount = await prisma.review.count({
        where: {
          reviewerId: userId,
          businessId,
          status: { in: ["APPROVED", "VERIFIED"] },
        },
      });

      return reviewCount > 0;
    } catch (error) {
      throw new Error(
        `Failed to check user review history: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Claim a public coupon (with review requirement validation)
   */
  async claimPublicCoupon(claimData: CouponClaimData): Promise<CouponClaim> {
    try {
      // Get the coupon details
      const coupon = await prisma.coupon.findUnique({
        where: { id: claimData.couponId },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              isVerified: true,
            },
          },
        },
      });

      if (!coupon) {
        throw new Error("Coupon not found");
      }

      // Check if coupon is public
      if (coupon.visibility !== "PUBLIC") {
        throw new Error("This coupon is not available for public claiming");
      }

      // Check if business is verified
      if (!coupon.business.isVerified) {
        throw new Error("Cannot claim coupons from unverified businesses");
      }

      // Check if coupon is active
      if (coupon.status !== "ACTIVE") {
        throw new Error("Coupon is not active");
      }

      // Check if coupon is still valid
      const now = new Date();
      if (coupon.validFrom > now || coupon.validUntil < now) {
        throw new Error("Coupon is not currently valid");
      }

      // Check if coupon has remaining uses
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        throw new Error("Coupon has reached maximum usage limit");
      }

      // Check if user has already claimed this coupon
      const existingClaim = await prisma.couponClaim.findUnique({
        where: {
          couponId_userId: {
            couponId: claimData.couponId,
            userId: claimData.userId,
          },
        },
      });

      if (existingClaim) {
        throw new Error("You have already claimed this coupon");
      }

      // Check if user has claimed from this business before
      const hasClaimedBefore = await this.hasUserClaimedFromBusiness(
        claimData.userId,
        claimData.businessId,
      );

      // If user has claimed before, check if they have reviewed the business
      if (hasClaimedBefore) {
        const hasReviewed = await this.hasUserReviewedBusiness(
          claimData.userId,
          claimData.businessId,
        );

        if (!hasReviewed) {
          throw new Error(
            "You must review this business before claiming another coupon",
          );
        }
      }

      // Create the claim record
      const claim = await prisma.couponClaim.create({
        data: {
          couponId: claimData.couponId,
          userId: claimData.userId,
          businessId: claimData.businessId,
          requiresReview: hasClaimedBefore,
          reviewCompleted: hasClaimedBefore,
        },
        include: {
          coupon: {
            include: {
              business: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          business: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      });

      // Update coupon usage count
      await prisma.coupon.update({
        where: { id: claimData.couponId },
        data: {
          currentUses: { increment: 1 },
          totalIssued: { increment: 1 },
        },
      });

      return claim as unknown as CouponClaim;
    } catch (error) {
      throw new Error(
        `Failed to claim coupon: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get public coupons for a business (for discovery)
   */
  async getPublicCouponsForBusiness(
    businessId: string,
    options: {
      page?: number;
      limit?: number;
      status?: CouponStatus;
    } = {},
  ): Promise<{
    coupons: Coupon[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 10, status = "ACTIVE" } = options;
      const skip = (page - 1) * limit;

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where: {
            businessId,
            visibility: "PUBLIC",
            status,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() },
          },
          include: {
            business: {
              select: {
                id: true,
                name: true,
                category: true,
                isVerified: true,
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
            visibility: "PUBLIC",
            status,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() },
          },
        }),
      ]);

      return {
        coupons: coupons as unknown as Coupon[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(
        `Failed to get public coupons: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  /**
   * Get user's coupon claims with review status
   */
  async getUserCouponClaims(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      businessId?: string;
    } = {},
  ): Promise<{
    claims: CouponClaim[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page = 1, limit = 10, businessId } = options;
      const skip = (page - 1) * limit;

      const whereClause: { userId: string; businessId?: string } = { userId };
      if (businessId) {
        whereClause.businessId = businessId;
      }

      const [claims, total] = await Promise.all([
        prisma.couponClaim.findMany({
          where: whereClause,
          include: {
            coupon: {
              include: {
                business: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            business: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            review: {
              select: {
                id: true,
                rating: true,
                content: true,
                status: true,
              },
            },
          },
          orderBy: { claimedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.couponClaim.count({
          where: whereClause,
        }),
      ]);

      return {
        claims: claims as unknown as CouponClaim[],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(
        `Failed to get user coupon claims: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
