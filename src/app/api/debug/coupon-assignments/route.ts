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

    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get("couponId");

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 },
      );
    }

    // Get coupon details
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: {
        id: true,
        title: true,
        couponType: true,
        status: true,
        maxUses: true,
        totalIssued: true,
        validFrom: true,
        validUntil: true,
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Get user's assignments for this coupon
    const userAssignments = await prisma.couponAssignment.findMany({
      where: {
        couponId: couponId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        expiresAt: true,
        userSpecificCode: true,
      },
    });

    // Get all assignments for this coupon
    const allAssignments = await prisma.couponAssignment.findMany({
      where: {
        couponId: couponId,
        status: "ASSIGNED",
      },
      select: {
        id: true,
        userId: true,
        status: true,
        assignedAt: true,
        expiresAt: true,
      },
    });

    // Get user's total active assignments
    const now = new Date();
    const userActiveAssignments = await prisma.couponAssignment.count({
      where: {
        userId: session.user.id,
        status: "ASSIGNED",
        expiresAt: { gte: now },
      },
    });

    return NextResponse.json({
      coupon,
      userAssignments,
      allAssignments: allAssignments.length,
      userActiveAssignments,
      canClaim: {
        isActive: coupon.status === "ACTIVE",
        isNotExpired: coupon.validUntil >= now,
        isNotStarted: coupon.validFrom <= now,
        hasRemainingUses:
          !coupon.maxUses || allAssignments.length < coupon.maxUses,
        userNotAssigned: userAssignments.length === 0,
        userUnderLimit: userActiveAssignments < 5,
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      {
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
