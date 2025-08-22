import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RewardType } from "@/types";

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
    const type = searchParams.get("type") as RewardType | null;
    const isRedeemed = searchParams.get("isRedeemed") === "true";

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

    // Get rewards
    const skip = (page - 1) * limit;
    const where: {
      referrerId: string;
      type?: RewardType;
      isRedeemed?: boolean;
    } = { referrerId: userId };
    if (type) {
      where.type = type;
    }
    if (isRedeemed !== undefined) {
      where.isRedeemed = isRedeemed;
    }

    const [rewards, total] = await Promise.all([
      prisma.reward.findMany({
        where,
        include: {
          referrer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.reward.count({ where }),
    ]);

    // Get reward stats
    const [totalRewards, totalAmount, redeemedRewards] = await Promise.all([
      prisma.reward.count({ where: { referrerId: userId } }),
      prisma.reward.aggregate({
        where: { referrerId: userId },
        _sum: { amount: true },
      }),
      prisma.reward.count({
        where: {
          referrerId: userId,
          isRedeemed: true,
        },
      }),
    ]);

    const stats = {
      totalRewards,
      totalAmount: totalAmount._sum.amount || 0,
      redeemedRewards,
    };

    return NextResponse.json({
      success: true,
      data: {
        rewards,
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
    console.error("Rewards fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rewards" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json(
        { success: false, error: "Reward ID is required" },
        { status: 400 },
      );
    }

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

    // Redeem reward
    const redeemedReward = await prisma.reward.update({
      where: { id: rewardId },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
      },
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reward redeemed successfully",
      data: redeemedReward,
    });
  } catch (error) {
    console.error("Reward redemption error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to redeem reward" },
      { status: 500 },
    );
  }
}
