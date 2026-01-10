import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import { isValidEmail } from "@/lib/utils";
import logger from "@/lib/logger";

const authService = new AuthService();

export async function POST(request: NextRequest) {
  let email: string = "";

  try {
    logger.info("Signin API endpoint called");

    const body = await request.json();
    email = body.email;
    const { password } = body;

    logger.debug("Signin request data received", {
      email,
      hasPassword: !!password,
    });

    // Validation
    if (!email || !password) {
      logger.warn("Signin validation failed - missing required fields", {
        hasEmail: !!email,
        hasPassword: !!password,
      });
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      logger.warn("Signin validation failed - invalid email format", { email });
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (password.length < 1) {
      logger.warn("Signin validation failed - password too short", { email });
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 },
      );
    }

    logger.info("Signin validation passed, proceeding with authentication", {
      email,
    });

    // Authenticate user
    const result = await authService.signIn({ email, password });

    logger.info("User signin successful", {
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      status: result.user.status,
    });

    return NextResponse.json({
      success: true,
      message: "Sign in successful",
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
          status: result.user.status,
          isVerified: result.user.isVerified,
          emailVerified: result.user.emailVerified,
          phoneVerified: result.user.phoneVerified,
        },
        token: result.token,
      },
    });
  } catch (error) {
    logger.error("Signin API error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      if (error.message.includes("Invalid credentials")) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 },
        );
      }

      if (error.message.includes("not active")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 },
        );
      }

      if (error.message.includes("Email not verified")) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            action: "resend_verification",
            email: email,
          },
          { status: 403 },
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
