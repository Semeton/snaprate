import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's coupon assignments
    const assignments = await prisma.couponAssignment.findMany({
      where: {
        userId: session.user.id,
        status: "ASSIGNED",
      },
      include: {
        coupon: {
          select: {
            id: true,
            title: true,
            businessId: true,
            couponType: true,
            status: true,
            validFrom: true,
            validUntil: true,
            business: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      assignments,
    });
  } catch (error) {
    console.error("Failed to fetch user assignments:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch assignments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
