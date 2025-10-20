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

    // Debug logging
    console.log("Session user:", session.user);
    console.log("Prisma instance:", prisma);
    console.log("Prisma businessInvitation:", prisma?.businessInvitation);
    console.log("Available Prisma models:", Object.keys(prisma || {}));

    if (!prisma) {
      console.error("Prisma is undefined!");
      return NextResponse.json(
        { success: false, error: "Database connection error" },
        { status: 500 },
      );
    }

    // Test database connection
    try {
      await prisma.$connect();
      console.log("Database connection successful");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { success: false, error: "Database connection failed" },
        { status: 500 },
      );
    }

    // Check if businessInvitation model is available
    if (!prisma.businessInvitation) {
      console.error(
        "businessInvitation model is not available on Prisma client",
      );
      console.error("Available models:", Object.keys(prisma));
      return NextResponse.json(
        { success: false, error: "Database model not available" },
        { status: 500 },
      );
    }

    // Check if user is admin or super admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    // Use adminUser.id instead of session.user.id for consistency
    const adminUserId = adminUser.id;

    const body = await request.json();
    const { recommendationId, businessData, ownerData } = body;

    // Debug logging for request data
    console.log("Request body:", { recommendationId, businessData, ownerData });

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

    // Log validated data
    console.log("Validated business data:", businessData);
    console.log("Validated owner data:", ownerData);

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
      try {
        const temporaryPassword = `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

        businessOwner = await prisma.user.create({
          data: {
            name: ownerData.name,
            email: ownerData.email,
            phone: ownerData.phone,
            password: hashedPassword, // Required field
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
        console.log(
          "Temporary password for business owner:",
          temporaryPassword,
        );
      } catch (ownerError) {
        console.error("Failed to create business owner:", ownerError);
        return NextResponse.json(
          { success: false, error: "Failed to create business owner account" },
          { status: 500 },
        );
      }
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

    // Create the business
    let business;
    try {
      business = await prisma.business.create({
        data: {
          name: businessData.name,
          category: businessData.category,
          phone: businessData.phone,
          email: businessData.email,
          address: businessData.address,
          city: businessData.city,
          state: businessData.state,
          description: businessData.description || "",
          website: businessData.website || "",
          logo: businessData.logo || "",
          ownerId: businessOwner.id,
          verificationStatus: "PENDING", // Use correct field name
          isActive: true, // Use correct field name
        },
      });
      console.log("Business created successfully:", business.id);
    } catch (businessError) {
      console.error("Failed to create business:", businessError);
      // If business creation fails and we created a new owner, delete the owner
      if (!existingOwner) {
        try {
          await prisma.user.delete({ where: { id: businessOwner.id } });
        } catch (deleteError) {
          console.error(
            "Failed to delete business owner after business creation failure:",
            deleteError,
          );
        }
      }
      return NextResponse.json(
        { success: false, error: "Failed to create business" },
        { status: 500 },
      );
    }

    // Get the recommendation if provided - only from BusinessRecommendation table
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

    // Check if NEXTAUTH_URL is set
    if (!process.env.NEXTAUTH_URL) {
      console.error("NEXTAUTH_URL environment variable is not set");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Create business owner invitation
    let businessInvitation;
    try {
      businessInvitation = await prisma.businessInvitation.create({
        data: {
          email: ownerData.email,
          businessName: businessData.name,
          invitationToken,
          expiresAt,
          status: "PENDING",
          invitedBy: adminUserId,
        },
      });
      console.log(
        "Business invitation created successfully:",
        businessInvitation.id,
      );
    } catch (invitationError) {
      console.error("Failed to create business invitation:", invitationError);
      // If invitation creation fails, clean up the created business and owner
      try {
        await prisma.business.delete({ where: { id: business.id } });
        if (!existingOwner) {
          await prisma.user.delete({ where: { id: businessOwner.id } });
        }
      } catch (cleanupError) {
        console.error(
          "Failed to cleanup after invitation creation failure:",
          cleanupError,
        );
      }
      return NextResponse.json(
        { success: false, error: "Failed to create business invitation" },
        { status: 500 },
      );
    }

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
          reviewedBy: adminUserId,
          adminNotes: `Business creation initiated. Invitation sent to ${ownerData.email}`,
        },
      });
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: adminUserId,
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
