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
    const limit = parseInt(searchParams.get("limit") || "3"); // Show 3 businesses by default

    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        logo: true,
        coverImage: true,
        averageRating: true,
        totalReviews: true,
        totalVisits: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const total = await prisma.business.count();

    return NextResponse.json({
      success: true,
      data: {
        businesses,
        total,
        hasMore: total > limit,
      },
    });
  } catch (error) {
    console.error("Businesses fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch businesses" },
      { status: 500 },
    );
  }
}
