import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import { isValidEmail } from "@/lib/utils";
import logger from "@/lib/logger";

const authService = new AuthService();

// Simple in-memory rate limiting (in production, use Redis or similar)
const resendAttempts = new Map<
  string,
  { count: number; lastAttempt: number }
>();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    logger.info("Resend verification API endpoint called");

    const body = await request.json();
    const { email } = body;

    logger.debug("Resend verification request data received", { email });

    // Validation
    if (!email) {
      logger.warn("Resend verification validation failed - email missing");
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      logger.warn(
        "Resend verification validation failed - invalid email format",
        { email },
      );
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Rate limiting check
    const now = Date.now();
    const userAttempts = resendAttempts.get(email);

    if (userAttempts) {
      // Reset if window has passed
      if (now - userAttempts.lastAttempt > WINDOW_MS) {
        resendAttempts.set(email, { count: 1, lastAttempt: now });
      } else if (userAttempts.count >= MAX_ATTEMPTS) {
        logger.warn("Rate limit exceeded for resend verification", { email });
        return NextResponse.json(
          {
            success: false,
            error: `Too many attempts. Please wait ${Math.ceil(
              (WINDOW_MS - (now - userAttempts.lastAttempt)) / 60000,
            )} minutes before trying again.`,
          },
          { status: 429 },
        );
      } else {
        // Increment attempt count
        resendAttempts.set(email, {
          count: userAttempts.count + 1,
          lastAttempt: now,
        });
      }
    } else {
      // First attempt
      resendAttempts.set(email, { count: 1, lastAttempt: now });
    }

    logger.info(
      "Resend verification validation passed, proceeding with resend",
      { email },
    );

    // Resend verification email
    await authService.resendVerificationEmail(email);

    logger.info("Verification email resent successfully", { email });

    return NextResponse.json({
      success: true,
      message:
        "Verification email resent successfully. Please check your inbox.",
    });
  } catch (error) {
    logger.error("Resend verification API error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json(
          { success: false, error: "User not found with this email" },
          { status: 404 },
        );
      }

      if (error.message.includes("already verified")) {
        return NextResponse.json(
          { success: false, error: "Email is already verified" },
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
