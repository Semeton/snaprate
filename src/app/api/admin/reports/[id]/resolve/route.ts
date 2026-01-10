import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { action, adminNotes, contentAction } = body;

    if (
      !action ||
      !["INVESTIGATED", "RESOLVED", "DISMISSED"].includes(action)
    ) {
      return NextResponse.json(
        { success: false, error: "Valid action is required" },
        { status: 400 },
      );
    }

    // Get the report
    const report = await prisma.reportedContent.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    if (report.status !== "PENDING" && report.status !== "INVESTIGATED") {
      return NextResponse.json(
        { success: false, error: "Report has already been processed" },
        { status: 400 },
      );
    }

    // Update report status
    const updatedReport = await prisma.reportedContent.update({
      where: { id },
      data: {
        status: action,
        adminNotes: adminNotes || null,
        resolvedBy: session.user.id,
        resolvedAt: new Date(),
      },
    });

    // Handle content action if specified
    if (contentAction && report.status === "PENDING") {
      switch (report.contentType) {
        case "REVIEW":
          if (contentAction === "REMOVE") {
            await prisma.review.update({
              where: { id: report.contentId },
              data: { status: "REJECTED" },
            });
          } else if (contentAction === "FLAG") {
            await prisma.review.update({
              where: { id: report.contentId },
              data: { status: "FLAGGED" },
            });
          }
          break;

        case "BUSINESS":
          // if (contentAction === "SUSPEND") {
          //   await prisma.business.update({
          //     where: { id: report.contentId },
          //     data: { status: "SUSPENDED" },
          //   });
          // }
          break;

        case "USER":
          if (contentAction === "SUSPEND") {
            await prisma.user.update({
              where: { id: report.contentId },
              data: { status: "SUSPENDED" },
            });
          }
          break;
      }
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: `REPORT_${action}`,
        targetType: "REPORT",
        targetId: id,
        details: {
          reportId: id,
          contentType: report.contentType,
          contentId: report.contentId,
          reason: report.reason,
          action,
          adminNotes,
          contentAction,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Report ${action.toLowerCase()} successfully`,
      data: updatedReport,
    });
  } catch (error) {
    console.error("Report resolution error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resolve report" },
      { status: 500 },
    );
  }
}
