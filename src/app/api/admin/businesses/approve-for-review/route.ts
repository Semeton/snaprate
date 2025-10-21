import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      businessId,
      action, // "APPROVE" or "REJECT" or "SUSPEND"
      adminNotes,
    } = body;

    if (!businessId || !action) {
      return NextResponse.json(
        { success: false, error: "Business ID and action are required" },
        { status: 400 },
      );
    }

    // Get the business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { owner: true },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Update business review status
    let newReviewStatus: "APPROVED" | "REJECTED" | "SUSPENDED";
    switch (action) {
      case "APPROVE":
        newReviewStatus = "APPROVED";
        break;
      case "REJECT":
        newReviewStatus = "REJECTED";
        break;
      case "SUSPEND":
        newReviewStatus = "SUSPENDED";
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action. Must be APPROVE, REJECT, or SUSPEND",
          },
          { status: 400 },
        );
    }

    await prisma.business.update({
      where: { id: businessId },
      data: {
        reviewStatus: newReviewStatus,
      },
    });

    // Create admin action record
    await prisma.adminAction.create({
      data: {
        adminId: adminUser.id,
        action: `REVIEW_${action.toUpperCase()}`,
        targetType: "BUSINESS",
        targetId: businessId,
        details: {
          businessName: business.name,
          businessId: business.id,
          ownerName: business.owner.name,
          ownerEmail: business.owner.email,
          action,
          adminNotes,
          previousReviewStatus: business.reviewStatus,
          newReviewStatus,
        },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Business ${action.toLowerCase()}d for review successfully`,
      data: {
        businessId: business.id,
        businessName: business.name,
        reviewStatus: newReviewStatus,
      },
    });
  } catch (error) {
    console.error("Error updating business review status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update business review status" },
      { status: 500 },
    );
  }
}
