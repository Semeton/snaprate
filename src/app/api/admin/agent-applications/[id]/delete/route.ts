import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    // Get the application to check its status
    const application = await prisma.agentApplication.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    // Check if application has already been processed
    if (application.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete processed applications. Only pending applications can be deleted.",
        },
        { status: 400 },
      );
    }

    // Check if user has already been approved as an agent
    if (application.user.role === "AGENT") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete application for an approved agent. The user is already an agent.",
        },
        { status: 400 },
      );
    }

    // Log the deletion for audit purposes
    console.log("Agent application deleted:", {
      applicationId: id,
      userId: application.userId,
      userEmail: application.user.email,
      deletedBy: session.user.email,
      deletedAt: new Date().toISOString(),
    });

    // Permanently delete the application
    await prisma.agentApplication.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Agent application deleted permanently",
    });
  } catch (error) {
    console.error("Failed to delete agent application:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete application" },
      { status: 500 },
    );
  }
}
