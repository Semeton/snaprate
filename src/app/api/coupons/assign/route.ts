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

    // Debug logging
    console.log("Coupon assignment request body:", { couponId, userId, body });

    if (!couponId || !userId) {
      return NextResponse.json(
        {
          error: "Coupon ID and User ID are required",
          received: { couponId, userId },
        },
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

    // Get the user's business to verify ownership
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    if (coupon.businessId !== business.id) {
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

    if (!["REVIEWER", "AGENT"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only reviewers and agents can be assigned coupons" },
        { status: 400 },
      );
    }

    // Assign the coupon to the user
    const result = await couponService.assignCouponToUser({ couponId, userId });

    return NextResponse.json({
      success: true,
      message: "Coupon assigned successfully",
      coupon: result,
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
    const userId = searchParams.get("userId");

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 },
      );
    }

    // Verify the coupon belongs to the business owner
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { businessId: true },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Get the user's business to verify ownership
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    if (coupon.businessId !== business.id) {
      return NextResponse.json(
        { error: "You can only unassign your own coupons" },
        { status: 403 },
      );
    }

    // If userId is provided, unassign specific user
    if (userId) {
      const assignment = await prisma.couponAssignment.findFirst({
        where: {
          couponId: couponId,
          userId: userId,
          status: "ASSIGNED",
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "User assignment not found" },
          { status: 404 },
        );
      }

      // Update assignment status to cancelled
      await prisma.couponAssignment.update({
        where: { id: assignment.id },
        data: { status: "CANCELLED" },
      });

      // Decrease total issued count
      await prisma.coupon.update({
        where: { id: couponId },
        data: { totalIssued: { decrement: 1 } },
      });

      return NextResponse.json({
        success: true,
        message: "User assignment cancelled successfully",
      });
    } else {
      // If no userId provided, cancel all assignments for this coupon
      const assignments = await prisma.couponAssignment.findMany({
        where: {
          couponId: couponId,
          status: "ASSIGNED",
        },
      });

      if (assignments.length === 0) {
        return NextResponse.json(
          { error: "No active assignments found for this coupon" },
          { status: 400 },
        );
      }

      // Cancel all assignments
      await prisma.couponAssignment.updateMany({
        where: {
          couponId: couponId,
          status: "ASSIGNED",
        },
        data: { status: "CANCELLED" },
      });

      // Reset total issued count
      await prisma.coupon.update({
        where: { id: couponId },
        data: { totalIssued: 0 },
      });

      return NextResponse.json({
        success: true,
        message: "All assignments cancelled successfully",
      });
    }
  } catch (error) {
    console.error("Failed to unassign coupon:", error);
    return NextResponse.json(
      { error: "Failed to unassign coupon" },
      { status: 500 },
    );
  }
}
