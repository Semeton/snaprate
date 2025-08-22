import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const status = searchParams.get("status") as string | null;

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
    const skip = (page - 1) * limit;
    const where: { reviewerId: string; status?: string } = {
      reviewerId: userId,
    };
    if (status) {
      where.status = status;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          business: {
            select: {
              id: true,
              name: true,
              category: true,
              state: true,
              city: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Get review stats
    const [totalReviews, averageRating, totalHelpful] = await Promise.all([
      prisma.review.count({ where: { reviewerId: userId } }),
      prisma.review.aggregate({
        where: { reviewerId: userId },
        _avg: { rating: true },
      }),
      prisma.review.aggregate({
        where: { reviewerId: userId },
        _sum: { helpfulCount: true },
      }),
    ]);

    const stats = {
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      totalHelpful: totalHelpful._sum.helpfulCount || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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
