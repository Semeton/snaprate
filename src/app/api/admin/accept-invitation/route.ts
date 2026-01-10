import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, name } = body;

    if (!token || !password || !name) {
      return NextResponse.json(
        { success: false, error: "Token, password, and name are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 },
      );
    }

    // Find the invitation
    const invitation = await prisma.adminInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token" },
        { status: 400 },
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "Invitation has already been used or expired",
        },
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

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        name,
        role: invitation.role,
        status: "ACTIVE",
        isVerified: true,
        referralCode: `ADMIN${Date.now()}`,
        state: "LAGOS", // Default values
        city: "Lagos",
        address: "Admin Account",
        emailVerified: new Date(),
        phoneVerified: new Date(),
      },
    });

    // Update invitation status
    await prisma.adminInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: invitation.invitedBy,
        action: "ADMIN_ACCEPTED_INVITATION",
        targetType: "USER",
        targetId: adminUser.id,
        details: {
          invitedEmail: invitation.email,
          role: invitation.role,
          invitationId: invitation.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      data: {
        userId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}

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
    const invitation = await prisma.adminInvitation.findUnique({
      where: { invitationToken: token },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token" },
        { status: 400 },
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "Invitation has already been used or expired",
        },
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
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Get invitation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get invitation" },
      { status: 500 },
    );
  }
}
