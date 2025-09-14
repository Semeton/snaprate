import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only business owners can view reviewers
    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        { error: "Only business owners can view reviewers" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get the user's business first
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    // Fetch reviewers and agents with optional search (both can review businesses)
    const reviewers = await prisma.user.findMany({
      where: {
        role: { in: ["REVIEWER", "AGENT"] },
        status: "ACTIVE",
        isVerified: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { userIdentifier: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        userIdentifier: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            reviews: {
              where: {
                businessId: business.id,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Format the response
    const formattedReviewers = reviewers.map((reviewer) => ({
      id: reviewer.id,
      name: reviewer.name,
      email: reviewer.email,
      userIdentifier: reviewer.userIdentifier,
      role: reviewer.role,
      joinedDate: reviewer.createdAt,
      reviewsCount: reviewer._count.reviews,
    }));

    return NextResponse.json({
      success: true,
      reviewers: formattedReviewers,
    });
  } catch (error) {
    console.error("Failed to fetch reviewers:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviewers" },
      { status: 500 },
    );
  }
}
