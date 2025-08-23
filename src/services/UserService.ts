import { prisma } from "@/lib/prisma";
import { User, UserRole, AccountStatus, State } from "@prisma/client";

export interface UserCreateData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  referralCode?: string;
  referredBy?: string;
  state: State;
  city: string;
  address: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  state?: State;
  city?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
}

export interface UserFilterData {
  role?: UserRole;
  status?: AccountStatus;
  state?: State;
  city?: string;
  isVerified?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export class UserService {
  async createUser(data: UserCreateData): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          ...data,
          role: data.role || UserRole.REVIEWER,
          status: AccountStatus.ACTIVE,
        },
      });

      return user;
    } catch (error) {
      throw new Error(
        `Failed to create user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          business: true,
          agentProfile: true,
          reviews: true,
          rewards: true,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get user by email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    try {
      return await prisma.user.findFirst({
        where: { phone },
        include: {
          business: true,
          agentProfile: true,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to get user by phone: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async updateUser(id: string, data: UserUpdateData): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data,
        include: {
          profile: true,
        },
      });
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

  async getUsers(
    options: {
      page: number;
      limit: number;
      filter?: UserFilterData;
      search?: string;
      sortBy?: "name" | "email" | "createdAt" | "lastLoginAt";
      sortOrder?: "asc" | "desc";
    } = { page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
  ): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page, limit, filter, search, sortBy, sortOrder } = options;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};

      if (filter?.role) where.role = filter.role;
      if (filter?.status) where.status = filter.status;
      if (filter?.state) where.state = filter.state;
      if (filter?.city) where.city = filter.city;
      if (filter?.isVerified !== undefined)
        where.isVerified = filter.isVerified;
      if (filter?.dateFrom && filter?.dateTo) {
        where.createdAt = { gte: filter.dateFrom, lte: filter.dateTo };
      } else if (filter?.dateFrom) {
        where.createdAt = { gte: filter.dateFrom };
      } else if (filter?.dateTo) {
        where.createdAt = { lte: filter.dateTo };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            profile: true,
          },
          orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get users: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async suspendUser(id: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { status: UserStatus.SUSPENDED },
      });
    } catch (error) {
      throw new Error(
        `Failed to suspend user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async banUser(id: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { status: UserStatus.BANNED },
      });
    } catch (error) {
      throw new Error(
        `Failed to ban user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async activateUser(id: string): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: { status: UserStatus.ACTIVE },
      });
    } catch (error) {
      throw new Error(
        `Failed to activate user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    bannedUsers: number;
    verifiedUsers: number;
    newUsersThisMonth: number;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalUsers,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        verifiedUsers,
        newUsersThisMonth,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
        prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
        prisma.user.count({ where: { status: UserStatus.BANNED } }),
        prisma.user.count({ where: { isVerified: true } }),
        prisma.user.count({
          where: { createdAt: { gte: startOfMonth } },
        }),
      ]);

      return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        verifiedUsers,
        newUsersThisMonth,
      };
    } catch (error) {
      throw new Error(
        `Failed to get user stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
