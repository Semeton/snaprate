import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReviewService } from "@/services/ReviewService";
import { prisma } from "@/lib/prisma";

const reviewService = new ReviewService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") as any;

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const userId = user.id;

    // Get user reviews
    const reviews = await reviewService.getUserReviews(userId, {
      page,
      limit,
      status,
    });

    // Get review stats
    const stats = await reviewService.getReviewStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.reviews,
        pagination: reviews.pagination,
        stats,
      },
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
