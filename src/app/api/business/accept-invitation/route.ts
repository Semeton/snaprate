import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 },
      );
    }

    // Find the invitation
    const invitation = await prisma.businessInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Invitation has already been processed" },
        { status: 400 },
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Invitation has expired" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        businessName: invitation.businessName,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Get business invitation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get invitation" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json(
        { success: false, error: "Token, name, and password are required" },
        { status: 400 },
      );
    }

    // Find the invitation
    const invitation = await prisma.businessInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Invitation has already been processed" },
        { status: 400 },
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Invitation has expired" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the business owner user
    const user = await prisma.user.create({
      data: {
        name,
        email: invitation.email,
        password: hashedPassword,
        role: "BUSINESS_OWNER",
        status: "ACTIVE",
        emailVerified: new Date(),
        isVerified: true,
        referralCode: `BO_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        state: "LAGOS", // Default state, will be updated when business is created
        city: "Lagos", // Default city, will be updated when business is created
        address: "To be updated", // Will be updated when business is created
      },
    });

    // Update invitation status
    await prisma.businessInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business owner account created successfully",
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Accept business invitation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}
