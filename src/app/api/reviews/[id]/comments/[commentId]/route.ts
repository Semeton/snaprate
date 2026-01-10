import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Edit a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: reviewId, commentId } = await params;
    const body = await request.json();
    const { content } = body;

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

    // Get the comment to check ownership and existence
    const comment = await prisma.reviewComment.findUnique({
      where: {
        id: commentId,
        reviewId,
        deletedAt: null,
      },
      include: {
        review: {
          select: { businessId: true },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 },
      );
    }

    // Check if user can edit this comment
    const canEdit =
      comment.authorId === session.user.id || // Comment author
      (session.user.role === "BUSINESS_OWNER" &&
        comment.authorType === "BUSINESS_OWNER") || // Business owner
      ["ADMIN", "SUPER_ADMIN"].includes(session.user.role); // Admin

    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Update the comment
    const updatedComment = await prisma.reviewComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
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
      data: updatedComment,
      message: "Comment updated successfully",
    });
  } catch (error) {
    console.error("Failed to update comment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Soft delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: reviewId, commentId } = await params;

    // Get the comment to check ownership and existence
    const comment = await prisma.reviewComment.findUnique({
      where: {
        id: commentId,
        reviewId,
        deletedAt: null,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 },
      );
    }

    // Check if user can delete this comment
    const canDelete =
      comment.authorId === session.user.id || // Comment author
      (session.user.role === "BUSINESS_OWNER" &&
        comment.authorType === "BUSINESS_OWNER") || // Business owner
      ["ADMIN", "SUPER_ADMIN"].includes(session.user.role); // Admin

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Soft delete the comment
    await prisma.reviewComment.update({
      where: { id: commentId },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
