import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RewardService } from "@/services/RewardService";

const rewardService = new RewardService();

// GET /api/rewards - Get user rewards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const rewards = await rewardService.findByUser(
      session.user.id,
      page,
      limit,
    );
    return NextResponse.json(rewards);
  } catch (error) {
    console.error("Failed to fetch rewards:", error);
    return NextResponse.json(
      { error: "Failed to fetch rewards" },
      { status: 500 },
    );
  }
}
