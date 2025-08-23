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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Check if user is already an agent
    if (user.role === "AGENT") {
      return NextResponse.json(
        { success: false, error: "User is already an agent" },
        { status: 400 },
      );
    }

    // Check if user has enough reviews
    const reviewCount = await prisma.review.count({
      where: { reviewerId: user.id },
    });

    if (reviewCount < 5) {
      return NextResponse.json(
        { success: false, error: "Need at least 5 reviews to apply" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { motivation, experience, businessKnowledge, commitment } = body;

    // Validate required fields
    if (!motivation || !experience || !businessKnowledge || !commitment) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    // Create agent application
    const application = await prisma.agentApplication.create({
      data: {
        userId: user.id,
        motivation,
        experience,
        businessKnowledge,
        commitment,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      data: application,
      message: "Agent application submitted successfully",
    });
  } catch (error) {
    console.error("Agent application error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit application" },
      { status: 500 },
    );
  }
}
