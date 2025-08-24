import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContentType, ReportReason, ReportStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const contentType = searchParams.get("contentType");
    const reason = searchParams.get("reason");

    // Build where clause
    const where: {
      status?: ReportStatus;
      contentType?: ContentType;
      reason?: ReportReason;
    } = {};
    if (status && status !== "ALL") where.status = status as ReportStatus;
    if (contentType && contentType !== "ALL")
      where.contentType = contentType as unknown as ContentType;
    if (reason && reason !== "ALL")
      where.reason = reason as unknown as ReportReason;

    // Get all reported content with related information
    const reports = await prisma.reportedContent.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" }, // Newest first
      ],
    });

    // Get counts for different statuses
    const counts = await prisma.reportedContent.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    });

    const statusCounts = {
      PENDING: 0,
      INVESTIGATED: 0,
      RESOLVED: 0,
      DISMISSED: 0,
    };

    counts.forEach((count) => {
      statusCounts[count.status as keyof typeof statusCounts] =
        count._count.status;
    });

    return NextResponse.json({
      success: true,
      data: reports,
      counts: statusCounts,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}
