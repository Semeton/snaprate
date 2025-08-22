import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { type, phone, amount } = body; // type: "AIRTIME" or "COUPON"

    if (!type || !["AIRTIME", "COUPON"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid redemption type. Must be AIRTIME or COUPON",
        },
        { status: 400 },
      );
    }

    if (type === "AIRTIME" && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number required for airtime redemption",
        },
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

    // Calculate total available rewards
    const totalRewards = await prisma.reward.aggregate({
      where: {
        referrerId: user.id,
        isRedeemed: false,
      },
      _sum: { amount: true },
    });

    const totalAmount = totalRewards._sum.amount || 0;

    // Check minimum redemption amount
    if (totalAmount < 1000) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum redemption amount is ₦1000. You have ₦${totalAmount} available.`,
        },
        { status: 400 },
      );
    }

    // Check if user specified amount and it's valid
    const redemptionAmount =
      amount && amount <= totalAmount ? amount : totalAmount;

    // Mark rewards as redeemed
    const rewardsToRedeem = await prisma.reward.findMany({
      where: {
        referrerId: user.id,
        isRedeemed: false,
      },
      orderBy: { createdAt: "asc" },
    });

    let accumulatedAmount = 0;
    const redeemedRewardIds: string[] = [];

    for (const reward of rewardsToRedeem) {
      if (accumulatedAmount < redemptionAmount) {
        accumulatedAmount += reward.amount;
        redeemedRewardIds.push(reward.id);
      } else {
        break;
      }
    }

    // Update rewards to redeemed
    await prisma.reward.updateMany({
      where: {
        id: { in: redeemedRewardIds },
      },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
      },
    });

    // Create redemption record
    const redemption = await prisma.rewardRedemption.create({
      data: {
        userId: user.id,
        type,
        amount: redemptionAmount,
        phone: type === "AIRTIME" ? phone : null,
        status: "PENDING",
        processedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ₦${redemptionAmount} as ${type.toLowerCase()}!`,
      data: {
        redemption,
        totalRedeemed: redemptionAmount,
        remainingBalance: totalAmount - redemptionAmount,
      },
    });
  } catch (error) {
    console.error("Reward redemption error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to redeem rewards" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
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

    // Get user's redemption history
    const redemptions = await prisma.rewardRedemption.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Get current reward balance
    const totalRewards = await prisma.reward.aggregate({
      where: {
        referrerId: user.id,
        isRedeemed: false,
      },
      _sum: { amount: true },
    });

    const availableBalance = totalRewards._sum.amount || 0;

    return NextResponse.json({
      success: true,
      data: {
        redemptions,
        availableBalance,
        canRedeem: availableBalance >= 1000,
        minimumRedemption: 1000,
      },
    });
  } catch (error) {
    console.error("Failed to fetch redemption history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch redemption history" },
      { status: 500 },
    );
  }
}
