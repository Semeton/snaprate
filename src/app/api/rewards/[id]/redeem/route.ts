import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RewardService } from "@/services/RewardService";

const rewardService = new RewardService();

// POST /api/rewards/[id]/redeem - Redeem a reward
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body; // "AIRTIME" or "COUPON"

    if (!type || !["AIRTIME", "COUPON"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid redemption type. Must be AIRTIME or COUPON" },
        { status: 400 },
      );
    }

    const reward = await rewardService.redeemReward(params.id, type);

    return NextResponse.json({
      reward,
      message: `Reward redeemed successfully as ${type.toLowerCase()}!`,
    });
  } catch (error) {
    console.error("Failed to redeem reward:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to redeem reward",
      },
      { status: 500 },
    );
  }
}
