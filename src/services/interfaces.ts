// Service interfaces following SOLID principles
// Interface Segregation Principle: Clients should not be forced to depend on interfaces they don't use

import {
  User,
  BusinessServiceData,
  Review,
  Reward,
  Coupon,
  AgentProfile,
  AdminAction,
  Notification,
  ApiResponse,
  PaginatedResponse,
  BusinessSearchFilters,
  ReviewSearchFilters,
  DashboardStats,
  BusinessDashboardStats,
  AgentDashboardStats,
} from "@/types";

// Base service interface for common CRUD operations
export interface IBaseService<T> {
  create(data: any): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// User service interface
export interface IUserService {
  createUser(userData: any): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  verifyEmail(userId: string): Promise<User>;
  verifyPhone(userId: string): Promise<User>;
  updateProfile(id: string, data: Partial<User>): Promise<User>;
  getReferrals(userId: string): Promise<User[]>;
  getReferralStats(
    userId: string,
  ): Promise<{ count: number; earnings: number }>;
}

// Business service interface
export interface IBusinessService {
  createBusiness(
    businessData: any,
    ownerId: string,
  ): Promise<BusinessServiceData>;
  findById(id: string): Promise<BusinessServiceData | null>;
  findByOwner(ownerId: string): Promise<BusinessServiceData | null>;
  updateBusiness(
    id: string,
    data: Partial<BusinessServiceData>,
  ): Promise<BusinessServiceData>;
  deleteBusiness(id: string): Promise<void>;
  verifyBusiness(id: string, adminId: string): Promise<BusinessServiceData>;
  rejectBusiness(
    id: string,
    adminId: string,
    reason: string,
  ): Promise<BusinessServiceData>;
  searchBusinesses(
    filters: BusinessSearchFilters,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<BusinessServiceData>>;
  getBusinessStats(businessId: string): Promise<BusinessDashboardStats>;
  addStaffMember(businessId: string, staffData: any): Promise<any>;
  removeStaffMember(businessId: string, staffId: string): Promise<void>;
}

// Review service interface
export interface IReviewService {
  createReview(
    reviewData: any,
    userId: string,
    businessId: string,
  ): Promise<Review>;
  findById(id: string): Promise<Review | null>;
  findByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Review>>;
  findByBusiness(
    businessId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Review>>;
  updateReview(id: string, data: Partial<Review>): Promise<Review>;
  deleteReview(id: string): Promise<void>;
  approveReview(id: string, adminId: string): Promise<Review>;
  rejectReview(id: string, adminId: string, reason: string): Promise<Review>;
  reportReview(id: string, reason: string): Promise<Review>;
  searchReviews(
    filters: ReviewSearchFilters,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Review>>;
  getReviewStats(businessId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: any;
  }>;
}

// Reward service interface
export interface IRewardService {
  createReward(rewardData: any): Promise<Reward>;
  findById(id: string): Promise<Reward | null>;
  findByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Reward>>;
  updateReward(id: string, data: Partial<Reward>): Promise<Reward>;
  deleteReward(id: string): Promise<void>;
  redeemReward(id: string, type: "AIRTIME" | "COUPON"): Promise<Reward>;
  calculateReviewReward(reviewId: string): Promise<number>;
  processReferralBonus(referrerId: string, referredId: string): Promise<Reward>;
  processBusinessOnboardingBonus(
    agentId: string,
    businessId: string,
  ): Promise<Reward>;
  getUserRewardStats(userId: string): Promise<DashboardStats>;
}

// Coupon service interface
export interface ICouponService {
  createCoupon(couponData: any, businessId: string): Promise<Coupon>;
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findByBusiness(
    businessId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Coupon>>;
  updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon>;
  deleteCoupon(id: string): Promise<void>;
  validateCoupon(code: string, businessId: string): Promise<boolean>;
  useCoupon(code: string, userId: string): Promise<Coupon>;
  generateCouponCode(): Promise<string>;
  getCouponStats(
    businessId: string,
  ): Promise<{ active: number; used: number; expired: number; total: number }>;
}

// Agent service interface
export interface IAgentService {
  createAgentProfile(userId: string, agentData: any): Promise<AgentProfile>;
  findById(id: string): Promise<AgentProfile | null>;
  findByUser(userId: string): Promise<AgentProfile | null>;
  updateAgentProfile(
    id: string,
    data: Partial<AgentProfile>,
  ): Promise<AgentProfile>;
  deleteAgentProfile(id: string): Promise<void>;
  approveAgent(id: string, adminId: string): Promise<AgentProfile>;
  rejectAgent(
    id: string,
    adminId: string,
    reason: string,
  ): Promise<AgentProfile>;
  onboardBusiness(agentId: string, businessData: any): Promise<Business>;
  getAgentStats(agentId: string): Promise<AgentDashboardStats>;
  getOnboardedBusinesses(
    agentId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Business>>;
  updateBankDetails(agentId: string, bankData: any): Promise<AgentProfile>;
}

// Admin service interface
export interface IAdminService {
  getDashboardStats(): Promise<{
    totalUsers: number;
    totalBusinesses: number;
    totalReviews: number;
    totalRewards: number;
    pendingApprovals: number;
  }>;
  getUsers(
    page?: number,
    limit?: number,
    filters?: any,
  ): Promise<PaginatedResponse<User>>;
  getBusinesses(
    page?: number,
    limit?: number,
    filters?: any,
  ): Promise<PaginatedResponse<Business>>;
  getAgents(
    page?: number,
    limit?: number,
    filters?: any,
  ): Promise<PaginatedResponse<AgentProfile>>;
  getReviews(
    page?: number,
    limit?: number,
    filters?: any,
  ): Promise<PaginatedResponse<Review>>;
  suspendUser(userId: string, reason: string, adminId: string): Promise<User>;
  banUser(userId: string, reason: string, adminId: string): Promise<User>;
  logAdminAction(
    action: string,
    targetType: string,
    targetId: string,
    adminId: string,
    adminName: string,
    details?: any,
  ): Promise<AdminAction>;
  getAdminActions(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<AdminAction>>;
}

// Notification service interface
export interface INotificationService {
  createNotification(
    userId: string,
    title: string,
    message: string,
    type: "INFO" | "SUCCESS" | "WARNING" | "ERROR",
  ): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUser(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Notification>>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}

// Authentication service interface
export interface IAuthService {
  signUp(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
    referralCode?: string;
    state: string;
    city: string;
    address: string;
  }): Promise<{ user: any; token: string }>;
  signIn(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: any; token: string }>;
  signOut(): Promise<void>;
  verifyEmail(token: string): Promise<boolean>;
  sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
  resendVerificationEmail(email: string): Promise<boolean>;
  resetPassword(email: string): Promise<void>;
  verifyAndResetPassword(token: string, newPassword: string): Promise<boolean>;
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void>;
}

// File upload service interface
export interface IFileUploadService {
  uploadImage(file: File, folder?: string): Promise<string>;
  uploadVideo(file: File, folder?: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
  validateFile(
    file: File,
    maxSize?: number,
    allowedTypes?: string[],
  ): Promise<boolean>;
}

// Payment service interface
export interface IPaymentService {
  processAirtimePurchase(
    userId: string,
    amount: number,
    phoneNumber: string,
  ): Promise<{ success: boolean; transactionId?: string; error?: string }>;
  processCouponRedemption(
    userId: string,
    couponId: string,
  ): Promise<{ success: boolean; error?: string }>;
  processAgentPayout(
    agentId: string,
    amount: number,
  ): Promise<{ success: boolean; transactionId?: string; error?: string }>;
  getTransactionHistory(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<any>>;
}
