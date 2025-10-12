import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUserSpecificCouponCode } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { couponId, userIds } = await req.json();

    if (!couponId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Get the coupon
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: { business: true },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (coupon.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Coupon is not active" },
        { status: 400 }
      );
    }

    // Verify business ownership
    // if (coupon.businessId !== session.user.businessId) {
    //   return NextResponse.json(
    //     { error: "You don't have permission to assign this coupon" },
    //     { status: 403 }
    //   );
    // }

    // Get all users
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, userIdentifier: true },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No valid users found" },
        { status: 400 }
      );
    }

    // Create coupon claims for each user
    const claims = await Promise.all(
      users.map(async (user) => {
        // Generate user-specific code
        const userSpecificCode = generateUserSpecificCouponCode(
          coupon.baseCode,
          user.userIdentifier!
        );

        // Create a coupon claim
        return prisma.couponClaim.create({
          data: {
            couponId: coupon.id,
            userId: user.id,
            businessId: coupon.businessId,
            // userSpecificCode,
            // status: "ASSIGNED",
            // assignedAt: new Date(),
          },
        });
      })
    );

    // Update coupon total issued count
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        totalIssued: { increment: users.length },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Coupon assigned to ${users.length} users`,
      assignedCount: users.length,
    });
  } catch (error) {
    console.error("Error assigning coupon to users:", error);
    return NextResponse.json(
      { error: "Failed to assign coupon to users" },
      { status: 500 }
    );
  }
}