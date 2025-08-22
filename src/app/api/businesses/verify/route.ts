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

    const body = await request.json();
    const { businessId, action, reason } = body; // action: "APPROVE" or "REJECT"

    if (!businessId || !action) {
      return NextResponse.json(
        { success: false, error: "Business ID and action are required" },
        { status: 400 },
      );
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be APPROVE or REJECT" },
        { status: 400 },
      );
    }

    // Get user by email
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

    // Check if user is admin or agent
    if (!["ADMIN", "SUPER_ADMIN", "AGENT"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    // Get business
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

    let result;
    if (action === "APPROVE") {
      result = await prisma.business.update({
        where: { id: businessId },
        data: {
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
        },
        include: { owner: true },
      });
    } else {
      if (!reason) {
        return NextResponse.json(
          { success: false, error: "Reason is required for rejection" },
          { status: 400 },
        );
      }
      result = await prisma.business.update({
        where: { id: businessId },
        data: {
          verificationStatus: "REJECTED",
          verifiedAt: new Date(),
        },
        include: { owner: true },
      });
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        action: `${action}_BUSINESS`,
        targetType: "BUSINESS",
        targetId: businessId,
        adminId: user.id,
        adminName: user.role,
        details: { reason: action === "REJECT" ? reason : undefined },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Business ${action.toLowerCase()}d successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Business verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify business" },
      { status: 500 },
    );
  }
}
