import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus, RegistrationType } from "@prisma/client";
import { AgentEarningsService } from "@/services/AgentEarningsService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { agentProfile: true },
    });

    if (!user || user.role !== "REVIEWER") {
      return NextResponse.json(
        { error: "Only reviewers can access this endpoint" },
        { status: 403 },
      );
    }

    // Get registration statistics using the earnings service
    const earningsData = await AgentEarningsService.getAgentEarningsData(
      user.id,
    );

    // Get additional registration counts
    const [
      totalRegistrations,
      pendingRegistrations,
      verifiedRegistrations,
      rejectedRegistrations,
      fullRegistrations,
      recommendations,
      agentApplication,
    ] = await Promise.all([
      prisma.businessRegistration.count({
        where: { agentId: user.id },
      }),
      prisma.businessRegistration.count({
        where: {
          agentId: user.id,
          status: RegistrationStatus.PENDING,
        },
      }),
      prisma.businessRegistration.count({
        where: {
          agentId: user.id,
          status: RegistrationStatus.VERIFIED,
        },
      }),
      prisma.businessRegistration.count({
        where: {
          agentId: user.id,
          status: RegistrationStatus.REJECTED,
        },
      }),
      prisma.businessRegistration.count({
        where: {
          agentId: user.id,
          registrationType: RegistrationType.FULL_REGISTRATION,
        },
      }),
      prisma.businessRegistration.count({
        where: {
          agentId: user.id,
          registrationType: RegistrationType.RECOMMENDATION,
        },
      }),
      prisma.agentApplication.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Get recent registrations
    const recentRegistrations = await prisma.businessRegistration.findMany({
      where: { agentId: user.id },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            isVerified: true,
            verificationSource: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        statistics: {
          totalRegistrations,
          pendingRegistrations,
          verifiedRegistrations,
          rejectedRegistrations,
          fullRegistrations,
          recommendations,
          verifiedBusinessesCount: earningsData.verifiedBusinessesCount,
          canEarnFromRegistrations: earningsData.canEarnFromRegistrations,
          earningsStartFrom: earningsData.earningsStartFrom,
          totalEarningsFromRegistrations:
            earningsData.totalEarningsFromRegistrations,
        },
        agentStatus: {
          applicationStatus: agentApplication?.status || "NOT_APPLIED",
          isApproved: agentApplication?.status === "APPROVED",
          needsVerification: agentApplication?.status === "PENDING",
          idVerified: agentApplication?.status === "ID_VERIFIED",
        },
        recentRegistrations,
        recentEarnings: earningsData.recentEarnings,
        requirements: {
          businessesNeededForApproval: 2,
          businessesNeededForEarnings: 3,
          maxPendingRegistrations: 5,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching agent registration stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent registration statistics" },
      { status: 500 },
    );
  }
}
