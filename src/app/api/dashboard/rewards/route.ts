import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RewardService } from "@/services/RewardService";
import { prisma } from "@/lib/prisma";
import { RewardType } from "@/types";

const rewardService = new RewardService();

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
    const rewards = await rewardService.getUserRewards(userId, {
      page,
      limit,
      type: type || undefined,
      isRedeemed,
    });

    // Get reward stats
    const stats = await rewardService.getRewardStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        rewards: rewards.rewards,
        pagination: rewards.pagination,
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
    const redeemedReward = await rewardService.redeemReward(rewardId, userId);

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
