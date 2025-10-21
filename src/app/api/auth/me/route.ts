import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    logger.info("Get current user API endpoint called");

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      logger.warn("Get current user failed - no session");
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    logger.info("Current user retrieved successfully", {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        status: session.user.status,
      },
    });
  } catch (error) {
    logger.error("Get current user API error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
