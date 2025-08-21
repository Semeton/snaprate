import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BusinessService } from "@/services/BusinessService";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can access reviews" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;

    // Get the user's business
    const business = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const reviews = await BusinessService.getBusinessReviews(
      business.id,
      status,
    );

    return NextResponse.json({ reviews });
  } catch (error) {
    logger.error("Failed to get reviews", { error });
    return NextResponse.json(
      {
        error: "Failed to get reviews",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can respond to reviews" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { reviewId, response } = body;

    if (!reviewId || !response) {
      return NextResponse.json(
        {
          error: "Missing required fields: reviewId, response",
        },
        { status: 400 },
      );
    }

    // Get the user's business
    const business = await BusinessService.getBusinessByOwnerId(
      session.user.id,
    );
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const updatedReview = await BusinessService.respondToReview(
      reviewId,
      business.id,
      response,
    );

    logger.info(`Review response added successfully: ${reviewId}`, {
      reviewId,
      businessId: business.id,
      ownerId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: "Review response added successfully",
    });
  } catch (error) {
    logger.error("Failed to respond to review", { error });
    return NextResponse.json(
      {
        error: "Failed to respond to review",
      },
      { status: 500 },
    );
  }
}
