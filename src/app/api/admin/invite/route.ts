import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { EmailService } from "@/services/EmailService";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is super admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Super admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: "Email and role are required" },
        { status: 400 },
      );
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be ADMIN or SUPER_ADMIN" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 },
      );
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.adminInvitation.findUnique({
      where: { email },
    });

    if (existingInvitation && existingInvitation.status === "PENDING") {
      return NextResponse.json(
        { success: false, error: "Invitation already sent to this email" },
        { status: 400 },
      );
    }

    // Generate invitation token
    const invitationToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create invitation
    const invitation = await prisma.adminInvitation.create({
      data: {
        email,
        role,
        invitedBy: session.user.id,
        invitationToken,
        expiresAt,
        status: "PENDING",
      },
    });

    // Send invitation email
    const invitationLink = `${process.env.NEXTAUTH_URL}/admin/accept-invitation?token=${invitationToken}`;

    try {
      const emailService = new EmailService();
      const emailSent = await emailService.sendAdminInvitationEmail(email, role, invitationLink);
      
      if (!emailSent) {
        // Delete the invitation if email fails
        await prisma.adminInvitation.delete({
          where: { id: invitation.id },
        });
        return NextResponse.json(
          { success: false, error: "Failed to send invitation email" },
          { status: 500 }
        );
      }
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Delete the invitation if email fails
      await prisma.adminInvitation.delete({
        where: { id: invitation.id },
      });
      return NextResponse.json(
        { success: false, error: "Failed to send invitation email" },
        { status: 500 },
      );
    }

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: "ADMIN_INVITED",
        targetType: "USER",
        targetId: invitation.id,
        details: {
          invitedEmail: email,
          role,
          invitationId: invitation.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        invitationId: invitation.id,
        email,
        role,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Admin invitation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send invitation" },
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

    // Check if user is admin or super admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!adminUser || !["ADMIN", "SUPER_ADMIN"].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get all invitations
    const invitations = await prisma.adminInvitation.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        invitationToken: true,
        invitedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: invitations,
    });
  } catch (error) {
    console.error("Get invitations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invitations" },
      { status: 500 },
    );
  }
}
