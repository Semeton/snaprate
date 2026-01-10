import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserService } from "@/services/UserService";

const userService = new UserService();

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
    const user = await userService.findByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const userId = user.id;

    // Get referrals
    const referrals = await userService.getReferrals(userId);

    // Get referral stats
    const referralStats = await userService.getReferralStats(userId);

    return NextResponse.json({
      success: true,
      data: {
        referrals,
        stats: referralStats,
      },
    });
  } catch (error) {
    console.error("Referrals fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch referrals" },
      { status: 500 },
    );
  }
}
