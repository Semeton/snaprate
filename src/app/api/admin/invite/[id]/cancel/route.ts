import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
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
        { status: 403 }
      );
    }

    // Get the invitation
    const invitation = await prisma.adminInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Can only cancel pending invitations" },
        { status: 400 }
      );
    }

    // Delete the invitation
    await prisma.adminInvitation.delete({
      where: { id },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: "ADMIN_INVITATION_CANCELLED",
        targetType: "INVITATION",
        targetId: id,
        details: {
          cancelledEmail: invitation.email,
          role: invitation.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel invitation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
