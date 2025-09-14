import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus } from "@prisma/client";
import { AgentEarningsService } from "@/services/AgentEarningsService";
import { RecommendationRewardService } from "@/services/RecommendationRewardService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const registration = await prisma.businessRegistration.findUnique({
      where: { id: params.id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            userIdentifier: true,
            agentProfile: {
              select: {
                totalEarnings: true,
                registeredBusinessesCount: true,
                verifiedBusinessesCount: true,
              },
            },
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            isVerified: true,
            verificationSource: true,
            createdAt: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error("Error fetching business registration:", error);
    return NextResponse.json(
      { error: "Failed to fetch business registration" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action, adminNotes } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const registration = await prisma.businessRegistration.findUnique({
      where: { id: params.id },
      include: {
        agent: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    if (registration.status !== RegistrationStatus.PENDING) {
      return NextResponse.json(
        {
          error: "Registration has already been processed",
        },
        { status: 400 },
      );
    }

    const newStatus =
      action === "APPROVE"
        ? RegistrationStatus.VERIFIED
        : RegistrationStatus.REJECTED;

    // Update registration status
    const updatedRegistration = await prisma.businessRegistration.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        verifiedAt: new Date(),
        verifiedBy: user.id,
        adminNotes,
      },
    });

    // If approved and it's a full registration, create the business
    if (
      action === "APPROVE" &&
      registration.registrationType === "FULL_REGISTRATION"
    ) {
      const business = await prisma.business.create({
        data: {
          ownerId: registration.agentId, // Agent becomes the owner
          name: registration.businessName!,
          description: registration.businessDescription!,
          category: registration.businessCategory!,
          phone: registration.businessPhone!,
          email: registration.businessEmail!,
          website: registration.businessWebsite,
          address: registration.businessAddress!,
          city: registration.businessCity!,
          state: registration.businessState!,
          verificationSource: "REGISTRATION",
          registeredByAgentId: registration.agentId,
          isVerified: true, // Auto-verify registered businesses
        },
      });

      // Update registration with business ID
      await prisma.businessRegistration.update({
        where: { id: params.id },
        data: { businessId: business.id },
      });

      // Create business verification record
      await prisma.businessVerification.create({
        data: {
          businessId: business.id,
          directorIdType: registration.directorIdType!,
          directorIdNumber: registration.directorIdNumber!,
          directorIdImage: registration.directorIdImage!,
          cacDocumentType: registration.cacDocumentType,
          cacDocumentImage: registration.cacDocumentImage,
          firsTaxClearance: registration.firsTaxClearance,
          addressEvidenceType: registration.addressEvidenceType,
          addressEvidenceImage: registration.addressEvidenceImage,
          verificationStatus: "APPROVED",
          reviewedBy: user.id,
          reviewedAt: new Date(),
        },
      });

      // Create earnings record if this qualifies (3rd business onwards)
      await AgentEarningsService.createEarningsFromRegistration(
        registration.agentId,
        registration.id,
        business.id,
        business.name,
      );

      // Update agent profile with latest earnings
      await AgentEarningsService.updateAgentProfileEarnings(
        registration.agentId,
      );

      // Process delayed recommendation rewards for this business
      try {
        await RecommendationRewardService.processPendingRewardsForBusiness(
          business.id,
          business.name,
        );
      } catch (rewardError) {
        console.error(
          "Error processing delayed recommendation rewards:",
          rewardError,
        );
        // Don't fail the registration process if reward processing fails
      }
    }

    // Check if agent should be auto-approved
    if (
      action === "APPROVE" &&
      registration.registrationType === "FULL_REGISTRATION"
    ) {
      const verifiedBusinessesCount = await prisma.businessRegistration.count({
        where: {
          agentId: registration.agentId,
          status: RegistrationStatus.VERIFIED,
          registrationType: "FULL_REGISTRATION",
        },
      });

      // Auto-approve agent if they have 2 verified businesses
      if (verifiedBusinessesCount >= 2) {
        const agentApplication = await prisma.agentApplication.findFirst({
          where: {
            userId: registration.agentId,
            status: "ID_VERIFIED",
          },
        });

        if (agentApplication) {
          await prisma.agentApplication.update({
            where: { id: agentApplication.id },
            data: {
              status: "APPROVED",
              approvedAt: new Date(),
              approvedBy: user.id,
            },
          });

          // Update user role to AGENT
          await prisma.user.update({
            where: { id: registration.agentId },
            data: { role: "AGENT" },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedRegistration,
      message: `Registration ${action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    console.error("Error processing business registration:", error);
    return NextResponse.json(
      { error: "Failed to process business registration" },
      { status: 500 },
    );
  }
}
