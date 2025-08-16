import { prisma } from "@/lib/prisma";
import { IBusinessService } from "./interfaces";
import {
  BusinessServiceData,
  BusinessVerificationStatus,
  BusinessCategory,
  State,
} from "@/types";

// Type for business data returned from Prisma with relations
type PrismaBusinessWithRelations = Awaited<
  ReturnType<typeof prisma.business.findUnique>
>;

export class BusinessService implements IBusinessService {
  // Helper function to transform Prisma data to BusinessServiceData type
  private transformPrismaBusiness(
    prismaBusiness: PrismaBusinessWithRelations,
  ): BusinessServiceData | null {
    if (!prismaBusiness) return null;

    return prismaBusiness as BusinessServiceData;
  }
  // Single Responsibility: This service only handles business-related operations

  async createBusiness(
    businessData: {
      name: string;
      description: string;
      category: BusinessCategory;
      phone: string;
      email: string;
      website?: string;
      state: State;
      city: string;
      address: string;
      cacNumber?: string;
      utilityBill?: string;
    },
    ownerId: string,
  ): Promise<BusinessServiceData> {
    try {
      // Check if owner already has a business
      const existingBusiness = await prisma.business.findUnique({
        where: { ownerId },
      });

      if (existingBusiness) {
        throw new Error("User already owns a business");
      }

      // Create business
      const business = await prisma.business.create({
        data: {
          name: businessData.name,
          description: businessData.description,
          category: businessData.category,
          phone: businessData.phone,
          email: businessData.email,
          website: businessData.website,
          state: businessData.state,
          city: businessData.city,
          address: businessData.address,
          cacNumber: businessData.cacNumber,
          utilityBill: businessData.utilityBill,
          verificationStatus: BusinessVerificationStatus.PENDING,
          ownerId,
        },
        include: {
          owner: true,
          staffMembers: true,
          reviews: true,
          coupons: true,
          campaigns: true,
        },
      });

      return business as Business;
    } catch (error) {
      throw new Error(
        `Failed to create business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findById(id: string): Promise<BusinessServiceData | null> {
    try {
      const business = await prisma.business.findUnique({
        where: { id },
        include: {
          owner: true,
          staffMembers: true,
          reviews: {
            include: {
              user: true,
              reward: true,
            },
          },
          coupons: true,
          campaigns: true,
        },
      });

      return this.transformPrismaBusiness(business);
    } catch (error) {
      throw new Error(
        `Failed to find business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findByOwner(ownerId: string): Promise<Business | null> {
    try {
      const business = await prisma.business.findUnique({
        where: { ownerId },
        include: {
          owner: true,
          staffMembers: true,
          reviews: {
            include: {
              user: true,
              reward: true,
            },
          },
          coupons: true,
          campaigns: true,
        },
      });

      return business as Business;
    } catch (error) {
      throw new Error(
        `Failed to find business by owner: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateBusiness(id: string, data: Partial<Business>): Promise<Business> {
    try {
      // Remove fields that shouldn't be updated
      const { ownerId, ...updateData } = data;

      const business = await prisma.business.update({
        where: { id },
        data: updateData,
        include: {
          owner: true,
          staffMembers: true,
          reviews: true,
          coupons: true,
          campaigns: true,
        },
      });

      const transformedBusiness = this.transformPrismaBusiness(business);
      if (!transformedBusiness) {
        throw new Error("Failed to transform business data");
      }
      return transformedBusiness;
    } catch (error) {
      throw new Error(
        `Failed to update business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async deleteBusiness(id: string): Promise<void> {
    try {
      await prisma.business.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async verifyBusiness(id: string, adminId: string): Promise<Business> {
    try {
      const business = await prisma.business.update({
        where: { id },
        data: {
          verificationStatus: BusinessVerificationStatus.VERIFIED,
          verifiedAt: new Date(),
        },
        include: {
          owner: true,
          staffMembers: true,
          reviews: true,
          coupons: true,
          campaigns: true,
        },
      });

      return business as Business;
    } catch (error) {
      throw new Error(
        `Failed to verify business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async rejectBusiness(
    id: string,
    adminId: string,
    reason: string,
  ): Promise<Business> {
    try {
      const business = await prisma.business.update({
        where: { id },
        data: {
          verificationStatus: BusinessVerificationStatus.REJECTED,
        },
        include: {
          owner: true,
          staffMembers: true,
          reviews: true,
          coupons: true,
          campaigns: true,
        },
      });

      return business as Business;
    } catch (error) {
      throw new Error(
        `Failed to reject business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async searchBusinesses(
    filters: {
      category?: BusinessCategory;
      state?: State;
      city?: string;
      rating?: number;
      verified?: boolean;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Business[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: Record<string, unknown> = {};

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.state) {
        where.state = filters.state;
      }

      if (filters.city) {
        where.city = {
          contains: filters.city,
          mode: "insensitive",
        };
      }

      if (filters.verified !== undefined) {
        where.verificationStatus = filters.verified
          ? BusinessVerificationStatus.VERIFIED
          : BusinessVerificationStatus.PENDING;
      }

      if (filters.rating) {
        where.rating = {
          gte: filters.rating,
        };
      }

      const skip = (page - 1) * limit;

      const [businesses, total] = await Promise.all([
        prisma.business.findMany({
          where,
          skip,
          take: limit,
          orderBy: { rating: "desc" },
          include: {
            owner: true,
            reviews: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                user: true,
              },
            },
          },
        }),
        prisma.business.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: businesses
          .map((business) => this.transformPrismaBusiness(business))
          .filter(Boolean) as Business[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to search businesses: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getBusinessStats(businessId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    totalVisits: number;
    activeCoupons: number;
    totalCampaigns: number;
  }> {
    try {
      const [reviews, coupons, campaigns, visits] = await Promise.all([
        prisma.review.count({
          where: {
            businessId,
            status: "APPROVED",
          },
        }),
        prisma.coupon.count({
          where: {
            businessId,
            status: "ACTIVE",
          },
        }),
        prisma.campaign.count({
          where: {
            businessId,
            isActive: true,
          },
        }),
        prisma.business.findUnique({
          where: { id: businessId },
          select: { visitCount: true },
        }),
      ]);

      const averageRating = await prisma.review.aggregate({
        where: {
          businessId,
          status: "APPROVED",
        },
        _avg: { rating: true },
      });

      return {
        totalReviews: reviews,
        averageRating: averageRating._avg.rating || 0,
        totalVisits: visits?.visitCount || 0,
        activeCoupons: coupons,
        totalCampaigns: campaigns,
      };
    } catch (error) {
      throw new Error(
        `Failed to get business stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async addStaffMember(
    businessId: string,
    staffData: {
      name: string;
      email: string;
      phone: string;
      role: string;
      canManageCoupons?: boolean;
      canViewAnalytics?: boolean;
      canManageReviews?: boolean;
    },
  ): Promise<{
    id: string;
    businessId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    canManageCoupons: boolean;
    canViewAnalytics: boolean;
    canManageReviews: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    try {
      const staffMember = await prisma.businessStaff.create({
        data: {
          businessId,
          name: staffData.name,
          email: staffData.email,
          phone: staffData.phone,
          role: staffData.role,
          canManageCoupons: staffData.canManageCoupons || false,
          canViewAnalytics: staffData.canViewAnalytics || false,
          canManageReviews: staffData.canManageReviews || false,
        },
      });

      return staffMember;
    } catch (error) {
      throw new Error(
        `Failed to add staff member: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async removeStaffMember(businessId: string, staffId: string): Promise<void> {
    try {
      await prisma.businessStaff.delete({
        where: { id: staffId },
      });
    } catch (error) {
      throw new Error(
        `Failed to remove staff member: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async incrementVisitCount(businessId: string): Promise<void> {
    try {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          visitCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to increment visit count: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateRating(businessId: string): Promise<void> {
    try {
      const reviews = await prisma.review.aggregate({
        where: {
          businessId,
          status: "APPROVED",
        },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const averageRating = reviews._avg.rating || 0;
      const reviewCount = reviews._count.rating;

      await prisma.business.update({
        where: { id: businessId },
        data: {
          rating: averageRating,
          reviewCount,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to update rating: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
