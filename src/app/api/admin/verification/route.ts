import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, VerificationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!session.user.email) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 },
      );
    }

    // Check if user is admin or super admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
        },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BusinessVerificationWhereInput = {};
    if (status && status !== "ALL") {
      // Type cast the status to VerificationStatus enum
      where.verificationStatus = status as VerificationStatus;
    }

    // Get verification submissions with business and owner details
    const verifications = await prisma.businessVerification.findMany({
      where,
      include: {
        business: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.businessVerification.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        verifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching verification submissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch verification submissions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!session.user.email) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 },
      );
    }

    // Check if user is admin or super admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      verificationId,
      action, // "APPROVE" or "REJECT"
      adminNotes,
    } = body;

    if (!verificationId || !action) {
      return NextResponse.json(
        { success: false, error: "Verification ID and action are required" },
        { status: 400 },
      );
    }

    // Get the verification
    const verification = await prisma.businessVerification.findUnique({
      where: { id: verificationId },
      include: { business: true },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "Verification not found" },
        { status: 404 },
      );
    }

    // Update verification status
    const newVerificationStatus =
      action === "APPROVE" ? "APPROVED" : "REJECTED";

    await prisma.businessVerification.update({
      where: { id: verificationId },
      data: {
        verificationStatus: newVerificationStatus,
        adminNotes,
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      },
    });

    // Update business verification status
    const businessVerificationStatus =
      action === "APPROVE" ? "VERIFIED" : "REJECTED";
    const businessAddressVerificationStatus =
      action === "APPROVE" ? "VERIFIED" : "REJECTED";

    await prisma.business.update({
      where: { id: verification.businessId },
      data: {
        verificationStatus: businessVerificationStatus,
        addressVerificationStatus: businessAddressVerificationStatus,
        verifiedAt: action === "APPROVE" ? new Date() : null,
      },
    });

    // Create admin action record
    await prisma.adminAction.create({
      data: {
        adminId: adminUser.id,
        action: `VERIFICATION_${action.toUpperCase()}`,
        targetType: "BUSINESS_VERIFICATION",
        targetId: verificationId,
        details: {
          businessId: verification.businessId,
          businessName: verification.business.name,
          action,
          adminNotes,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Verification ${action.toLowerCase()}d successfully`,
      data: {
        verificationStatus: newVerificationStatus,
        businessVerificationStatus,
      },
    });
  } catch (error) {
    console.error("Error reviewing verification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to review verification" },
      { status: 500 },
    );
  }
}
