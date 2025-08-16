import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import { UserRole, State } from "@/types";
import { isValidEmail, isValidPhone, validatePassword } from "@/lib/utils";

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
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

    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 },
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
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
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    if (state && !Object.values(State).includes(state)) {
      return NextResponse.json(
        { success: false, error: "Invalid state" },
        { status: 400 },
      );
    }

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

    // Send verification emails/SMS
    await authService.sendVerificationEmail(email);
    await authService.sendVerificationSMS(phone);

    return NextResponse.json({
      success: true,
      message: "User created successfully. Please verify your email and phone.",
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
    console.error("Signup error:", error);

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
