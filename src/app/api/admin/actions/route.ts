import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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

    // Check if user is admin
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");

    const skip = (page - 1) * limit;

    const where: { action?: string; targetType?: string } = {};
    if (action) {
      where.action = action;
    }
    if (targetType) {
      where.targetType = targetType;
    }

    const [actions, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.adminAction.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        actions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Admin actions fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin actions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if user is admin
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action, targetType, targetId, details, ipAddress } = body;

    if (!action || !targetType || !targetId) {
      return NextResponse.json(
        {
          success: false,
          error: "Action, targetType, and targetId are required",
        },
        { status: 400 },
      );
    }

    // Log admin action
    const adminAction = await prisma.adminAction.create({
      data: {
        action,
        targetType,
        targetId,
        adminId: user.id,
        adminName: user.name || user.role,
        details,
        ipAddress,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin action logged successfully",
      data: adminAction,
    });
  } catch (error) {
    console.error("Admin action logging error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log admin action" },
      { status: 500 },
    );
  }
}
