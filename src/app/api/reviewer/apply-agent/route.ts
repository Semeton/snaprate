import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if user is already an agent
    if (user.role === "AGENT") {
      return NextResponse.json(
        { success: false, error: "User is already an agent" },
        { status: 400 },
      );
    }

    const requiredVerifiedBusinesses = 2; // Fixed requirement: 2 verified businesses

    // Check if user has registered enough verified businesses
    const verifiedBusinessRegistrations =
      await prisma.businessRegistration.count({
        where: {
          agentId: user.id,
          status: "VERIFIED",
          registrationType: "FULL_REGISTRATION",
        },
      });

    // Log validation details for debugging
    console.log("Agent application validation:", {
      userId: user.id,
      requiredVerifiedBusinesses,
      verifiedBusinessRegistrations,
    });

    // Check if user has any verified business registrations
    if (verifiedBusinessRegistrations === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `You need to register at least 2 verified businesses before applying to become an agent. You have registered ${verifiedBusinessRegistrations} verified businesses.`,
        },
        { status: 400 },
      );
    }

    if (verifiedBusinessRegistrations < requiredVerifiedBusinesses) {
      return NextResponse.json(
        {
          success: false,
          error: `You need to register at least ${requiredVerifiedBusinesses} verified businesses to apply. You have registered ${verifiedBusinessRegistrations} verified businesses.`,
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      motivation,
      experience,
      businessKnowledge,
      commitment,
      idDocumentType,
      idDocumentNumber,
      idDocumentImage,
    } = body;

    // Validate required fields
    if (!motivation || !experience || !businessKnowledge || !commitment) {
      return NextResponse.json(
        { success: false, error: "All application fields are required" },
        { status: 400 },
      );
    }

    // Validate ID verification fields
    if (!idDocumentType || !idDocumentNumber || !idDocumentImage) {
      return NextResponse.json(
        { success: false, error: "ID verification document is required" },
        { status: 400 },
      );
    }

    // Validate ID document type
    const validIdTypes = [
      "VOTER_CARD",
      "NATIONAL_ID",
      "PASSPORT",
      "DRIVERS_LICENSE",
    ];
    if (!validIdTypes.includes(idDocumentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID document type" },
        { status: 400 },
      );
    }

    // Create agent application
    const application = await prisma.agentApplication.create({
      data: {
        userId: user.id,
        motivation,
        experience,
        businessKnowledge,
        commitment,
        idDocumentType,
        idDocumentNumber,
        idDocumentImage,
        status: "PENDING",
      },
    });

    // Log successful application creation
    console.log("Agent application created successfully:", {
      applicationId: application.id,
      userId: user.id,
      verifiedBusinessRegistrations,
      requiredVerifiedBusinesses,
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: "Agent application submitted successfully",
    });
  } catch (error) {
    console.error("Agent application error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
