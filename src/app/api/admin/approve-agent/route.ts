import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/services/EmailService";

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
    const { applicationId, action, notes, userId } = body; // action: "APPROVE", "REJECT", or "REVOKE"

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required" },
        { status: 400 },
      );
    }

    // Handle direct user role changes (REVOKE)
    if (action === "REVOKE") {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "User ID is required for revocation" },
          { status: 400 },
        );
      }

      // Get the user to check current role
      const userToRevoke = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true, name: true },
      });

      if (!userToRevoke) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
        );
      }

      if (userToRevoke.role !== "AGENT") {
        return NextResponse.json(
          { success: false, error: "User is not an agent" },
          { status: 400 },
        );
      }

      // Revoke agent status and revert to REVIEWER
      await prisma.user.update({
        where: { id: userId },
        data: { role: "REVIEWER" },
      });

      // Log the revocation
      console.log("Agent status revoked:", {
        userId: userId,
        userEmail: userToRevoke.email,
        revokedBy: session.user.email,
        revokedAt: new Date().toISOString(),
      });

      // Send email notification
      try {
        const emailService = new EmailService();
        await emailService.sendAgentStatusRevokedEmail(
          userToRevoke.email,
          userToRevoke.name,
          notes
        );
      } catch (emailError) {
        console.error("Failed to send agent revocation email:", emailError);
      }

      return NextResponse.json({
        success: true,
        message: "Agent status revoked successfully",
        requiresSessionUpdate: true,
        userId: userId,
      });
    }

    // Handle application approval/rejection
    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: "Application ID is required for approval/rejection" },
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

      // Log the approval
      console.log("Agent application approved:", {
        applicationId: applicationId,
        userId: application.userId,
        userEmail: application.user.email,
        approvedBy: session.user.email,
        approvedAt: new Date().toISOString(),
      });
    }

    // Send email notification to applicant
    try {
      const emailService = new EmailService();
      await emailService.sendAgentApplicationUpdateEmail(
        application.user.email,
        application.user.name,
        action,
        notes
      );
    } catch (emailError) {
      console.error("Failed to send agent application update email:", emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action.toLowerCase()} successfully`,
      requiresSessionUpdate: action === "APPROVED",
      userId: application.userId,
    });
  } catch (error) {
    console.error("Agent approval error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process application" },
      { status: 500 },
    );
  }
}
