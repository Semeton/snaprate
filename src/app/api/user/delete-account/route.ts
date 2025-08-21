import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to delete account" },
        { status: 400 },
      );
    }

    // Get current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password is incorrect" },
        { status: 400 },
      );
    }

    // Soft delete the user account
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        status: "DELETED",
        email: `deleted_${Date.now()}_${user.email}`,
        deletedAt: new Date(),
      },
    });

    logger.info("User account soft deleted successfully", { userId: user.id });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    logger.error("Failed to delete user account", { error });
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
