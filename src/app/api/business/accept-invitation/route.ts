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

    // Find the business owner by email
    const businessOwner = await prisma.user.findUnique({
      where: { email: invitation.email },
      include: { business: true },
    });

    if (!businessOwner) {
      return NextResponse.json(
        { success: false, error: "Business owner not found" },
        { status: 404 },
      );
    }

    if (!businessOwner.business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        businessName: invitation.businessName,
        ownerName: businessOwner.name, // Pre-fill the owner name
        expiresAt: invitation.expiresAt,
        businessId: businessOwner.business.id,
        ownerId: businessOwner.id,
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

    // Find the business owner by email
    const businessOwner = await prisma.user.findUnique({
      where: { email: invitation.email },
      include: { business: true },
    });

    if (!businessOwner) {
      return NextResponse.json(
        { success: false, error: "Business owner not found" },
        { status: 404 },
      );
    }

    if (!businessOwner.business) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      // User exists, just update their password and name if needed
      const hashedPassword = await bcrypt.hash(password, 12);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: name,
          password: hashedPassword,
          // Update other fields if they were missing
          phone: existingUser.phone || businessOwner.phone,
          state: existingUser.state || businessOwner.state,
          city: existingUser.city || businessOwner.city,
          address: existingUser.address || businessOwner.address,
        },
      });

      console.log("Existing business owner password updated:", existingUser.id);
    } else {
      // This shouldn't happen since we create the user in the admin flow
      return NextResponse.json(
        { success: false, error: "Business owner account not found" },
        { status: 404 },
      );
    }

    // Update invitation status
    await prisma.businessInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Business owner account activated successfully",
      data: {
        userId: businessOwner.id,
        email: businessOwner.email,
        name: businessOwner.name,
        role: businessOwner.role,
        businessId: businessOwner.business.id,
        businessName: businessOwner.business.name,
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
