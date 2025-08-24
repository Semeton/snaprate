import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewStatus } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { id: reviewId } = await params;

    const { action } = await request.json();

    if (!["APPROVE", "REJECT", "VERIFY"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 },
      );
    }

    // Get the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        business: true,
        reviewer: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    const updateData: { status?: ReviewStatus; isVerified?: boolean } = {};

    if (action === "APPROVE") {
      updateData.status = "APPROVED";
    } else if (action === "REJECT") {
      updateData.status = "REJECTED";
    } else if (action === "VERIFY") {
      if (review.status !== "APPROVED") {
        return NextResponse.json(
          { success: false, error: "Only approved reviews can be verified" },
          { status: 400 },
        );
      }
      updateData.isVerified = true;
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    // Log the admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: `REVIEW_${action}`,
        targetType: "REVIEW",
        targetId: reviewId,
        details: `Review ${action.toLowerCase()}d by ${session.user.name}`,
      },
    });

    // If approving, update business stats
    if (action === "APPROVE") {
      await prisma.business.update({
        where: { id: review.businessId },
        data: {
          totalReviews: {
            increment: 1,
          },
          averageRating: {
            set: await calculateNewAverageRating(review.businessId),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: `Review ${action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function calculateNewAverageRating(businessId: string): Promise<number> {
  const reviews = await prisma.review.findMany({
    where: {
      businessId,
      status: "APPROVED",
    },
    select: {
      rating: true,
    },
  });

  if (reviews.length === 0) return 0;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
}
