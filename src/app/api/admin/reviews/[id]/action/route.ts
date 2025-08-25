import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewStatus } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reviewId } = await params;
    console.log("=== Review Action GET Test ===");
    console.log("Review ID:", reviewId);
    
    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, status: true, businessId: true, reviewerId: true }
    });
    
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      message: "Review Action endpoint is working",
      review: {
        id: review.id,
        status: review.status,
        businessId: review.businessId,
        reviewerId: review.reviewerId
      }
    });
  } catch (error) {
    console.error("GET test failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleReviewAction(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleReviewAction(request, { params });
}

async function handleReviewAction(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    console.log("=== Review Action API Called ===");
    console.log("Request method:", request.method);
    console.log("Request URL:", request.url);
    
    const session = await getServerSession(authOptions);
    console.log("Session found:", !!session);
    console.log("Session user:", session?.user ? {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name
    } : "No user");

    if (!session?.user) {
      console.error("No session found for review action");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      console.error(`User ${session.user.id} with role ${session.user.role} attempted to perform review action`);
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const { id: reviewId } = await params;
    console.log(`Admin ${session.user.id} attempting to perform action on review ${reviewId}`);

    const body = await request.json();
    const { action } = body;
    console.log("Request body:", body);
    console.log("Action requested:", action);

    if (!action) {
      console.error("No action specified in request body");
      return NextResponse.json(
        { success: false, error: "Action is required" },
        { status: 400 },
      );
    }

    if (!["APPROVE", "REJECT", "VERIFY"].includes(action)) {
      console.error(`Invalid action '${action}' specified`);
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
      console.error(`Review ${reviewId} not found`);
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    console.log(`Review ${reviewId} found with status: ${review.status}, business: ${review.businessId}`);

    const updateData: { status?: ReviewStatus; isVerified?: boolean } = {};

    if (action === "APPROVE") {
      updateData.status = "APPROVED";
      console.log(`Approving review ${reviewId}`);
    } else if (action === "REJECT") {
      updateData.status = "REJECTED";
      console.log(`Rejecting review ${reviewId}`);
    } else if (action === "VERIFY") {
      if (review.status !== "APPROVED") {
        console.error(`Cannot verify review ${reviewId} with status ${review.status}`);
        return NextResponse.json(
          { success: false, error: "Only approved reviews can be verified" },
          { status: 400 },
        );
      }
      updateData.isVerified = true;
      console.log(`Verifying review ${reviewId}`);
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    console.log(`Review ${reviewId} updated successfully`);

    // Log the admin action
    try {
      const adminAction = await prisma.adminAction.create({
        data: {
          adminId: session.user.id,
          action: `REVIEW_${action}`,
          targetType: "REVIEW",
          targetId: reviewId,
          adminName: session.user.name || "Unknown Admin",
          details: {
            action: action,
            reviewId: reviewId,
            businessId: review.businessId,
            reviewerId: review.reviewerId,
            previousStatus: review.status,
            newStatus: updateData.status || review.status,
            isVerified: updateData.isVerified || review.isVerified,
            timestamp: new Date().toISOString(),
          },
        },
      });
      console.log(`Admin action logged successfully:`, adminAction.id);
    } catch (logError) {
      console.error("Failed to log admin action:", logError);
      // Don't fail the main operation if logging fails
    }

    // If approving, update business stats
    if (action === "APPROVE") {
      try {
        const newAverageRating = await calculateNewAverageRating(review.businessId);
        await prisma.business.update({
          where: { id: review.businessId },
          data: {
            totalReviews: {
              increment: 1,
            },
            averageRating: newAverageRating,
          },
        });
        console.log(`Business ${review.businessId} stats updated - new average rating: ${newAverageRating}`);
      } catch (statsError) {
        console.error("Failed to update business stats:", statsError);
        // Don't fail the main operation if stats update fails
      }
    }

    console.log("=== Review Action Completed Successfully ===");
    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: `Review ${action.toLowerCase()}d successfully`,
    });
  } catch (error) {
    console.error("=== Review Action Failed ===");
    console.error("Error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
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
