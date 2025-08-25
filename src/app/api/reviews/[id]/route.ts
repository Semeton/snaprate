import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewStatus } from "@prisma/client";

// Get a specific review
export async function GET(
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

    const { id: reviewId } = await params;

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
        deletedAt: null, // Only get non-deleted reviews
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
            city: true,
            state: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    // Check if user owns this review or is admin
    if (
      review.reviewerId !== session.user.id &&
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Failed to fetch review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Update a review
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

    const { id: reviewId } = await params;
    const body = await request.json();
    const { rating, content, images, video } = body;

    // Validation
    if (!rating || !content) {
      return NextResponse.json(
        { success: false, error: "Rating and content are required" },
        { status: 400 },
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    if (content.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Content must be at least 10 characters long",
        },
        { status: 400 },
      );
    }

    // Get the review and check ownership
    const existingReview = await prisma.review.findUnique({
      where: {
        id: reviewId,
        deletedAt: null,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    if (existingReview.reviewerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Only allow editing of pending reviews
    if (existingReview.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Only pending reviews can be edited" },
        { status: 400 },
      );
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        content,
        images: images || [],
        video: video || null,
        updatedAt: new Date(),
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
            city: true,
            state: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: "Review updated successfully",
    });
  } catch (error) {
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Soft delete a review
export async function DELETE(
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

    const { id: reviewId } = await params;

    // Get the review and check ownership
    const existingReview = await prisma.review.findUnique({
      where: {
        id: reviewId,
        deletedAt: null,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    if (existingReview.reviewerId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Soft delete the review
    const deletedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        deletedAt: new Date(),
        status: "REJECTED", // Mark as rejected when deleted
      },
    });

    // Update business statistics if review was approved
    if (existingReview.status === "APPROVED") {
      await prisma.business.update({
        where: { id: existingReview.businessId },
        data: {
          totalReviews: {
            decrement: 1,
          },
        },
      });

      // Recalculate average rating
      const remainingReviews = await prisma.review.findMany({
        where: {
          businessId: existingReview.businessId,
          status: "APPROVED",
          deletedAt: null,
        },
        select: { rating: true },
      });

      const newAverageRating =
        remainingReviews.length > 0
          ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
            remainingReviews.length
          : 0;

      await prisma.business.update({
        where: { id: existingReview.businessId },
        data: {
          averageRating: Math.round(newAverageRating * 10) / 10,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
