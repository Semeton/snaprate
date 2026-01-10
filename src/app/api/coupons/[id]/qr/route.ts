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

    // If not found by ID, try by code
    if (!coupon) {
      const couponByCode = await couponService.getCouponByCode(couponId);
      if (!couponByCode) {
        return NextResponse.json(
          { error: "Coupon not found" },
          { status: 404 },
        );
      }

      // Fetch the full coupon with relations
      coupon = await prisma.coupon.findUnique({
        where: { id: couponByCode.id },
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

      if (!coupon) {
        return NextResponse.json(
          { error: "Coupon not found" },
          { status: 404 },
        );
      }
    }

    let assignment = null;

    let hasAccess = false;

    if (session?.user) {
      const business = await prisma.business.findUnique({
        where: { ownerId: session.user.id },
        select: { id: true },
      });

      if (business?.id === coupon.businessId) {
        hasAccess = true;
      }
      // Check if user is assigned to this coupon
      else if (["REVIEWER", "AGENT"].includes(session.user.role || "")) {
        assignment = await prisma.couponAssignment.findFirst({
          where: {
            couponId: coupon.id,
            userId: session.user.id,
          },
        });
        hasAccess = !!assignment;
      }
      // Check if user is admin
      else if (["ADMIN", "SUPER_ADMIN"].includes(session.user.role || "")) {
        hasAccess = true;
      }
    } else {
      // Allow public access for active public coupons
      hasAccess =
        coupon.status === "ACTIVE" &&
        coupon.couponType === "PUBLIC" &&
        new Date(coupon.validUntil) > new Date() &&
        new Date(coupon.validFrom) <= new Date();
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get user-specific code if user is assigned to this coupon
    let code = assignment?.userSpecificCode || coupon.baseCode!;
    if (
      session?.user &&
      ["REVIEWER", "AGENT"].includes(session.user.role || "")
    ) {
      const assignment = await prisma.couponAssignment.findFirst({
        where: {
          couponId: coupon.id,
          userId: session.user.id,
          status: "ASSIGNED",
        },
        select: {
          userSpecificCode: true,
        },
      });

      if (assignment?.userSpecificCode) {
        code = assignment.userSpecificCode;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://snaprate.com";
    const verificationURL = `${appUrl.replace(
      /\/$/,
      "",
    )}/coupons/verify/${code}`;

    if (format === "svg") {
      const qrCodeSVG = await QRCodeService.generateQRCodeSVG(verificationURL);
      return new NextResponse(Buffer.from(qrCodeSVG), {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `inline; filename="coupon-${code}-qr.svg"`,
        },
      });
    } else if (format === "png") {
      const qrCodeBuffer = await QRCodeService.generateQRCodeBuffer(
        verificationURL,
      );
      return new NextResponse(Buffer.from(qrCodeBuffer), {
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
