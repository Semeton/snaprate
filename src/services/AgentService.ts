import { prisma } from "@/lib/prisma";
import { IAgentService } from "./interfaces";
import {
  Agent,
  Business,
  BusinessVerificationStatus,
  BusinessCategory,
  State,
} from "@/types";

export class AgentService implements IAgentService {
  async createAgentProfile(
    userId: string,
    agentData: {
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
    },
  ): Promise<Agent> {
    try {
      const existingProfile = await prisma.agent.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        throw new Error("User already has an agent profile");
      }

      const agentProfile = await prisma.agent.create({
        data: {
          userId,
          bankName: agentData.bankName,
          accountNumber: agentData.accountNumber,
          accountName: agentData.accountName,
          isApproved: false,
          totalEarnings: 0,
          totalBusinesses: 0,
        },
        include: {
          user: true,
          onboardedBusinesses: true,
        },
      });

      return agentProfile as unknown as Agent;
    } catch (error) {
      throw new Error(
        `Failed to create agent profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findById(id: string): Promise<Agent | null> {
    try {
      const agentProfile = await prisma.agent.findUnique({
        where: { id },
        include: {
          user: true,
          onboardedBusinesses: true,
        },
      });

      if (!agentProfile) return null;

      return agentProfile as unknown as Agent;
    } catch (error) {
      throw new Error(
        `Failed to find agent profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findByUser(userId: string): Promise<Agent | null> {
    try {
      const agentProfile = await prisma.agent.findUnique({
        where: { userId },
        include: {
          user: true,
          onboardedBusinesses: true,
        },
      });

      if (!agentProfile) return null;

      return agentProfile as unknown as Agent;
    } catch (error) {
      throw new Error(
        `Failed to find agent profile by user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateAgentProfile(id: string, data: Partial<Agent>): Promise<Agent> {
    try {
      const agentProfile = await prisma.agent.update({
        where: { id },
        data,
        include: {
          user: true,
          onboardedBusinesses: true,
        },
      });

      return agentProfile as unknown as Agent;
    } catch (error) {
      throw new Error(
        `Failed to update agent profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async deleteAgentProfile(id: string): Promise<void> {
    try {
      await prisma.agent.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete agent profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async approveAgent(id: string, adminId: string): Promise<Agent> {
    try {
      const agentProfile = await prisma.agent.update({
        where: { id },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: adminId,
        },
        include: {
          user: true,
          onboardedBusinesses: true,
        },
      });

      return agentProfile as unknown as Agent;
    } catch (error) {
      throw new Error(
        `Failed to approve agent: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async rejectAgent(
    id: string,
    // adminId: string,
    // reason: string,
  ): Promise<Agent> {
    try {
      const agentProfile = await prisma.agent.update({
        where: { id },
        data: {
          isApproved: false,
          approvedAt: null,
          approvedBy: null,
        },
        include: {
          user: true,
          onboardedBusinesses: true,
        },
      });

      return agentProfile as unknown as Agent;
    } catch (error) {
      throw new Error(
        `Failed to reject agent: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async onboardBusiness(
    agentId: string,
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
      ownerId: string;
    },
  ): Promise<Business> {
    try {
      // Verify agent is approved
      const agentProfile = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agentProfile) {
        throw new Error("Agent profile not found");
      }

      if (!agentProfile.isApproved) {
        throw new Error("Agent is not approved");
      }

      // Check if owner already has a business
      const existingBusiness = await prisma.business.findUnique({
        where: { ownerId: businessData.ownerId },
      });

      if (existingBusiness) {
        throw new Error("Owner already has a business");
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
          ownerId: businessData.ownerId,
          onboardedByAgentId: agentId,
        },
        include: {
          owner: true,
          onboardedByAgent: true,
        },
      });

      // Update agent stats
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          totalBusinesses: {
            increment: 1,
          },
        },
      });

      return business as unknown as Business;
    } catch (error) {
      throw new Error(
        `Failed to onboard business: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getAgentStats(agentId: string): Promise<{
    totalBusinessesOnboarded: number;
    totalEarnings: number;
    pendingApprovals: number;
    monthlyEarnings: number;
  }> {
    try {
      const agentProfile = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agentProfile) {
        throw new Error("Agent profile not found");
      }

      // Get pending business approvals
      const pendingApprovals = await prisma.business.count({
        where: {
          onboardedByAgentId: agentId,
          verificationStatus: BusinessVerificationStatus.PENDING,
        },
      });

      // Get monthly earnings (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const monthlyEarnings = await prisma.reward.aggregate({
        where: {
          referrerId: agentProfile.userId,
          type: "BUSINESS_ONBOARDING",
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _sum: { amount: true },
      });

      return {
        totalBusinessesOnboarded: agentProfile.totalBusinesses,
        totalEarnings: agentProfile.totalEarnings,
        pendingApprovals,
        monthlyEarnings: monthlyEarnings._sum?.amount || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get agent stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getOnboardedBusinesses(
    agentId: string,
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
      const skip = (page - 1) * limit;

      const [businesses, total] = await Promise.all([
        prisma.business.findMany({
          where: { onboardedByAgentId: agentId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            owner: true,
            onboardedByAgent: true,
          },
        }),
        prisma.business.count({ where: { onboardedByAgentId: agentId } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: businesses as unknown as Business[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get onboarded businesses: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateBankDetails(
    agentId: string,
    bankData: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    },
  ): Promise<Agent> {
    try {
      const agentProfile = await prisma.agent.update({
        where: { id: agentId },
        data: {
          bankName: bankData.bankName,
          accountNumber: bankData.accountNumber,
          accountName: bankData.accountName,
        },
        include: {
          user: true,
          onboardedBusinesses: true,
        },
      });

      return agentProfile as unknown as Agent;
    } catch (error) {
      throw new Error(
        `Failed to update bank details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getPendingAgents(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Agent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [agents, total] = await Promise.all([
        prisma.agent.findMany({
          where: { isApproved: false },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: true,
          },
        }),
        prisma.agent.count({ where: { isApproved: false } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: agents as unknown as Agent[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get pending agents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getTopAgents(limit: number = 10): Promise<Agent[]> {
    try {
      const agents = await prisma.agent.findMany({
        where: { isApproved: true },
        orderBy: [{ totalBusinesses: "desc" }, { totalEarnings: "desc" }],
        take: limit,
        include: {
          user: true,
        },
      });

      return agents as unknown as Agent[];
    } catch (error) {
      throw new Error(
        `Failed to get top agents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async searchAgents(
    filters: {
      isApproved?: boolean;
      minBusinessesOnboarded?: number;
      minEarnings?: number;
      state?: State;
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Agent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: Record<string, unknown> = {};

      if (filters.isApproved !== undefined) {
        where.isApproved = filters.isApproved;
      }

      if (filters.minBusinessesOnboarded) {
        where.totalBusinesses = {
          gte: filters.minBusinessesOnboarded,
        };
      }

      if (filters.minEarnings) {
        where.totalEarnings = {
          gte: filters.minEarnings,
        };
      }

      if (filters.state) {
        where.user = {
          state: filters.state,
        };
      }

      const skip = (page - 1) * limit;

      const [agents, total] = await Promise.all([
        prisma.agent.findMany({
          where,
          skip,
          take: limit,
          orderBy: { totalBusinesses: "desc" },
          include: {
            user: true,
          },
        }),
        prisma.agent.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: agents as unknown as Agent[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to search agents: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
