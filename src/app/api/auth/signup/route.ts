import { NextRequest, NextResponse } from "next/server";
import { isValidEmail, validatePassword } from "@/lib/utils";
import { AuthService } from "@/services/AuthService";
import { UserRole, State } from "@/types";
import logger from "@/lib/logger";

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    logger.info("Signup API endpoint called");

    const body = await request.json();
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role,
      referralCode,
      state,
      city,
      address,
    } = body;

    logger.debug("Signup request data received", {
      name,
      email,
      phone,
      role,
      hasReferralCode: !!referralCode,
      state,
      city,
      hasAddress: !!address,
    });

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      logger.warn("Signup validation failed - missing required fields", {
        hasName: !!name,
        hasEmail: !!email,
        hasPhone: !!phone,
        hasPassword: !!password,
        hasConfirmPassword: !!confirmPassword,
      });
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      logger.warn("Signup validation failed - passwords do not match", {
        email,
      });
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      logger.warn("Signup validation failed - invalid email format", { email });
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      logger.warn("Signup validation failed - password requirements not met", {
        email,
        passwordErrors: passwordValidation.errors,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet requirements",
          details: passwordValidation.errors,
        },
        { status: 400 },
      );
    }

    if (role && !Object.values(UserRole).includes(role)) {
      logger.warn("Signup validation failed - invalid role", { email, role });
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    if (state && !Object.values(State).includes(state)) {
      logger.warn("Signup validation failed - invalid state", { email, state });
      return NextResponse.json(
        { success: false, error: "Invalid state" },
        { status: 400 },
      );
    }

    logger.info("Signup validation passed, proceeding with user creation", {
      email,
    });

    // Create user
    const result = await authService.signUp({
      name,
      email,
      phone,
      password,
      role: role || UserRole.REVIEWER,
      referralCode,
      state,
      city,
      address,
    });

    logger.info("User signup completed successfully", {
      userId: result.user.id,
      email,
      phone,
      role: result.user.role,
    });

    return NextResponse.json({
      success: true,
      message:
        "User created successfully. Please check your email for verification. Didn't receive the email? You can resend it from the verification page.",
      data: {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
          status: result.user.status,
        },
        token: result.token,
      },
    });
  } catch (error) {
    logger.error("Signup API error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 },
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
