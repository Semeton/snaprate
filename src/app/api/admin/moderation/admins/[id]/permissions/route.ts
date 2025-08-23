import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only Super Admins can update admin permissions",
        },
        { status: 403 },
      );
    }

    const adminId = params.id;
    const { permissions } = await request.json();

    // Validate permissions object
    const requiredPermissions = [
      "canModerateReviews",
      "canModerateBusinesses",
      "canModerateUsers",
      "canModerateContent",
      "canManageAgents",
      "canViewAnalytics",
      "canManageSettings",
      "canInviteAdmins",
    ];

    for (const permission of requiredPermissions) {
      if (typeof permissions[permission] !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid permission value for ${permission}`,
          },
          { status: 400 },
        );
      }
    }

    // Check if admin exists and is not a super admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true, name: true },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 },
      );
    }

    if (admin.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Cannot modify Super Admin permissions" },
        { status: 400 },
      );
    }

    // Store permissions in user metadata or create a separate permissions table
    // For now, we'll store it in a JSON field in the user table
    const updatedUser = await prisma.user.update({
      where: { id: adminId },
      data: {
        // Store permissions in a metadata field or create a separate permissions table
        // This is a simplified approach - in production you might want a dedicated permissions table
        metadata: {
          permissions: permissions,
        },
      },
    });

    // Log the admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: "UPDATE_ADMIN_PERMISSIONS",
        targetType: "USER",
        targetId: adminId,
        details: `Permissions updated for ${admin.name} by ${session.user.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: { permissions },
      message: "Admin permissions updated successfully",
    });
  } catch (error) {
    console.error("Failed to update admin permissions:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
