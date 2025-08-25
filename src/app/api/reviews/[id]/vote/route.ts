import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Vote on a review (helpful/unhelpful)
export async function POST(
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
    const { voteType } = body;

    // Validation
    if (!voteType || !["HELPFUL", "UNHELPFUL"].includes(voteType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vote type. Must be 'HELPFUL' or 'UNHELPFUL'",
        },
        { status: 400 },
      );
    }

    // Check if review exists and is not deleted
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
        deletedAt: null,
      },
      select: { id: true, reviewerId: true },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    // Users cannot vote on their own reviews
    if (review.reviewerId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot vote on your own review" },
        { status: 400 },
      );
    }

    // Check if user already voted
    const existingVote = await prisma.reviewVote.findFirst({
      where: {
        reviewId,
        userId: session.user.id,
      },
    });

    if (existingVote) {
      // Update existing vote
      if (existingVote.voteType === voteType) {
        // Remove vote if clicking the same type
        await prisma.reviewVote.delete({
          where: { id: existingVote.id },
        });

        // Update helpful count
        const helpfulCount = voteType === "HELPFUL" ? -1 : 0;
        await prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              increment: helpfulCount,
            },
          },
        });

        return NextResponse.json({
          success: true,
          message: "Vote removed",
          data: { voteType: null, helpfulCount: helpfulCount },
        });
      } else {
        // Change vote type
        await prisma.reviewVote.update({
          where: { id: existingVote.id },
          data: { voteType, updatedAt: new Date() },
        });

        // Update helpful count
        const helpfulCountChange = voteType === "HELPFUL" ? 2 : -1; // +2 for helpful, -1 for unhelpful
        await prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              increment: helpfulCountChange,
            },
          },
        });

        return NextResponse.json({
          success: true,
          message: "Vote updated",
          data: { voteType, helpfulCountChange },
        });
      }
    } else {
      // Create new vote
      await prisma.reviewVote.create({
        data: {
          reviewId,
          userId: session.user.id,
          voteType,
        },
      });

      // Update helpful count
      const helpfulCountChange = voteType === "HELPFUL" ? 1 : 0;
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: helpfulCountChange,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Vote added",
        data: { voteType, helpfulCountChange },
      });
    }
  } catch (error) {
    console.error("Failed to vote on review:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Get user's vote on a review
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

    // Get user's vote on this review
    const vote = await prisma.reviewVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id,
        },
      },
      select: { voteType: true },
    });

    return NextResponse.json({
      success: true,
      data: { voteType: vote?.voteType || null },
    });
  } catch (error) {
    console.error("Failed to get user vote:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
