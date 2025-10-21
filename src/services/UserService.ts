import { prisma } from "@/lib/prisma";
import { IUserService } from "./interfaces";
import { User, UserRole, AccountStatus, State } from "@/types";
import bcrypt from "bcryptjs";
import { generateReferralCode } from "@/lib/utils";
import { generateUserIdentifier } from "@/lib/utils";

export class UserService implements IUserService {
  // Single Responsibility: This service only handles user-related operations

  async createUser(userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: UserRole;
    referredBy?: string;
    state?: State;
    city?: string;
    address?: string;
  }): Promise<User> {
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

      // Hash password if provided
      let hashedPassword: string;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 12);
      } else {
        hashedPassword = "";
      }

      // Generate unique referral code
      const referralCode = await generateReferralCode();

      // Generate unique user identifier
      let userIdentifier: string;
      let isUnique = false;

      while (!isUnique) {
        userIdentifier = generateUserIdentifier();
        const existing = await prisma.user.findFirst({
          where: { userIdentifier },
        });
        if (!existing) {
          isUnique = true;
        }
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          role: userData.role || UserRole.REVIEWER,
          status: AccountStatus.PENDING,
          state: userData.state as State,
          city: userData.city as string,
          address: userData.address as string,
          userIdentifier: userIdentifier!,
          referralCode,
          referredBy: userData.referredBy as string,
        },
        include: {
          business: {
            include: {
              reviews: true,
            },
          },
          rewards: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to create user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          business: true,
          agentProfile: true,
          reviews: {
            include: {
              business: true,
            },
          },
          rewards: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to find user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to find user by email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: { phone },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to find user by phone: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      // Extract only the fields that can be updated, excluding relation fields
      const {
        business,
        agentProfile,
        reviews,
        rewards,
        referrals,
        accounts,
        sessions,
        rewardRedemptions,
        businessRecommendations,
        agentApplications,
        adminInvitations,
        adminActions,
        reportedContent,
        resolvedReports,
        businessViews,
        referredByUser,
        ...updatableFields
      } = data;

      // Hash password if it's being updated
      if (updatableFields.password) {
        updatableFields.password = await bcrypt.hash(
          updatableFields.password,
          12,
        );
      }

      const user = await prisma.user.update({
        where: { id },
        data: updatableFields,
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to update user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async verifyEmail(userId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          emailVerified: new Date(),
          isVerified: true,
        },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to verify email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async verifyPhone(userId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          phoneVerified: new Date(),
          isVerified: true,
        },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to verify phone: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    try {
      // Extract only the fields that can be updated, excluding relation fields
      const {
        business,
        agentProfile,
        reviews,
        rewards,
        referrals,
        accounts,
        sessions,
        rewardRedemptions,
        businessRecommendations,
        agentApplications,
        adminInvitations,
        adminActions,
        reportedContent,
        resolvedReports,
        businessViews,
        referredByUser,
        password,
        email,
        phone,
        role,
        status,
        referralCode,
        referredBy,
        emailVerificationToken,
        emailVerificationExpiry,
        passwordResetToken,
        passwordResetExpiry,
        lastLoginAt,
        deletedAt,
        createdAt,
        updatedAt,
        ...profileData
      } = data;

      const user = await prisma.user.update({
        where: { id },
        data: profileData,
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to update profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getReferrals(userId: string): Promise<User[]> {
    try {
      const referrals = await prisma.user.findMany({
        where: { referredBy: userId },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return referrals as unknown as User[];
    } catch (error) {
      throw new Error(
        `Failed to get referrals: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getReferralStats(
    userId: string,
  ): Promise<{ count: number; earnings: number }> {
    try {
      const referrals = await prisma.user.count({
        where: { referredBy: userId },
      });

      const referralEarnings = await prisma.reward.aggregate({
        where: {
          referrerId: userId,
          type: "REFERRAL_BONUS",
        },
        _sum: {
          amount: true,
        },
      });

      return {
        count: referrals,
        earnings: referralEarnings._sum?.amount || 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get referral stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async activateAccount(userId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: AccountStatus.ACTIVE,
        },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to activate account: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async suspendAccount(userId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: AccountStatus.SUSPENDED,
        },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to suspend account: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async banAccount(userId: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: AccountStatus.BANNED,
        },
        include: {
          business: true,
          agentProfile: true,
        },
      });

      return user as unknown as User;
    } catch (error) {
      throw new Error(
        `Failed to ban account: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
