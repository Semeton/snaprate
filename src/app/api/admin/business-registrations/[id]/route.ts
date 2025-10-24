import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationStatus } from "@prisma/client";
import { AgentEarningsService } from "@/services/AgentEarningsService";
import { RecommendationRewardService } from "@/services/RecommendationRewardService";
import { randomBytes } from "crypto";
import { EmailService } from "@/services/EmailService";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { id } = await params;

    const registration = await prisma.businessRegistration.findUnique({
      where: { id },
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
  { params }: { params: Promise<{ id: string }> },
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

    const { id } = await params;

    const body = await request.json();
    const { action, adminNotes } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const registration = await prisma.businessRegistration.findUnique({
      where: { id },
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
      where: { id },
      data: {
        status: newStatus,
        verifiedAt: new Date(),
        verifiedBy: user.id,
        adminNotes,
      },
    });

    // If approved, create the business and process rewards
    if (action === "APPROVE") {
      // Extract owner information from the registration
      const ownerData = {
        name: registration.ownerName || registration.businessName!, // Fallback to business name
        email: registration.ownerEmail || registration.businessEmail!,
        phone: registration.ownerPhone || registration.businessPhone!,
        address: registration.ownerAddress || registration.businessAddress!,
        city: registration.ownerCity || registration.businessCity!,
        state: registration.ownerState || registration.businessState!,
      };

      // Check if business owner already exists
      const existingOwner = await prisma.user.findUnique({
        where: { email: ownerData.email },
      });

      let businessOwner;
      if (existingOwner) {
        businessOwner = existingOwner;
        console.log("Business owner already exists:", existingOwner.id);
      } else {
        // Create the business owner account with a temporary password
        const temporaryPassword = `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

        businessOwner = await prisma.user.create({
          data: {
            name: ownerData.name,
            email: ownerData.email,
            phone: ownerData.phone,
            password: hashedPassword,
            role: "BUSINESS_OWNER",
            status: "ACTIVE",
            emailVerified: new Date(),
            isVerified: true,
            referralCode: `BO_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            state: ownerData.state,
            city: ownerData.city,
            address: ownerData.address,
          },
        });
        console.log("Business owner created successfully:", businessOwner.id);
      }

      const business = await prisma.business.create({
        data: {
          ownerId: businessOwner.id, // Link to the business owner account
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
          isVerified: true,
          reviewStatus: "APPROVED",
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
        },
      });

      // Update registration with business ID
      await prisma.businessRegistration.update({
        where: { id },
        data: { businessId: business.id },
      });

      // Generate invitation token for business owner
      const invitationToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create business owner invitation
      await prisma.businessInvitation.create({
        data: {
          email: ownerData.email,
          businessName: registration.businessName!,
          invitationToken,
          expiresAt,
          status: "PENDING",
          invitedBy: user.id,
        },
      });

      // Send invitation email to business owner
      const invitationLink = `${process.env.NEXTAUTH_URL}/accept-business-invitation?token=${invitationToken}`;

      try {
        const emailService = new EmailService();
        await emailService.sendBusinessInvitationEmail(
          ownerData.email,
          ownerData.name,
          registration.businessName!,
          invitationLink,
        );
        console.log("Business invitation email sent successfully");
      } catch (emailError) {
        console.error("Failed to send business invitation email:", emailError);
      }

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

      // STEP 1: Check if reviewer should be promoted to AGENT (after 2nd verified business)
      // This happens BEFORE reward processing to ensure role is updated first
      if (registration.registrationType === "FULL_REGISTRATION") {
        const verifiedBusinessesCount = await prisma.businessRegistration.count(
          {
            where: {
              agentId: registration.agentId,
              status: RegistrationStatus.VERIFIED,
              registrationType: "FULL_REGISTRATION",
            },
          },
        );

        // Auto-approve as agent after 2nd verified business
        if (verifiedBusinessesCount >= 2) {
          const agentUser = await prisma.user.findUnique({
            where: { id: registration.agentId },
            select: { role: true },
          });

          // Only update role if user is not already an agent
          if (agentUser && agentUser.role !== "AGENT") {
            // Update user role to AGENT
            await prisma.user.update({
              where: { id: registration.agentId },
              data: { role: "AGENT" },
            });

            // If there's an existing agent application, update it to approved
            const existingApplication = await prisma.agentApplication.findFirst(
              {
                where: {
                  userId: registration.agentId,
                },
                orderBy: { createdAt: "desc" },
              },
            );

            if (existingApplication) {
              await prisma.agentApplication.update({
                where: { id: existingApplication.id },
                data: {
                  status: "APPROVED",
                  reviewedAt: new Date(),
                  reviewedBy: user.id,
                },
              });
            } else {
              // Create a new approved agent application record for tracking
              await prisma.agentApplication.create({
                data: {
                  userId: registration.agentId,
                  motivation:
                    "Auto-approved after registering 2 verified businesses",
                  experience: "Auto-approved",
                  businessKnowledge: "Auto-approved",
                  commitment: "Auto-approved",
                  status: "APPROVED",
                  reviewedAt: new Date(),
                  reviewedBy: user.id,
                  idDocumentType: "AUTO_APPROVED",
                  idDocumentNumber: "N/A",
                  idDocumentImage: null,
                },
              });
            }

            console.log(
              `✓ User ${registration.agentId} promoted to AGENT role after ${verifiedBusinessesCount} verified businesses`,
            );
          }
        }
      }

      // STEP 2: Create earnings record for agents (3rd business onwards)
      // At this point, if this is the 2nd business, user is now already AGENT
      // When 3rd business is approved, user is AGENT and gets rewarded
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
