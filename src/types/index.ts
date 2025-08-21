// Core user types
export interface BaseUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  state?: State;
  city?: string;
  address?: string;
  emailVerified?: Date;
  phoneVerified?: Date;
  isVerified: boolean;
  referralCode: string;
  referredBy?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reviewer extends BaseUser {
  totalReviews: number;
  totalEarnings: number;
  referralEarnings: number;
}

export interface BusinessOwner extends BaseUser {
  business?: Business;
}

export interface Agent extends BaseUser {
  agentProfile?: AgentProfile;
}

export interface Admin extends BaseUser {
  permissions: AdminPermission[];
}

export interface SuperAdmin extends BaseUser {
  canManageAdmins: true;
}

// Enums
export enum UserRole {
  REVIEWER = "REVIEWER",
  BUSINESS_OWNER = "BUSINESS_OWNER",
  AGENT = "AGENT",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum AccountStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  BANNED = "BANNED",
  DELETED = "DELETED",
}

export enum BusinessVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum CouponType {
  PERCENTAGE = "PERCENTAGE",
  FIXED_AMOUNT = "FIXED_AMOUNT",
}

export enum CouponStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  EXPIRED = "EXPIRED",
}

export enum RewardType {
  CASH = "CASH",
  AIRTIME = "AIRTIME",
  COUPON = "COUPON",
  REFERRAL_BONUS = "REFERRAL_BONUS",
  BUSINESS_ONBOARDING = "BUSINESS_ONBOARDING",
}

export enum State {
  ABIA = "ABIA",
  ADAMAWA = "ADAMAWA",
  AKWA_IBOM = "AKWA_IBOM",
  ANAMBRA = "ANAMBRA",
  BAUCHI = "BAUCHI",
  BAYELSA = "BAYELSA",
  BENUE = "BENUE",
  BORNO = "BORNO",
  CROSS_RIVER = "CROSS_RIVER",
  DELTA = "DELTA",
  EBONYI = "EBONYI",
  EDO = "EDO",
  EKITI = "EKITI",
  ENUGU = "ENUGU",
  FCT = "FCT", // Federal Capital Territory (Abuja)
  GOMBE = "GOMBE",
  IMO = "IMO",
  JIGAWA = "JIGAWA",
  KADUNA = "KADUNA",
  KANO = "KANO",
  KATSINA = "KATSINA",
  KEBBI = "KEBBI",
  KOGI = "KOGI",
  KWARA = "KWARA",
  LAGOS = "LAGOS",
  NASARAWA = "NASARAWA",
  NIGER = "NIGER",
  OGUN = "OGUN",
  ONDO = "ONDO",
  OSUN = "OSUN",
  OYO = "OYO",
  PLATEAU = "PLATEAU",
  RIVERS = "RIVERS",
  SOKOTO = "SOKOTO",
  TARABA = "TARABA",
  YOBE = "YOBE",
  ZAMFARA = "ZAMFARA",
}

export enum BusinessCategory {
  RESTAURANT = "RESTAURANT",
  RETAIL = "RETAIL",
  HEALTHCARE = "HEALTHCARE",
  EDUCATION = "EDUCATION",
  ENTERTAINMENT = "ENTERTAINMENT",
  TECHNOLOGY = "TECHNOLOGY",
  FINANCE = "FINANCE",
  REAL_ESTATE = "REAL_ESTATE",
  AUTOMOTIVE = "AUTOMOTIVE",
  BEAUTY = "BEAUTY",
  FITNESS = "FITNESS",
  TRAVEL = "TRAVEL",
  OTHER = "OTHER",
}

// Business types
export interface Business {
  id: string;
  name: string;
  description?: string;
  category: BusinessCategory;
  logo?: string;
  images: string[];
  phone: string;
  email: string;
  website?: string;
  state: State;
  city: string;
  address: string;
  coordinates?: Record<string, unknown>; // More specific than 'any'
  cacNumber?: string;
  utilityBill?: string;
  verificationStatus: BusinessVerificationStatus;
  verifiedAt?: Date;
  ownerId: string;
  owner: BusinessOwner;
  staffMembers: BusinessStaff[];
  rating: number;
  reviewCount: number;
  visitCount: number;
  createdAt: Date;
  updatedAt: Date;
  onboardedByAgentId?: string;
  onboardedByAgent?: AgentProfile;
  reviews: Review[];
  coupons: Coupon[];
  campaigns: Campaign[];
}

