import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { ReviewStatus } from "@prisma/client";

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
    const status = searchParams.get("status") as ReviewStatus;

    // Get the user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Get reviews for the business
    const where: { businessId: string; status?: ReviewStatus } = {
      businessId: business.id,
    };

    if (status) {
      where.status = status;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Update the review with business response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        businessResponse: response,
        businessResponseDate: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

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
