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
        status: "APPROVED", // Only show approved reviews
        deletedAt: null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        comments: {
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
