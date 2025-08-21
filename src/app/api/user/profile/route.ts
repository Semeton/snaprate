import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import logger from "@/lib/logger";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get full user profile from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        state: true,
        city: true,
        address: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logger.info("User profile retrieved successfully", { userId: user.id });

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Failed to get user profile", { error });
    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, state, city, address } = body;

    // Validate required fields
    if (!name || !state || !city || !address) {
      return NextResponse.json(
        { error: "Missing required fields: name, state, city, address" },
        { status: 400 },
      );
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
        state,
        city,
        address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        state: true,
        city: true,
        address: true,
        role: true,
        status: true,
      },
    });

    logger.info("User profile updated successfully", {
      userId: updatedUser.id,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error("Failed to update user profile", { error });
    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
  }
}
