import { prisma } from "@/lib/prisma";

export class ReviewRequirementService {
  /**
   * Check if a user has reviewed a business
   */
  static async hasUserReviewedBusiness(
    userId: string,
    businessId: string,
  ): Promise<boolean> {
    try {
      const userBusinessReview = await prisma.userBusinessReview.findUnique({
        where: {
          userId_businessId: {
            userId,
            businessId,
          },
        },
      });

      return userBusinessReview?.hasReviewed || false;
    } catch (error) {
      console.error("Error checking user review status:", error);
      return false;
    }
  }

  /**
   * Mark that a user has reviewed a business
   */
  static async markUserAsReviewed(
    userId: string,
    businessId: string,
  ): Promise<void> {
    try {
      await prisma.userBusinessReview.upsert({
        where: {
          userId_businessId: {
            userId,
            businessId,
          },
        },
        update: {
          hasReviewed: true,
          lastReviewDate: new Date(),
        },
        create: {
          userId,
          businessId,
          hasReviewed: true,
          lastReviewDate: new Date(),
        },
      });
    } catch (error) {
      console.error("Error marking user as reviewed:", error);
      throw new Error("Failed to update review status");
    }
  }

  /**
   * Check if a user can claim a coupon based on review requirements
   */
  static async canUserClaimCoupon(
    userId: string,
    businessId: string,
    couponId: string,
  ): Promise<{ canClaim: boolean; reason?: string }> {
    try {
      // Get the coupon to check if it requires review
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId },
        select: {
          id: true,
          businessId: true,
          requiresReview: true,
          couponType: true,
        },
      });

      if (!coupon) {
        return { canClaim: false, reason: "Coupon not found" };
      }

      // Check if this is the user's first time claiming from this business
      const previousClaims = await prisma.couponRedemption.count({
        where: {
          userId,
          coupon: {
            businessId,
          },
        },
      });

      // If it's the first time, no review required
      if (previousClaims === 0) {
        return { canClaim: true };
      }

      // If it's not the first time and the coupon requires review, check if user has reviewed
      if (coupon.requiresReview) {
        const hasReviewed = await this.hasUserReviewedBusiness(
          userId,
          businessId,
        );
        if (!hasReviewed) {
          return {
            canClaim: false,
            reason:
              "You must review this business before claiming another coupon",
          };
        }
      }

      return { canClaim: true };
    } catch (error) {
      console.error("Error checking coupon claim eligibility:", error);
      return { canClaim: false, reason: "Error checking eligibility" };
    }
  }

  /**
   * Get review requirements for a business
   */
  static async getBusinessReviewRequirements(businessId: string): Promise<{
    requiresReview: boolean;
    totalUsers: number;
    reviewedUsers: number;
    reviewRate: number;
  }> {
    try {
      const [totalUsers, reviewedUsers] = await Promise.all([
        prisma.userBusinessReview.count({
          where: { businessId },
        }),
        prisma.userBusinessReview.count({
          where: {
            businessId,
            hasReviewed: true,
          },
        }),
      ]);

      const reviewRate =
        totalUsers > 0 ? (reviewedUsers / totalUsers) * 100 : 0;

      return {
        requiresReview: true, // This could be a business setting
        totalUsers,
        reviewedUsers,
        reviewRate,
      };
    } catch (error) {
      console.error("Error getting business review requirements:", error);
      return {
        requiresReview: false,
        totalUsers: 0,
        reviewedUsers: 0,
        reviewRate: 0,
      };
    }
  }
}
