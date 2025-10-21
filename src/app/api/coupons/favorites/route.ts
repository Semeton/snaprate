import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const favorites = await prisma.couponFavorite.findMany({
      where: { userId: session.user.id },
      include: {
        coupon: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                logo: true,
                city: true,
                state: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.couponFavorite.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      favorites: favorites.map((fav) => ({
        ...fav.coupon,
        favoritedAt: fav.createdAt,
        isAvailable: fav.coupon.maxUses
          ? fav.coupon.currentUses < fav.coupon.maxUses
          : true,
        remainingUses: fav.coupon.maxUses
          ? fav.coupon.maxUses - fav.coupon.currentUses
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch coupon favorites:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch favorites",
        details: error instanceof Error ? error.message : "Unknown error",
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

    const { couponId } = await request.json();

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 },
      );
    }

    // Check if coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      select: { id: true, status: true },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await prisma.couponFavorite.findUnique({
      where: {
        userId_couponId: {
          userId: session.user.id,
          couponId: couponId,
        },
      },
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: "Coupon is already in favorites" },
        { status: 400 },
      );
    }

    // Add to favorites
    const favorite = await prisma.couponFavorite.create({
      data: {
        userId: session.user.id,
        couponId: couponId,
      },
      include: {
        coupon: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                logo: true,
                city: true,
                state: true,
                category: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon added to favorites",
      favorite: {
        ...favorite.coupon,
        favoritedAt: favorite.createdAt,
        isAvailable: favorite.coupon.maxUses
          ? favorite.coupon.currentUses < favorite.coupon.maxUses
          : true,
        remainingUses: favorite.coupon.maxUses
          ? favorite.coupon.maxUses - favorite.coupon.currentUses
          : null,
      },
    });
  } catch (error) {
    console.error("Failed to add coupon to favorites:", error);
    return NextResponse.json(
      {
        error: "Failed to add to favorites",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get("couponId");

    if (!couponId) {
      return NextResponse.json(
        { error: "Coupon ID is required" },
        { status: 400 },
      );
    }

    // Remove from favorites
    const deleted = await prisma.couponFavorite.deleteMany({
      where: {
        userId: session.user.id,
        couponId: couponId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Coupon not found in favorites" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon removed from favorites",
    });
  } catch (error) {
    console.error("Failed to remove coupon from favorites:", error);
    return NextResponse.json(
      {
        error: "Failed to remove from favorites",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
