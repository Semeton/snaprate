import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CouponService } from "@/services/CouponService";

// Generate PDF for a coupon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: couponId } = await params;

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
