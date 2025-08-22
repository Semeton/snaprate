import { prisma } from "@/lib/prisma";
import { IAuthService } from "./interfaces";
import { UserRole, State, BaseUser, AccountStatus } from "@/types";
import bcrypt from "bcryptjs";
import { generateReferralCode } from "@/lib/utils";
import { EmailService } from "./EmailService";
import logger from "@/lib/logger";
import crypto from "crypto";

export class AuthService implements IAuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
    logger.info("AuthService initialized");
  }

  // Single Responsibility: This service only handles authentication-related operations

  async signUp(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: UserRole;
    referralCode?: string;
    state: State;
    city: string;
    address: string;
  }): Promise<{ user: BaseUser; token: string }> {
    try {
      logger.info("Starting user signup process", {
        email: userData.email,
        phone: userData.phone,
        role: userData.role || UserRole.REVIEWER,
        hasReferralCode: !!userData.referralCode,
        state: userData.state,
        city: userData.city,
        address: userData.address,
      });

      // Validate required fields
      if (!userData.state || !userData.city || !userData.address) {
        logger.error("User signup failed - missing required fields", {
          email: userData.email,
          hasState: !!userData.state,
          hasCity: !!userData.city,
          hasAddress: !!userData.address,
        });
        throw new Error("State, city, and address are required fields");
      }

      // Check if user already exists
      logger.debug("Checking for existing user", {
        email: userData.email,
        phone: userData.phone,
      });
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { phone: userData.phone }],
        },
      });

      if (existingUser) {
        logger.warn("User signup failed - user already exists", {
          email: userData.email,
          phone: userData.phone,
          existingUserId: existingUser.id,
        });
        throw new Error("User with this email or phone already exists");
      }

      logger.debug("No existing user found, proceeding with signup");

      // Hash password
      logger.debug("Hashing user password");
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Generate unique referral code
      logger.debug("Generating unique referral code");
      const newReferralCode = await generateReferralCode();

      // Find referring user if referral code is provided
      let referredByUserId: string | undefined;
      if (userData.referralCode) {
        logger.debug("Processing referral code", {
          referralCode: userData.referralCode,
        });
        const referringUser = await prisma.user.findUnique({
          where: { referralCode: userData.referralCode },
          select: { id: true },
        });
        if (referringUser) {
          referredByUserId = referringUser.id;
          logger.info("Referral code processed successfully", {
            referralCode: userData.referralCode,
            referringUserId: referringUser.id,
          });
        } else {
          logger.warn("Invalid referral code provided", {
            referralCode: userData.referralCode,
          });
        }
        // If referral code is invalid, we'll just ignore it instead of throwing an error
      }

      // Generate verification token
      logger.debug("Generating verification token");
      const emailVerificationToken = crypto.randomBytes(32).toString("hex");

      // Set expiry time (24 hours for email)
      const emailVerificationExpiry = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );

      // Create user
      logger.debug("Creating user in database");
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          role: userData.role || UserRole.REVIEWER,
          status: AccountStatus.PENDING,
          referralCode: newReferralCode,
          referredBy: referredByUserId || undefined, // Only set if we found a valid referring user
          state: userData.state,
          city: userData.city,
          address: userData.address,
          emailVerificationToken,
          emailVerificationExpiry,
        },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      logger.info("User created successfully", {
        userId: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: newReferralCode,
      });

      // Generate JWT token (in a real app, you'd use a proper JWT library)
      const token = this.generateToken(user.id);

      // Create referral reward if user was referred
      if (referredByUserId) {
        try {
          await prisma.reward.create({
            data: {
              referrerId: referredByUserId,
              amount: 20,
              type: "REFERRAL",
              description: `Referral reward for ${userData.email}`,
              isRedeemed: false,
            },
          });
          logger.info("Referral reward created successfully", {
            referrerId: referredByUserId,
            referredUserId: user.id,
            amount: 20,
          });
        } catch (error) {
          logger.error("Failed to create referral reward", {
            referrerId: referredByUserId,
            referredUserId: user.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Send verification email
      logger.debug("Sending verification email");
      await this.sendVerificationEmail(
        userData.email,
        userData.name,
        emailVerificationToken,
      );

      logger.info("User signup completed successfully", {
        userId: user.id,
        email: userData.email,
        phone: userData.phone,
      });

      return {
        user: user as BaseUser,
        token,
      };
    } catch (error) {
      logger.error("User signup failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: userData.email,
        phone: userData.phone,
        stack: error instanceof Error ? error.stack : undefined,
      });
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
  }): Promise<{ user: BaseUser; token: string }> {
    try {
      logger.info("User signin attempt", { email: credentials.email });

      // Find user by email
      logger.debug("Looking up user by email", { email: credentials.email });
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      if (!user || !user.password) {
        logger.warn("Signin failed - user not found or no password", {
          email: credentials.email,
          userExists: !!user,
          hasPassword: !!user?.password,
        });
        throw new Error("Invalid credentials");
      }

      logger.debug("User found, checking account status", {
        userId: user.id,
        status: user.status,
        isVerified: user.isVerified,
      });

      // Check if email is verified first
      if (!user.emailVerified) {
        logger.warn("Signin failed - email not verified", {
          email: credentials.email,
          userId: user.id,
        });
        throw new Error(
          "Email not verified. Please check your email for verification link or resend verification email.",
        );
      }

      // Check if account is active (only after email verification)
      if (user.status !== AccountStatus.ACTIVE) {
        logger.warn("Signin failed - account not active", {
          email: credentials.email,
          userId: user.id,
          status: user.status,
        });
        throw new Error(
          "Account is not active. Please contact support for assistance.",
        );
      }

      // Verify password
      logger.debug("Verifying user password", { userId: user.id });
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        user.password,
      );
      if (!isPasswordValid) {
        logger.warn("Signin failed - invalid password", {
          email: credentials.email,
          userId: user.id,
        });
        throw new Error("Invalid credentials");
      }

      logger.debug("Password verified successfully", { userId: user.id });

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info("User signin successful", {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      });

      return {
        user: user as BaseUser,
        token,
      };
    } catch (error) {
      logger.error("User signin failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        email: credentials.email,
        stack: error instanceof Error ? error.stack : undefined,
      });
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
      logger.info("Verifying email with token", {
        tokenPrefix: token.substring(0, 8) + "...",
      });

      // Find user by verification token
      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpiry: {
            gt: new Date(), // Token hasn't expired
          },
        },
      });

      if (!user) {
        logger.warn("Email verification failed - invalid or expired token", {
          tokenPrefix: token.substring(0, 8) + "...",
        });
        throw new Error("Invalid or expired verification token");
      }

      // Update user verification status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationToken: null, // Clear the token
          emailVerificationExpiry: null, // Clear the expiry
          isVerified: true, // Set verified since we only have email verification now
          status: AccountStatus.ACTIVE, // Activate the account after email verification
        },
      });

      logger.info("Email verified successfully", {
        userId: user.id,
        email: user.email,
      });

      return true;
    } catch (error) {
      logger.error("Email verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        tokenPrefix: token.substring(0, 8) + "...",
        stack: error instanceof Error ? error.stack : undefined,
      });
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
      // In a real app, you'd send an actual email
      // For now, we'll just log it
      logger.info("Sending verification email", { email, name });

      // Create verification URL
      const verificationUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/auth/verify?token=${token}`;

      await this.emailService.sendVerificationEmail({
        to: email,
        name,
        verificationToken: token,
        verificationUrl,
      });

      logger.info("Verification email sent successfully", { email });
    } catch (error) {
      logger.error("Failed to send verification email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Failed to send verification email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      logger.info("Password reset requested", { email });

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        logger.warn("Password reset failed - user not found", { email });
        throw new Error("User not found");
      }

      // Generate reset token
      const resetToken = this.generateResetToken();

      // Set expiry time (1 hour from now)
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      logger.debug("Generated password reset token", {
        email,
        tokenPrefix: resetToken.substring(0, 8) + "...",
        expiry: resetTokenExpiry,
      });

      // Store reset token in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: resetTokenExpiry,
        },
      });

      logger.info("Password reset token stored in database", { email });

      // Send reset email
      await this.emailService.sendPasswordResetEmail(
        email,
        user.name || "User",
        resetToken,
      );

      logger.info("Password reset email sent successfully", { email });
    } catch (error) {
      logger.error("Password reset failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
        stack: error instanceof Error ? error.stack : undefined,
      });
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

  async verifyAndResetPassword(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      logger.info("Password reset verification requested", {
        tokenPrefix: token.substring(0, 8) + "...",
      });

      // Find user with valid reset token
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiry: {
            gt: new Date(), // Token not expired
          },
        },
      });

      if (!user) {
        logger.warn(
          "Password reset verification failed - invalid or expired token",
          {
            tokenPrefix: token.substring(0, 8) + "...",
          },
        );
        throw new Error("Invalid or expired reset token");
      }

      logger.debug("Valid reset token found", {
        userId: user.id,
        email: user.email,
      });

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

      logger.info("Password reset completed successfully", {
        userId: user.id,
        email: user.email,
      });

      return true;
    } catch (error) {
      logger.error("Password reset verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        tokenPrefix: token.substring(0, 8) + "...",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Failed to verify and reset password: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async validateToken(token: string): Promise<BaseUser | null> {
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

      return user as BaseUser;
    } catch (error) {
      return null;
    }
  }

  /**
   * Resend verification email with new token
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    try {
      logger.info("Resending verification email", { email });

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, emailVerified: true },
      });

      if (!user) {
        logger.warn("Resend verification failed - user not found", { email });
        throw new Error("User not found");
      }

      if (user.emailVerified) {
        logger.warn("Resend verification failed - email already verified", {
          email,
        });
        throw new Error("Email is already verified");
      }

      // Generate new verification token
      const newEmailVerificationToken = crypto.randomBytes(32).toString("hex");
      const newEmailVerificationExpiry = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );

      // Update user with new token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: newEmailVerificationToken,
          emailVerificationExpiry: newEmailVerificationExpiry,
        },
      });

      logger.debug("New verification token generated", {
        userId: user.id,
        tokenPrefix: newEmailVerificationToken.substring(0, 8) + "...",
      });

      // Send new verification email
      await this.sendVerificationEmail(
        user.email,
        user.name,
        newEmailVerificationToken,
      );

      logger.info("Verification email resent successfully", { email });
      return true;
    } catch (error) {
      logger.error("Failed to resend verification email", {
        error: error instanceof Error ? error.message : "Unknown error",
        email,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Failed to resend verification email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
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
    // Generate a cryptographically secure random 32-character token
    return crypto.randomBytes(32).toString("hex");
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
