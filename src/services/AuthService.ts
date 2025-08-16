import { prisma } from "@/lib/prisma";
import { IAuthService } from "./interfaces";
import { User, UserRole } from "@/types";
import bcrypt from "bcryptjs";
import { generateReferralCode } from "@/lib/utils";

export class AuthService implements IAuthService {
  // Single Responsibility: This service only handles authentication-related operations

  async signUp(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    referralCode?: string;
    state?: string;
    city?: string;
    address?: string;
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

      // Generate unique referral code
      const newReferralCode = await generateReferralCode();

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          role: userData.role || UserRole.REVIEWER,
          status: "PENDING",
          referralCode: newReferralCode,
          referredBy: userData.referralCode,
          state: userData.state as any,
          city: userData.city,
          address: userData.address,
        },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      // Generate JWT token (in a real app, you'd use a proper JWT library)
      const token = this.generateToken(user.id);

      return {
        user: user as User,
        token,
      };
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
        include: {
          business: true,
          agentProfile: true,
        },
      });

      if (!user || !user.password) {
        throw new Error("Invalid credentials");
      }

      // Check if account is active
      if (user.status !== "ACTIVE") {
        throw new Error(
          "Account is not active. Please verify your email and phone.",
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      return {
        user: user as User,
        token,
      };
    } catch (error) {
      throw new Error(
        `Failed to sign in: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async signOut(): Promise<void> {
    // In a real app, you'd invalidate the JWT token
    // For now, we'll just return successfully
    return Promise.resolve();
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      // In a real app, you'd verify the email verification token
      // For now, we'll simulate email verification
      const user = await prisma.user.findFirst({
        where: {
          email: token, // Assuming token is the email for now
        },
      });

      if (!user) {
        throw new Error("Invalid verification token");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          isVerified: true,
        },
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

  async verifyPhone(phone: string, code: string): Promise<boolean> {
    try {
      // In a real app, you'd verify the SMS verification code
      // For now, we'll simulate phone verification
      const user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // For demo purposes, accept any 6-digit code
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        throw new Error("Invalid verification code");
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: new Date(),
          isVerified: true,
        },
      });

      return true;
    } catch (error) {
      throw new Error(
        `Failed to verify phone: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async sendVerificationEmail(email: string): Promise<void> {
    try {
      // In a real app, you'd send an actual email
      // For now, we'll just log it
      console.log(`Verification email sent to: ${email}`);

      // You could integrate with services like SendGrid, AWS SES, etc.
      // await emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      throw new Error(
        `Failed to send verification email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async sendVerificationSMS(phone: string): Promise<void> {
    try {
      // In a real app, you'd send an actual SMS
      // For now, we'll just log it
      console.log(`Verification SMS sent to: ${phone}`);

      // You could integrate with services like Twilio, AWS SNS, etc.
      // await smsService.sendVerificationSMS(phone, verificationCode);
    } catch (error) {
      throw new Error(
        `Failed to send verification SMS: ${
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

      // Store reset token in database (you'd need to add this field to your schema)
      // await prisma.user.update({
      //   where: { id: user.id },
      //   data: { resetToken, resetTokenExpiry: new Date(Date.now() + 3600000) }
      // });

      // Send reset email
      await this.sendVerificationEmail(email);

      console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      throw new Error(
        `Failed to reset password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.password) {
        throw new Error("User not found");
      }

      // Verify old password
      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        throw new Error("Old password is incorrect");
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });
    } catch (error) {
      throw new Error(
        `Failed to change password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      // In a real app, you'd verify the JWT token
      // For now, we'll simulate token validation
      const userId = this.extractUserIdFromToken(token);

      if (!userId) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as User;
    } catch (error) {
      return null;
    }
  }

  private generateToken(userId: string): string {
    // In a real app, you'd use a proper JWT library
    // For now, we'll create a simple token
    const payload = {
      userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    };

    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  private generateResetToken(): string {
    // Generate a random 32-character token
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private extractUserIdFromToken(token: string): string | null {
    try {
      // In a real app, you'd properly decode the JWT token
      // For now, we'll decode our simple base64 token
      const payload = JSON.parse(Buffer.from(token, "base64").toString());

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null; // Token expired
      }

      return payload.userId;
    } catch (error) {
      return null;
    }
  }
}
