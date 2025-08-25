import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { EmailService } from "@/services/EmailService";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is admin or super admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { recommendationId, businessData, ownerData } = body;

    if (!businessData || !ownerData) {
      return NextResponse.json(
        { success: false, error: "Missing required data" },
        { status: 400 },
      );
    }

    // Validate required fields
    const requiredBusinessFields = [
      "name",
      "category",
      "phone",
      "email",
      "address",
      "city",
      "state",
    ];
    const requiredOwnerFields = [
      "name",
      "email",
      "phone",
      "address",
      "city",
      "state",
    ];

    for (const field of requiredBusinessFields) {
      if (!businessData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing business ${field}` },
          { status: 400 },
        );
      }
    }

    for (const field of requiredOwnerFields) {
      if (!ownerData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing owner ${field}` },
          { status: 400 },
        );
      }
    }

    // Check if business owner already exists
    const existingOwner = await prisma.user.findUnique({
      where: { email: ownerData.email },
    });

    if (existingOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "Business owner with this email already exists",
        },
        { status: 400 },
      );
    }

    // Check if business already exists
    const existingBusiness = await prisma.business.findFirst({
      where: {
        OR: [{ email: businessData.email }, { name: businessData.name }],
      },
    });

    if (existingBusiness) {
      return NextResponse.json(
        {
          success: false,
          error: "Business with this name or email already exists",
        },
        { status: 400 },
      );
    }

    // Get the recommendation if provided
    let recommendation = null;
    if (recommendationId) {
      recommendation = await prisma.businessRecommendation.findUnique({
        where: { id: recommendationId },
        include: { recommendedByUser: true },
      });

      if (!recommendation) {
        return NextResponse.json(
          { success: false, error: "Recommendation not found" },
          { status: 404 },
        );
      }

      if (recommendation.status !== "PENDING") {
        return NextResponse.json(
          {
            success: false,
            error: "Recommendation has already been processed",
          },
          { status: 400 },
        );
      }
    }

    // Generate invitation token for business owner
    const invitationToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create business owner invitation
    const businessInvitation = await prisma.businessInvitation.create({
      data: {
        email: ownerData.email,
        businessName: businessData.name,
        invitationToken,
        expiresAt,
        status: "PENDING",
        invitedBy: session.user.id,
      },
    });

    // Send invitation email to business owner
    const invitationLink = `${process.env.NEXTAUTH_URL}/accept-business-invitation?token=${invitationToken}`;

    try {
      const emailService = new EmailService();
      const emailSent = await emailService.sendBusinessInvitationEmail(
        ownerData.email,
        ownerData.name,
        businessData.name,
        invitationLink,
      );

      if (!emailSent) {
        // Delete the invitation if email fails
        await prisma.businessInvitation.delete({
          where: { id: businessInvitation.id },
        });
        return NextResponse.json(
          { success: false, error: "Failed to send invitation email" },
          { status: 500 },
        );
      }
    } catch (emailError) {
      console.error("Failed to send business invitation email:", emailError);
      // Delete the invitation if email fails
      await prisma.businessInvitation.delete({
        where: { id: businessInvitation.id },
      });
      return NextResponse.json(
        { success: false, error: "Failed to send invitation email" },
        { status: 500 },
      );
    }

    // Update recommendation status if it exists
    if (recommendation) {
      await prisma.businessRecommendation.update({
        where: { id: recommendationId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
          adminNotes: `Business creation initiated. Invitation sent to ${ownerData.email}`,
        },
      });
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: recommendation
          ? "BUSINESS_CREATION_INITIATED"
          : "BUSINESS_CREATED_DIRECTLY",
        targetType: recommendation ? "BUSINESS_RECOMMENDATION" : "BUSINESS",
        targetId: recommendationId || businessInvitation.id,
        details: {
          recommendationId: recommendationId || null,
          businessName: businessData.name,
          ownerEmail: ownerData.email,
          invitationId: businessInvitation.id,
          createdDirectly: !recommendationId,
        },
      },
    });

    const message = recommendation
      ? `Business creation initiated from recommendation. Invitation sent to ${ownerData.email}`
      : `Business created directly. Invitation sent to ${ownerData.email}`;

    return NextResponse.json({
      success: true,
      message,
      data: {
        invitationId: businessInvitation.id,
        businessName: businessData.name,
        ownerEmail: ownerData.email,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Create business from recommendation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create business from recommendation",
      },
      { status: 500 },
    );
  }
}
