import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationType, RegistrationStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { agentProfile: true },
    });

    console.log("Business registration request:", {
      sessionUserId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      dbUserRole: user?.role,
      userExists: !!user,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 },
      );
    }

    // Allow reviewers and agents (both approved and non-approved) to register businesses
    if (user.role === "REVIEWER") {
      // Reviewers can register businesses (they become agents after 2 verified businesses)
    } else if (user.role === "AGENT") {
      // Agents can register businesses (they become approved after 2 verified businesses)
      // No approval check needed - they need to register businesses to become approved
    } else {
      return NextResponse.json(
        {
          error: "Only reviewers and agents can register businesses",
          userRole: user.role,
          expectedRoles: ["REVIEWER", "AGENT"],
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      registrationType,
      businessName,
      businessDescription,
      businessCategory,
      businessPhone,
      businessEmail,
      businessAddress,
      businessCity,
      businessState,
      businessWebsite,
      // Verification documents (for full registration)
      directorIdType,
      directorIdNumber,
      directorIdImage,
      cacDocumentType,
      cacDocumentImage,
      firsTaxClearance,
      addressEvidenceType,
      addressEvidenceImage,
      // Owner information
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerAddress,
      ownerCity,
      ownerState,
    } = body;

    // Validate registration type
    if (!Object.values(RegistrationType).includes(registrationType)) {
      return NextResponse.json(
        { error: "Invalid registration type" },
        { status: 400 },
      );
    }

    // Validate owner information (required for all registrations)
    const requiredOwnerFields = [
      "ownerName",
      "ownerEmail",
      "ownerPhone",
      "ownerAddress",
      "ownerCity",
      "ownerState",
    ];

    for (const field of requiredOwnerFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required owner field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Validate required fields based on registration type
    if (registrationType === RegistrationType.FULL_REGISTRATION) {
      const requiredFields = [
        "businessName",
        "businessDescription",
        "businessCategory",
        "businessPhone",
        "businessEmail",
        "businessAddress",
        "businessCity",
        "businessState",
        "directorIdType",
        "directorIdNumber",
        "directorIdImage",
      ];

      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            {
              error: `Missing required field: ${field}`,
            },
            { status: 400 },
          );
        }
      }

      // For full registration, either CAC or address evidence is required
      if (!cacDocumentImage && !addressEvidenceImage) {
        return NextResponse.json(
          {
            error:
              "Either CAC document or address evidence is required for full registration",
          },
          { status: 400 },
        );
      }
    } else if (registrationType === RegistrationType.RECOMMENDATION) {
      const requiredFields = [
        "businessName",
        "businessAddress",
        "businessCity",
        "businessState",
        "businessCategory",
      ];

      for (const field of requiredFields) {
        if (!body[field]) {
          return NextResponse.json(
            {
              error: `Missing required field: ${field}`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Check if agent already has 5 pending registrations
    const pendingRegistrations = await prisma.businessRegistration.count({
      where: {
        agentId: user.id,
        status: RegistrationStatus.PENDING,
      },
    });

    if (pendingRegistrations >= 5) {
      return NextResponse.json(
        {
          error: "Maximum of 5 pending registrations allowed",
        },
        { status: 400 },
      );
    }

    // Create business registration
    const registration = await prisma.businessRegistration.create({
      data: {
        agentId: user.id,
        registrationType,
        businessName,
        businessDescription,
        businessCategory,
        businessPhone,
        businessEmail,
        businessAddress,
        businessCity,
        businessState,
        businessWebsite,
        directorIdType: directorIdType || null,
        directorIdNumber: directorIdNumber || null,
        directorIdImage: directorIdImage || null,
        cacDocumentType: cacDocumentType || null,
        cacDocumentImage: cacDocumentImage || null,
        firsTaxClearance: firsTaxClearance || null,
        addressEvidenceType: addressEvidenceType || null,
        addressEvidenceImage: addressEvidenceImage || null,
        status: RegistrationStatus.PENDING,
      },
    });

    return NextResponse.json({
      success: true,
      data: registration,
      message:
        registrationType === RegistrationType.FULL_REGISTRATION
          ? "Business registration submitted successfully"
          : "Business recommendation submitted successfully",
    });
  } catch (error) {
    console.error("Error creating business registration:", error);
    return NextResponse.json(
      { error: "Failed to create business registration" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    console.log("Business registration GET request:", {
      sessionUserId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      dbUserRole: user?.role,
      userExists: !!user,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 },
      );
    }

    // Allow reviewers and agents (both approved and non-approved) to view registrations
    if (user.role === "REVIEWER") {
      // Reviewers can view their registrations
    } else if (user.role === "AGENT") {
      // Agents can view their registrations (both approved and non-approved)
    } else {
      return NextResponse.json(
        {
          error: "Only reviewers and agents can view registrations",
          userRole: user.role,
          expectedRoles: ["REVIEWER", "AGENT"],
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {
      agentId: user.id,
    };

    if (
      status &&
      Object.values(RegistrationStatus).includes(status as RegistrationStatus)
    ) {
      where.status = status;
    }

    if (
      type &&
      Object.values(RegistrationType).includes(type as RegistrationType)
    ) {
      where.registrationType = type;
    }

    const [registrations, total] = await Promise.all([
      prisma.businessRegistration.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.businessRegistration.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching business registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch business registrations" },
      { status: 500 },
    );
  }
}
