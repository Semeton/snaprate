import { prisma } from "@/lib/prisma";
import { Agent, Business, BusinessCategory, State } from "@prisma/client";

export class AgentService {
  async createAgentProfile(
    userId: string,
    agentData: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      businessName?: string;
      businessAddress?: string;
      businessPhone?: string;
      businessEmail?: string;
    },
  ): Promise<Agent> {
    try {
      const agentProfile = await prisma.agent.create({
        data: {
          userId,
          ...agentData,
        },
      });

      return agentProfile;
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
        },
      });

      return agentProfile;
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
        },
      });

      return agentProfile;
    } catch (error) {
      throw new Error(
        `Failed to find agent profile: ${
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
        },
      });

      return agentProfile;
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

  async approveAgent(id: string): Promise<Agent> {
    try {
      const agentProfile = await prisma.agent.update({
        where: { id },
        data: {
          isApproved: true,
          approvedAt: new Date(),
        },
        include: {
          user: true,
        },
      });

      return agentProfile;
    } catch (error) {
      throw new Error(
        `Failed to approve agent: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async rejectAgent(id: string): Promise<Agent> {
    try {
      const agentProfile = await prisma.agent.update({
        where: { id },
        data: {
          isApproved: false,
          approvedAt: null,
        },
        include: {
          user: true,
        },
      });

      return agentProfile;
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
      description?: string;
      category: BusinessCategory;
      phone: string;
      email: string;
      website?: string;
      address: string;
      city: string;
      state: State;
      ownerId: string;
    },
  ): Promise<Business> {
    try {
      const business = await prisma.business.create({
        data: {
          ...businessData,
          // Note: onboardedByAgent field doesn't exist in current schema
          // You may need to add this field to track which agent onboarded the business
        },
      });

      return business;
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
    monthlyEarnings: number;
    pendingApprovals: number;
    approvalRate: number;
  }> {
    try {
      // Since onboardedByAgent field doesn't exist, we'll return placeholder data
      // You'll need to implement proper tracking when the field is added
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error("Agent not found");
      }

      return {
        totalBusinessesOnboarded: agent.totalBusinesses,
        totalEarnings: agent.totalEarnings,
        monthlyEarnings: 0, // Placeholder - implement when tracking is available
        pendingApprovals: 0, // Placeholder - implement when tracking is available
        approvalRate: 100, // Placeholder - implement when tracking is available
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
      // Since onboardedByAgent field doesn't exist, return empty results
      // You'll need to implement this when the field is added
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
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
        data: bankData,
        include: {
          user: true,
        },
      });

      return agentProfile;
    } catch (error) {
      throw new Error(
        `Failed to update bank details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
