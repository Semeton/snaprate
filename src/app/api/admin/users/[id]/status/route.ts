import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
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
    const { status } = body;

    if (!status || !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid status is required" },
        { status: 400 },
      );
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Prevent admins from modifying other admins/super admins (unless super admin)
    if (
      ["ADMIN", "SUPER_ADMIN"].includes(targetUser.role) &&
      adminUser.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only modify admin accounts as a super admin",
        },
        { status: 403 },
      );
    }

    // Prevent super admins from modifying other super admins
    if (
      targetUser.role === "SUPER_ADMIN" &&
      targetUser.id !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "Cannot modify other super admin accounts" },
        { status: 403 },
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: `USER_STATUS_${status}`,
        targetType: "USER",
        targetId: id,
        details: {
          targetUserName: targetUser.name,
          targetUserEmail: targetUser.email,
          targetUserRole: targetUser.role,
          previousStatus: targetUser.status,
          newStatus: status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status.toLowerCase()}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("User status update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user status" },
      { status: 500 },
    );
  }
}
