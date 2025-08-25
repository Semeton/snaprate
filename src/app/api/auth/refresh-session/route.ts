import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get the latest user data from the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        city: true,
        state: true,
        referralCode: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Return the updated user data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          city: user.city,
          state: user.state,
          referralCode: user.referralCode,
          isEmailVerified: !!user.emailVerified,
          isPhoneVerified: !!user.phoneVerified,
          createdAt: user.createdAt,
        },
        message: "Session refreshed successfully",
      },
    });
  } catch (error) {
    console.error("Failed to refresh session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh session" },
      { status: 500 },
    );
  }
}
