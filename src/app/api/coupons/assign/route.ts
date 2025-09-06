import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CouponService } from "@/services/CouponService";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only business owners can assign coupons
    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can assign coupons" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { couponId, userId } = body;

    if (!couponId || !userId) {
      return NextResponse.json(
        { error: "Coupon ID and User ID are required" },
        { status: 400 },
      );
    }

    const couponService = new CouponService();

    // Verify the coupon belongs to the business owner
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { businessId: true, status: true },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (coupon.businessId !== session.user.businessId) {
      return NextResponse.json(
        { error: "You can only assign your own coupons" },
        { status: 403 },
      );
    }

    if (coupon.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active coupons can be assigned" },
        { status: 400 },
      );
    }

    // Verify the user exists and is a reviewer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, userIdentifier: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "REVIEWER") {
      return NextResponse.json(
        { error: "Only reviewers can be assigned coupons" },
        { status: 400 },
      );
    }

    // Assign the coupon to the user
    const result = await couponService.assignCouponToUser(couponId, userId);

    return NextResponse.json({
      success: true,
      message: "Coupon assigned successfully",
      coupon: result.coupon,
    });
  } catch (error) {
    console.error("Failed to assign coupon:", error);
    return NextResponse.json(
      { error: "Failed to assign coupon" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only business owners can unassign coupons
    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can unassign coupons" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get("couponId");

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 },
      );
    }

    const couponService = new CouponService();

    // Verify the coupon belongs to the business owner
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { businessId: true, assignedUserId: true },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    if (coupon.businessId !== session.user.businessId) {
      return NextResponse.json(
        { error: "You can only unassign your own coupons" },
        { status: 403 },
      );
    }

    if (!coupon.assignedUserId) {
      return NextResponse.json(
        { error: "Coupon is not assigned to any user" },
        { status: 400 },
      );
    }

    // Unassign the coupon
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        assignedUserId: null,
        assignedAt: null,
        userSpecificCode: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon unassigned successfully",
    });
  } catch (error) {
    console.error("Failed to unassign coupon:", error);
    return NextResponse.json(
      { error: "Failed to unassign coupon" },
      { status: 500 },
    );
  }
}
