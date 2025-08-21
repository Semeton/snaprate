import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, amount } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { error: "Type and amount are required" },
        { status: 400 }
      );
    }

    if (amount < 1000) {
      return NextResponse.json(
        { error: "Minimum redemption amount is ₦1,000" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get user's total earnings and already redeemed amount
    const totalEarnings = await prisma.reward.aggregate({
      where: { referrerId: userId },
      _sum: { amount: true },
    });

    const redeemedAmount = await prisma.reward.aggregate({
      where: { 
        referrerId: userId,
        status: "APPROVED"
      },
      _sum: { amount: true },
    });

    const availableAmount = (totalEarnings._sum.amount || 0) - (redeemedAmount._sum.amount || 0);

    if (availableAmount < amount) {
      return NextResponse.json(
        { error: "Insufficient balance for redemption" },
        { status: 400 }
      );
    }

    // Create redemption record
    const redemption = await prisma.reward.create({
      data: {
        type: type === "AIRTIME" ? "AIRTIME_REDEMPTION" : "COUPON_REDEMPTION",
        amount: -amount, // Negative amount to deduct from balance
        description: `Redeemed ₦${amount} for ${type.toLowerCase()}`,
        referrerId: userId,
        status: "APPROVED", // Auto-approve redemptions
      },
    });

    logger.info("Reward redemption successful", {
      userId,
      type,
      amount,
      redemptionId: redemption.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ₦${amount} for ${type.toLowerCase()}`,
      redemption,
    });
  } catch (error) {
    logger.error("Failed to redeem reward", { error });
    return NextResponse.json(
      { error: "Failed to redeem reward" },
      { status: 500 }
    );
  }
}
