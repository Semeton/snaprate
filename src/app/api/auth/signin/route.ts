import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/AuthService";
import { isValidEmail } from "@/lib/utils";

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (password.length < 1) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 },
      );
    }

    // Authenticate user
    const result = await authService.signIn({ email, password });

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
    console.error("Sign in error:", error);

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
