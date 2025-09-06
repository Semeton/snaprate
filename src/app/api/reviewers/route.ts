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

    // Fetch reviewers with optional search
    const reviewers = await prisma.user.findMany({
      where: {
        role: "REVIEWER",
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
        createdAt: true,
        _count: {
          select: {
            reviews: {
              where: {
                businessId: session.user.businessId,
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
