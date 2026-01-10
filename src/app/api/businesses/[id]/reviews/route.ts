import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get reviews for a specific business
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: businessId } = await params;

    // Check if business exists
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Get reviews with comments and votes
    const reviews = await prisma.review.findMany({
      where: {
        businessId,
        // Include all reviews (approved and pending) - status filtering removed
        deletedAt: null,
      },
      select: {
        id: true,
        rating: true,
        content: true,

        images: true,
        video: true,
        status: true,
        helpfulCount: true,
        businessResponse: true,
        businessResponseDate: true,
        createdAt: true,
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        comments: {
          where: { deletedAt: null },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            isEdited: true,
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
              select: {
                id: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                isEdited: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    role: true,
                  },
                },
                votes: {
                  select: { voteType: true, userId: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
            votes: {
              select: { voteType: true, userId: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        votes: {
          select: { voteType: true, userId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Failed to fetch business reviews:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
