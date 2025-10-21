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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { applicationId, action, adminNotes } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { success: false, error: "Application ID and action are required" },
        { status: 400 },
      );
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be APPROVE or REJECT" },
        { status: 400 },
      );
    }

    // Find the application
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

    // Update application based on action
    const updateData: any = {
      idVerified: action === "APPROVE",
      idVerifiedAt: new Date(),
      idVerifiedBy: session.user.id,
      adminNotes,
      status: action === "APPROVE" ? "ID_VERIFIED" : "REJECTED",
    };

    if (action === "REJECT" && !adminNotes?.trim()) {
      return NextResponse.json(
        { success: false, error: "Admin notes are required for rejection" },
        { status: 400 },
      );
    }

    const updatedApplication = await prisma.agentApplication.update({
      where: { id: applicationId },
      data: updateData,
      include: { user: true },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: `ID_VERIFICATION_${action}`,
        targetType: "AGENT_APPLICATION",
        targetId: applicationId,
        details: {
          applicationId,
          userId: application.userId,
          userName: application.user.name,
          action,
          adminNotes,
        },
        adminName: session.user.name || "Admin",
      },
    });

    return NextResponse.json({
      success: true,
      message: `ID verification ${action.toLowerCase()}d successfully`,
      data: updatedApplication,
    });
  } catch (error) {
    console.error("ID verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process ID verification" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || "PENDING";

    // Get applications that need ID verification
    const applications = await prisma.agentApplication.findMany({
      where: {
        status: status === "ALL" ? undefined : status,
        idDocumentImage: { not: null }, // Only applications with ID documents
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            city: true,
            state: true,
            referralCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Failed to fetch ID verification applications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}
