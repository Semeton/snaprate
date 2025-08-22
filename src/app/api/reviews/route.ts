import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { businessId, rating, title, content, images, video, isAnonymous } =
      body;

    // Validation
    if (!businessId || !rating || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Business ID, rating, and content are required",
        },
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
          error: "Review content must be at least 10 characters long",
        },
        { status: 400 },
      );
    }

    // Check if user has already reviewed this business
    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId: session.user.id,
        businessId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "You have already reviewed this business" },
        { status: 409 },
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        businessId,
        rating,
        content,
        images: images || [],
        video: video || null,
        status: "PENDING",
        isVerified: false,
        helpfulCount: 0,
      },
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
          },
        },
      },
    });

    // Update business metrics
    await prisma.business.update({
      where: { id: businessId },
      data: {
        totalReviews: {
          increment: 1,
        },
        averageRating: {
          set: await prisma.review
            .aggregate({
              where: { businessId },
              _avg: { rating: true },
            })
            .then((result) => result._avg.rating || 0),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (businessId) {
      try {
        const skip = (page - 1) * limit;
        const where: any = { businessId };
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

        const result = {
          reviews,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };

        return NextResponse.json({ success: true, data: reviews });
      } catch (error) {
        console.error("Failed to fetch business reviews:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch reviews" },
          { status: 500 },
        );
      }
    }

    if (userId) {
      try {
        const skip = (page - 1) * limit;
        const where: any = { reviewerId: userId };
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

        const result = {
          reviews,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };

        return NextResponse.json({ success: true, data: result });
      } catch (error) {
        console.error("Failed to fetch user reviews:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch reviews" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Business ID or User ID is required" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
