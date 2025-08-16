import { prisma } from '@/lib/prisma';
import { IUserService } from './interfaces';
import { User, UserRole, AccountStatus } from '@/types';
import bcrypt from 'bcryptjs';
import { generateReferralCode } from '@/lib/utils';

export class UserService implements IUserService {
  // Single Responsibility: This service only handles user-related operations
  
  async createUser(userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role?: UserRole;
    referredBy?: string;
    state?: string;
    city?: string;
    address?: string;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { phone: userData.phone }
          ]
        }
      });

      if (existingUser) {
        throw new Error('User with this email or phone already exists');
      }

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 12);
      }

      // Generate unique referral code
      const referralCode = await generateReferralCode();

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          role: userData.role || UserRole.REVIEWER,
          status: AccountStatus.PENDING,
          state: userData.state as any,
          city: userData.city,
          address: userData.address,
          referralCode,
          referredBy: userData.referredBy,
        },
        include: {
          business: true,
          agentProfile: true,
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              reward: true,
            }
          },
          rewards: true,
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to find user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          business: true,
          agentProfile: true,
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { phone },
        include: {
          business: true,
          agentProfile: true,
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to find user by phone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      // Hash password if it's being updated
      if (data.password) {
        data.password = await bcrypt.hash(data.password, 12);
      }

      const user = await prisma.user.update({
        where: { id },
        data,
        include: {
          business: true,
          agentProfile: true,
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id }
      });
    } catch (error) {
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to verify email: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to verify phone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    try {
      // Remove sensitive fields that shouldn't be updated via profile update
      const { password, email, phone, role, status, ...profileData } = data;

      const user = await prisma.user.update({
        where: { id },
        data: profileData,
        include: {
          business: true,
          agentProfile: true,
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getReferrals(userId: string): Promise<User[]> {
    try {
      const referrals = await prisma.user.findMany({
        where: { referredBy: userId },
        include: {
          business: true,
          agentProfile: true,
        }
      });

      return referrals as User[];
    } catch (error) {
      throw new Error(`Failed to get referrals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getReferralStats(userId: string): Promise<{ count: number; earnings: number }> {
    try {
      const referrals = await prisma.user.count({
        where: { referredBy: userId }
      });

      const referralEarnings = await prisma.reward.aggregate({
        where: {
          userId,
          type: 'REFERRAL_BONUS'
        },
        _sum: {
          amount: true
        }
      });

      return {
        count: referrals,
        earnings: referralEarnings._sum.amount || 0
      };
    } catch (error) {
      throw new Error(`Failed to get referral stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to activate account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async suspendAccount(userId: string, reason?: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: AccountStatus.SUSPENDED,
        },
        include: {
          business: true,
          agentProfile: true,
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to suspend account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async banAccount(userId: string, reason?: string): Promise<User> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: AccountStatus.BANNED,
        },
        include: {
          business: true,
          agentProfile: true,
        }
      });

      return user as User;
    } catch (error) {
      throw new Error(`Failed to ban account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
