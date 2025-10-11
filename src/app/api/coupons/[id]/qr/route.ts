import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CouponService } from "@/services/CouponService";
import { QRCodeService } from "@/services/QRCodeService";

// Generate QR code for a coupon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: couponId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "dataurl";

    console.log(`QR Code request for coupon ID: ${couponId}`);

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

    const code = coupon.userSpecificCode || coupon.baseCode;
    const verificationURL = `https://snaprate.com/verify/${code}`;

    if (format === "svg") {
      const qrCodeSVG = await QRCodeService.generateQRCodeSVG(verificationURL);
      return new NextResponse(qrCodeSVG, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `inline; filename="coupon-${code}-qr.svg"`,
        },
      });
    } else if (format === "png") {
      const qrCodeBuffer = await QRCodeService.generateQRCodeBuffer(
        verificationURL,
      );
      return new NextResponse(qrCodeBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `inline; filename="coupon-${code}-qr.png"`,
        },
      });
    } else {
      // Default: return data URL
      const qrCodeDataURL = await QRCodeService.generateQRCodeDataURL(
        verificationURL,
      );
      return NextResponse.json({
        success: true,
        qrCode: qrCodeDataURL,
        verificationURL,
        couponCode: code,
      });
    }
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 },
    );
  }
}