export interface BusinessStaff {
  id: string;
  businessId: string;
  business: Business;
  name: string;
  email: string;
  phone: string;
  role: string;
  canManageCoupons: boolean;
  canViewAnalytics: boolean;
  canManageReviews: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Review types
export interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  images: string[];
  video?: string;
  status: ReviewStatus;
  isAnonymous: boolean;
  userId: string;
  user: Reviewer;
  businessId: string;
  business: Business;
  reported: boolean;
  reportReason?: string;
  createdAt: Date;
  updatedAt: Date;
  reward?: Reward;
}

// Reward types
export interface Reward {
  id: string;
  type: RewardType;
  amount: number;
  description: string;
  userId: string;
  user: Reviewer;
  reviewId?: string;
  review?: Review;
  isRedeemed: boolean;
  redeemedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Coupon types
export interface Coupon {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  maxUses?: number;
  totalIssued: number;
  totalRedeemed: number;
  validFrom: Date;
  validUntil: Date;
  status: CouponStatus;
  businessId: string;
  business: Business;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  budget?: number;
  spentAmount: number;
  businessId: string;
  business: Business;
  createdAt: Date;
  updatedAt: Date;
}

// Agent types
export interface AgentProfile {
  id: string;
  userId: string;
  user: Agent;
  onboardedBusinesses: Business[];
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  totalEarnings: number;
  totalBusinessesOnboarded: number;
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Admin types
export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface AdminAction {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  adminId: string;
  adminName: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

// Form types
export interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  referralCode?: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface BusinessRegistrationFormData {
  name: string;
  description: string;
  category: BusinessCategory;
  phone: string;
  email: string;
  website?: string;
  state: State;
  city: string;
  address: string;
  cacNumber?: string;
  utilityBill?: string;
}

export interface ReviewFormData {
  rating: number;
  title?: string;
  content: string;
  images?: File[];
  video?: File;
  isAnonymous: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard types
export interface DashboardStats {
  totalReviews: number;
  totalEarnings: number;
  pendingRewards: number;
  referralCount: number;
  referralEarnings: number;
}

export interface BusinessDashboardStats {
  totalReviews: number;
  averageRating: number;
  totalVisits: number;
  activeCoupons: number;
  totalCampaigns: number;
}

export interface AgentDashboardStats {
  totalBusinessesOnboarded: number;
  totalEarnings: number;
  pendingApprovals: number;
  monthlyEarnings: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  createdAt: Date;
}

// Search and filter types
export interface BusinessSearchFilters {
  category?: BusinessCategory;
  state?: State;
  city?: string;
  rating?: number;
  verified?: boolean;
}

export interface ReviewSearchFilters {
  status?: ReviewStatus;
  rating?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

// Flexible Business type for services (compatible with Prisma)
export interface BusinessServiceData {
  id: string;
  name: string;
  description?: string;
  category: BusinessCategory;
  logo?: string;
  images: string[];
  phone: string;
  email: string;
  website?: string;
  state: State;
  city: string;
  address: string;
  coordinates?: Record<string, unknown>; // Compatible with Prisma's JsonValue
  cacNumber?: string;
  utilityBill?: string;
  verificationStatus: BusinessVerificationStatus;
  verifiedAt?: Date;
  ownerId: string;
  rating: number;
  reviewCount: number;
  visitCount: number;
  createdAt: Date;
  updatedAt: Date;
  onboardedByAgentId?: string;
  // Relations (optional for flexibility)
  owner?: Record<string, unknown>;
  staffMembers?: Record<string, unknown>[];
  reviews?: Record<string, unknown>[];
  coupons?: Record<string, unknown>[];
  campaigns?: Record<string, unknown>[];
  onboardedByAgent?: Record<string, unknown>;
}
