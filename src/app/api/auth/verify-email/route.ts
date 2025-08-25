import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import logger from "@/lib/logger";

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    logger.info("Email verification API endpoint called");

    const body = await request.json();
    const { code } = body;

    logger.debug("Email verification request data received", {
      codePrefix: code ? code.substring(0, 8) + "..." : "no code",
    });

    if (!code) {
      logger.warn("Email verification failed - code missing");
      return NextResponse.json(
        { success: false, error: "Verification code is required" },
        { status: 400 },
      );
    }

    // Verify the email with the provided token
    const result = await authService.verifyEmail(code);

    if (result.success) {
      logger.info("Email verification successful", {
        codePrefix: code.substring(0, 8) + "...",
        userId: result.user?.id,
      });

      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
        user: result.user,
        token: result.token,
      });
    } else {
      logger.warn("Email verification failed - invalid result", {
        codePrefix: code.substring(0, 8) + "...",
      });

      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 400 },
      );
    }
  } catch (error) {
    logger.error("Email verification API error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      if (error.message.includes("Invalid or expired")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
