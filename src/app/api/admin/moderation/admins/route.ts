import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
        { success: false, error: "Only Super Admins can access this endpoint" },
        { status: 403 },
      );
    }

    // Get all admins and super admins
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        adminActions: {
          select: {
            action: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to include permissions
    const adminsWithPermissions = admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: true,
      lastActive: admin.lastLoginAt || admin.createdAt,
      permissions: {
        canModerateReviews: admin.role === "SUPER_ADMIN" || true,
        canModerateBusinesses: admin.role === "SUPER_ADMIN" || true,
        canModerateUsers: admin.role === "SUPER_ADMIN" || true,
        canModerateContent: admin.role === "SUPER_ADMIN" || true,
        canManageAgents: admin.role === "SUPER_ADMIN" || true,
        canViewAnalytics: admin.role === "SUPER_ADMIN" || true,
        canManageSettings: admin.role === "SUPER_ADMIN" || false,
        canInviteAdmins: admin.role === "SUPER_ADMIN" || false,
      },
      recentActions: admin.adminActions,
    }));

    return NextResponse.json({
      success: true,
      data: adminsWithPermissions,
    });
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
