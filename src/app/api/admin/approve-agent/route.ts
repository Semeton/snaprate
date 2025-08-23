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

    // Check if user is admin
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
    const { applicationId, action, notes } = body; // action: "APPROVE" or "REJECT"

    if (!applicationId || !action) {
      return NextResponse.json(
        { success: false, error: "Application ID and action are required" },
        { status: 400 },
      );
    }

    // Get the application
    const application = await prisma.agentApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Application has already been processed" },
        { status: 400 },
      );
    }

    // Update application status
    await prisma.agentApplication.update({
      where: { id: applicationId },
      data: {
        status: action,
        adminNotes: notes,
        reviewedAt: new Date(),
        reviewedBy: session.user.email,
      },
    });

    if (action === "APPROVED") {
      // Update user role to AGENT
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: "AGENT" },
      });

      // Create a reward for the approved agent
      await prisma.reward.create({
        data: {
          referrerId: application.userId,
          type: "AGENT_APPROVAL",
          amount: 100,
          description: "Agent approval bonus",
          isRedeemed: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("Agent approval error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process application" },
      { status: 500 },
    );
  }
}
