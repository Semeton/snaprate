import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReviewService } from "@/services/ReviewService";
import { RewardService } from "@/services/RewardService";

const reviewService = new ReviewService();
const rewardService = new RewardService();

// GET /api/reviews - Get reviews with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    let reviews;
    if (businessId) {
      reviews = await reviewService.findByBusiness(businessId, page, limit);
    } else if (userId) {
      reviews = await reviewService.findByUser(userId, page, limit);
    } else {
      return NextResponse.json(
        { error: "businessId or userId required" },
        { status: 400 },
      );
    }

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, rating, title, content, images, video, isAnonymous } =
      body;

    // Validate required fields
    if (!businessId || !rating || !content) {
      return NextResponse.json(
        { error: "businessId, rating, and content are required" },
        { status: 400 },
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    // Create review
    const review = await reviewService.createReview(
      {
        rating,
        title,
        content,
        images: images || [],
        video,
        isAnonymous: isAnonymous || false,
      },
      session.user.id,
      businessId,
    );

    // Create reward for the review (NGN 50)
    const reward = await rewardService.createReward({
      type: "CASH",
      amount: 50,
      description: `Review reward for ${review.business?.name || "business"}`,
      userId: session.user.id,
      reviewId: review.id,
    });

    return NextResponse.json({
      review,
      reward,
      message: "Review submitted successfully! You earned NGN 50.",
    });
  } catch (error) {
    console.error("Failed to create review:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create review",
      },
      { status: 500 },
    );
  }
}
