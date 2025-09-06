import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const couponService = new CouponService();

    // Verify user has access to this coupon
    const coupon = await couponService.getCouponByCode(couponId);
    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check if user has access (business owner or assigned user)
    const hasAccess =
      session.user.role === "BUSINESS_OWNER" ||
      coupon.assignedUserId === session.user.id ||
      ["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "");

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
