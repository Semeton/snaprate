import { prisma } from "@/lib/prisma";
import { RegistrationStatus, RegistrationType } from "@prisma/client";

export interface AgentEarningsData {
  agentId: string;
  verifiedBusinessesCount: number;
  canEarnFromRegistrations: boolean;
  earningsStartFrom: number;
  totalEarningsFromRegistrations: number;
  recentEarnings: Array<{
    businessId: string;
    businessName: string;
    amount: number;
    earnedAt: string;
  }>;
}

export class AgentEarningsService {
  /**
   * Calculate agent earnings eligibility and statistics
   */
  static async getAgentEarningsData(
    agentId: string,
  ): Promise<AgentEarningsData> {
    // Get verified business registrations count
    const verifiedBusinessesCount = await prisma.businessRegistration.count({
      where: {
        agentId,
        status: RegistrationStatus.VERIFIED,
        registrationType: RegistrationType.FULL_REGISTRATION,
      },
    });

    // Calculate earnings eligibility
    const canEarnFromRegistrations = verifiedBusinessesCount >= 3;
    const earningsStartFrom = Math.max(0, verifiedBusinessesCount - 2); // Start from 3rd business

    // Get total earnings from registrations
    const totalEarningsFromRegistrations =
      await this.calculateTotalEarningsFromRegistrations(agentId);

    // Get recent earnings
    const recentEarnings = await this.getRecentEarningsFromRegistrations(
      agentId,
    );

    return {
      agentId,
      verifiedBusinessesCount,
      canEarnFromRegistrations,
      earningsStartFrom,
      totalEarningsFromRegistrations,
      recentEarnings,
    };
  }

  /**
   * Calculate total earnings from business registrations
   */
  static async calculateTotalEarningsFromRegistrations(
    agentId: string,
  ): Promise<number> {
    // Get platform settings for registration reward rate
    const platformSettings = await prisma.platformSettings.findFirst();
    const registrationRewardRate =
      platformSettings?.businessRegistrationRewardRate || 100;

    // Count verified registrations that qualify for earnings (3rd onwards)
    const verifiedRegistrations = await prisma.businessRegistration.findMany({
      where: {
        agentId,
        status: RegistrationStatus.VERIFIED,
        registrationType: RegistrationType.FULL_REGISTRATION,
      },
      orderBy: { verifiedAt: "asc" },
    });

    // Only count from 3rd registration onwards
    const qualifyingRegistrations = verifiedRegistrations.slice(2); // Skip first 2
    const totalEarnings =
      qualifyingRegistrations.length * registrationRewardRate;

    return totalEarnings;
  }

  /**
   * Get recent earnings from business registrations
   */
  static async getRecentEarningsFromRegistrations(
    agentId: string,
    limit: number = 5,
  ) {
    // Get platform settings for registration reward rate
    const platformSettings = await prisma.platformSettings.findFirst();
    const registrationRewardRate =
      platformSettings?.businessRegistrationRewardRate || 100;

    // Get verified registrations that qualify for earnings
    const verifiedRegistrations = await prisma.businessRegistration.findMany({
      where: {
        agentId,
        status: RegistrationStatus.VERIFIED,
        registrationType: RegistrationType.FULL_REGISTRATION,
      },
      orderBy: { verifiedAt: "desc" },
      take: limit + 2, // Get extra to account for first 2 that don't earn
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Only include from 3rd registration onwards
    const qualifyingRegistrations = verifiedRegistrations.slice(2);

    return qualifyingRegistrations.map((registration) => ({
      businessId: registration.businessId || "",
      businessName:
        registration.business?.name ||
        registration.businessName ||
        "Unknown Business",
      amount: registrationRewardRate,
      earnedAt:
        registration.verifiedAt?.toISOString() ||
        registration.submittedAt.toISOString(),
    }));
  }

  /**
   * Create earnings record when a business registration is verified
   */
  static async createEarningsFromRegistration(
    agentId: string,
    businessRegistrationId: string,
    businessId: string,
    businessName: string,
  ): Promise<void> {
    // Check if this is the 3rd or later verified registration
    const verifiedRegistrations = await prisma.businessRegistration.findMany({
      where: {
        agentId,
        status: RegistrationStatus.VERIFIED,
        registrationType: RegistrationType.FULL_REGISTRATION,
      },
      orderBy: { verifiedAt: "asc" },
    });

    // Only create earnings for 3rd registration onwards
    if (verifiedRegistrations.length < 3) {
      return; // No earnings for first 2 registrations
    }

    // Get platform settings for registration reward rate
    const platformSettings = await prisma.platformSettings.findFirst();
    const registrationRewardRate =
      platformSettings?.businessRegistrationRewardRate || 100;

    // Create reward record
    await prisma.reward.create({
      data: {
        referrerId: agentId,
        amount: registrationRewardRate,
        type: "BUSINESS_REGISTRATION",
        description: `Earnings from business registration: ${businessName}`,
        reviewId: null, // No review associated with registration earnings
      },
    });
  }

  /**
   * Update agent profile with latest earnings statistics
   */
  static async updateAgentProfileEarnings(agentId: string): Promise<void> {
    const earningsData = await this.getAgentEarningsData(agentId);

    // Use upsert to create the agent record if it doesn't exist, or update if it does
    await prisma.agent.upsert({
      where: { userId: agentId },
      update: {
        registeredBusinessesCount: earningsData.verifiedBusinessesCount,
        verifiedBusinessesCount: earningsData.verifiedBusinessesCount,
        totalEarnings: earningsData.totalEarningsFromRegistrations,
      },
      create: {
        userId: agentId,
        registeredBusinessesCount: earningsData.verifiedBusinessesCount,
        verifiedBusinessesCount: earningsData.verifiedBusinessesCount,
        totalEarnings: earningsData.totalEarningsFromRegistrations,
        totalBusinesses: earningsData.verifiedBusinessesCount,
      },
    });
  }
}
