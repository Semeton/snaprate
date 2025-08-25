import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: "No session found",
        session: null,
      });
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        user: session.user,
        expires: session.expires,
      },
      databaseUser: user,
    });
  } catch (error) {
    console.error("Debug session error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to get session info",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
