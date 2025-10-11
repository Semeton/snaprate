import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CouponService } from "@/services/CouponService";

// Generate PDF for a coupon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: couponId } = await params;

    console.log(`PDF request for coupon ID: ${couponId}`);

    const session = await getServerSession(authOptions);

    const couponService = new CouponService();

    // Try to find coupon by ID first, then by code
    let coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
            state: true,
            city: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            userIdentifier: true,
          },
        },
      },
    });

    console.log(`Coupon found by ID: ${!!coupon}`);

    // If not found by ID, try by code
    if (!coupon) {
      coupon = await couponService.getCouponByCode(couponId);
      console.log(`Coupon found by code: ${!!coupon}`);
    }

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check if user has access (business owner, assigned user, admin, or public access for active coupons)
    const hasAccess = session?.user
      ? session.user.role === "BUSINESS_OWNER" ||
        coupon.assignedUserId === session.user.id ||
        ["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "")
      : // Allow public access for active, unassigned coupons
        coupon.status === "ACTIVE" &&
        !coupon.assignedUserId &&
        new Date(coupon.validUntil) > new Date() &&
        new Date(coupon.validFrom) <= new Date();

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Generate PDF
    const pdfBuffer = await couponService.generateCouponPDF(couponId);
    const code = coupon.userSpecificCode || coupon.baseCode;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="coupon-${code}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate coupon PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate coupon PDF" },
      { status: 500 },
    );
  }
}
