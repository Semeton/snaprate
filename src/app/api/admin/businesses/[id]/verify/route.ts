import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/services/EmailService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
    const { status, notes, reviewStatus } = body;

    if (
      !status ||
      !["VERIFIED", "REJECTED", "APPROVED", "SUSPENDED"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, error: "Valid status is required" },
        { status: 400 },
      );
    }

    // Get the business
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // if (business.verificationStatus !== "PENDING") {
    //   return NextResponse.json(
    //     { success: false, error: "Business has already been processed" },
    //     { status: 400 },
    //   );
    // }

    // Update business review status (for reviewability, not document verification)
    const updatedBusiness = await prisma.business.update({
      where: { id },
      data: {
        reviewStatus:
          reviewStatus || (status === "VERIFIED" ? "APPROVED" : status),
        // Note: This is for reviewability, not document verification
        // Document verification is handled separately in /api/admin/verification
        // "VERIFIED" maps to "APPROVED" for review status
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: `BUSINESS_REVIEW_${
          reviewStatus || (status === "VERIFIED" ? "APPROVED" : status)
        }`,
        targetType: "BUSINESS",
        targetId: id,
        details: {
          businessName: business.name,
          businessId: id,
          reviewStatus:
            reviewStatus || (status === "VERIFIED" ? "APPROVED" : status),
          notes,
          ownerEmail: business.owner.email,
          action: "REVIEW_APPROVAL", // Clarify this is for reviewability
        },
      },
    });

    const finalReviewStatus: "APPROVED" | "REJECTED" | "SUSPENDED" =
      reviewStatus || (status === "VERIFIED" ? "APPROVED" : status);
    const statusMessage: string =
      {
        APPROVED: "approved for reviews",
        REJECTED: "rejected for reviews",
        SUSPENDED: "suspended from reviews",
      }[finalReviewStatus] || "status updated";

    return NextResponse.json({
      success: true,
      message: `Business ${statusMessage} successfully`,
      data: updatedBusiness,
    });
  } catch (error) {
    console.error("Business verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify business" },
      { status: 500 },
    );
  }
}
