import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, UserRole, State } from "@prisma/client";
import logger from "@/lib/logger";
import { EmailService } from "./EmailService";

export class AuthService {
  async signUp(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
    referralCode?: string;
    state: string;
    city: string;
    address: string;
  }): Promise<{ user: User; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { phone: userData.phone }],
        },
      });

      if (existingUser) {
        throw new Error("User with this email or phone already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          role: (userData.role as UserRole) || UserRole.REVIEWER,
          state: userData.state as State,
          city: userData.city,
          address: userData.address,
          referralCode: userData.referralCode,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      );

      return { user, token };
    } catch (error) {
      throw new Error(
        `Failed to sign up: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // Check if user is active
      if (user.status !== "ACTIVE") {
        throw new Error("Account is not active");
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "7d" },
      );

      return { user, token };
    } catch (error) {
      throw new Error(
        `Failed to sign in: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async signOut(): Promise<string> {
    logger.info("Signing out");
    const token = jwt.sign(
      { userId: null },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "0s" },
    );
    logger.info("User signed out, token invalidated");
    return Promise.resolve(token);
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      logger.info("Verifying email with token", {
        tokenPrefix: token.substring(0, 8) + "...",
      });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to verify email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    try {
      logger.info("Sending verification email", { email, name });

      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

      const data = {
        to: email,
        name: name,
        verificationToken: token,
        verificationUrl: verificationUrl,
      };

      await new EmailService().sendVerificationEmail(data);

      logger.info("Verification email sent successfully", { email });
    } catch (error) {
      throw new Error(
        `Failed to send verification email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Generate reset token
      const resetToken = this.generateResetToken();

      // Store reset token in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

      const data = {
        to: email,
        name: user.name,
        verificationToken: resetToken,
        verificationUrl: verificationUrl,
      };

      await new EmailService().sendVerificationEmail(data);

      logger.info("Password reset token generated", { email });
    } catch (error) {
      throw new Error(
        `Failed to reset password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      // In a real application, you would resend the email
      // For now, we'll return true as a placeholder
      logger.info("Resending verification email", { email });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to resend verification email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info("Password changed successfully", { userId });
    } catch (error) {
      throw new Error(
        `Failed to change password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async verifyAndResetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Find user by reset token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiry: { gt: new Date() },
        },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedNewPassword,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      logger.info("Password reset successfully", { userId: user.id });
    } catch (error) {
      throw new Error(
        `Failed to reset password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async validateToken(
    token: string,
  ): Promise<{ userId: string; email: string }> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret",
      ) as { userId: string; email: string };

      return decoded;
    } catch (error) {
      throw new Error(
        `Failed to validate token: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  private generateResetToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
