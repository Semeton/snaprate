import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get comments for a review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: reviewId } = await params;

    // Get the review to check if it exists and is not deleted
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
        deletedAt: null,
      },
      select: { id: true, businessId: true },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    // Get all comments for this review (including nested replies)
    const comments = await prisma.reviewComment.findMany({
      where: {
        reviewId,
        deletedAt: null,
        parentId: null, // Only top-level comments
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        replies: {
          where: { deletedAt: null },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
            votes: {
              where: { deletedAt: null },
              select: { voteType: true, userId: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        votes: {
          where: { deletedAt: null },
          select: { voteType: true, userId: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Add a new comment to a review
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
    const { content, parentId } = body;

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Comment content is required" },
        { status: 400 },
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "Comment content must be less than 1000 characters",
        },
        { status: 400 },
      );
    }

    // Get the review to check if it exists and is not deleted
    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
        deletedAt: null,
      },
      include: {
        business: {
          select: { ownerId: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    // Determine author type
    let authorType = "REVIEWER";
    if (
      session.user.role === "BUSINESS_OWNER" &&
      review.business.ownerId === session.user.id
    ) {
      authorType = "BUSINESS_OWNER";
    } else if (session.user.role === "AGENT") {
      authorType = "AGENT";
    }

    // If this is a reply, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.reviewComment.findUnique({
        where: {
          id: parentId,
          reviewId,
          deletedAt: null,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { success: false, error: "Parent comment not found" },
          { status: 404 },
        );
      }
    }

    // Create the comment
    const comment = await prisma.reviewComment.create({
      data: {
        content: content.trim(),
        reviewId,
        authorId: session.user.id,
        authorType,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Failed to add comment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
