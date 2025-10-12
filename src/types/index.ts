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
  // Agent-specific properties
  userId?: number | string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  totalBusinesses: number;
  totalEarnings: number;
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  onboardedBusinesses: Business[];
}

// Agent Profile interface for the database model
export interface AgentProfile {
  id: string;
  userId: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  totalBusinesses: number;
  totalEarnings: number;
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  user: BaseUser;
  onboardedBusinesses: Business[];
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
  FLAGGED = "FLAGGED",
  SUSPENDED = "SUSPENDED",
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
  USED = "USED",
  DELETED = "DELETED",
}

export enum CouponUseType {
  SINGLE_USE = "SINGLE_USE",
  MULTI_USE = "MULTI_USE",
  ONCE_PER_USER = "ONCE_PER_USER",
}

export enum CouponVisibility {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export enum RedemptionMethod {
  IN_PERSON = "IN_PERSON",
  ONLINE = "ONLINE",
  QR_CODE = "QR_CODE",
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
  ownerId: string;
  name: string;
  description?: string;
  category: BusinessCategory;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  servicesImages: string[];
  address: string;
  city: string;
  state: State;
  latitude?: number;
  longitude?: number;
  // Review status (for reviewability)
  reviewStatus: ReviewStatus;

  // Document verification status (legacy, will be migrated)
  verificationStatus: BusinessVerificationStatus;
  verificationNotes?: string;
  verifiedAt?: Date;
  verificationDocuments: string[];
  averageRating: number;
  totalReviews: number;
  totalVisits: number;
  isActive: boolean;
  onboardedByAgentId?: string;
  cacNumber?: string;
  utilityBill?: string;
  createdAt: Date;
  updatedAt: Date;
  owner: BaseUser;
  onboardedByAgent?: Agent;
  reviews: Review[];
  coupons: Coupon[];
  businessHours: BusinessHours[];
  businessSettings?: BusinessSettings;
  analytics: BusinessAnalytics[];
  views: BusinessView[];
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
  businessId: string;
  reviewerId: string;
  rating: number;
  content: string;
  images: string[];
  video?: string;
  status: ReviewStatus;
  isAnonymous: boolean;
  isVerified: boolean;
  helpfulCount: number;
  businessResponse?: string;
  businessResponseDate?: Date;
  reported: boolean;
  reportReason?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  business: Business;
  reviewer: BaseUser;
}

// Reward types
export interface Reward {
  id: string;
  referrerId: string;
  amount: number;
  type: string;
  description: string;
  reviewId?: string;
  isRedeemed: boolean;
  redeemedAt?: Date;
  createdAt: Date;
  referrer: BaseUser;
}

// Coupon types
export interface Coupon {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  baseCode: string; // Base 9-character code (K2X-PL7-YJ9)
  userSpecificCode?: string; // Full code with user ID (K2X-PL7-YJ9-70BR)
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  maxUses?: number;
  currentUses: number;
  totalIssued: number;
  totalRedeemed: number;
  validFrom: Date;
  validUntil: Date;
  status: CouponStatus;
  createdAt: Date;
  updatedAt: Date;

  // New fields for advanced restrictions
  useType: CouponUseType;
  allowedDaysOfWeek: number[]; // 0=Sunday, 1=Monday, etc.
  allowedTimeStart?: string; // Format: "HH:MM" (24-hour)
  allowedTimeEnd?: string; // Format: "HH:MM" (24-hour)
  cannotCombineWithOtherCoupons: boolean;
  requiresIdVerification: boolean;
  maxUsesPerUser?: number;

  // User assignment tracking
  assignedUserId?: string;
  assignedAt?: Date;

  // Visibility control
  visibility: CouponVisibility;

  // Relations
  business: Business;
  assignedUser?: User;
  redemptions: CouponRedemption[];
  claims: CouponClaim[];
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  redeemedAt: Date;
  orderAmount?: number;
  discountApplied: number;
  redemptionMethod: RedemptionMethod;
  staffNotes?: string;
  idVerified: boolean;
  verificationCode?: string;
  deletedAt?: Date;
  coupon: Coupon;
  user: User;
}

export interface CouponCreationData {
  businessId: string;
  title: string;
  description?: string;
  type: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  maxUses?: number;
  validFrom: Date;
  validUntil: Date;
  useType: CouponUseType;
  allowedDaysOfWeek?: number[];
  allowedTimeStart?: string;
  allowedTimeEnd?: string;
  cannotCombineWithOtherCoupons?: boolean;
  requiresIdVerification?: boolean;
  maxUsesPerUser?: number;
  visibility: CouponVisibility;
}

export interface CouponAssignmentData {
  couponId: string;
  userId: string;
}

export interface CouponClaim {
  id: string;
  couponId: string;
  userId: string;
  businessId: string;
  claimedAt: Date;
  requiresReview: boolean;
  reviewCompleted: boolean;
  reviewId?: string;

  // Relations
  coupon: Coupon;
  user: User;
  business: Business;
  review?: Review;
}

export interface CouponClaimData {
  couponId: string;
  userId: string;
  businessId: string;
  requiresReview: boolean;
}

export interface CouponVerificationData {
  code: string;
  orderAmount?: number;
  redemptionMethod: RedemptionMethod;
  staffNotes?: string;
  idVerified?: boolean;
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
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  adminName: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
  admin: BaseUser;
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

export interface BusinessView {
  id: string;
  businessId: string;
  viewerId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  source: string;
  viewType: string;
  sessionId?: string;
  duration?: number;
  createdAt: Date;
  business: Business;
  viewer?: BaseUser;
}

export interface BusinessHours {
  id: string;
  businessId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  business: Business;
}

export interface BusinessSettings {
  id: string;
  businessId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  reviewAlerts: boolean;
  couponRedemptions: boolean;
  weeklyReports: boolean;
  marketingUpdates: boolean;
  profileVisibility: string;
  showContactInfo: boolean;
  showRevenue: boolean;
  allowDirectMessages: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  googleAnalytics: boolean;
  facebookPixel: boolean;
  mailchimp: boolean;
  zapier: boolean;
  createdAt: Date;
  updatedAt: Date;
  business: Business;
}

export interface BusinessAnalytics {
  id: string;
  businessId: string;
  date: Date;
  visits: number;
  uniqueVisitors: number;
  pageViews: number;
  reviews: number;
  averageRating: number;
  couponViews: number;
  couponRedemptions: number;
  revenue: number;
  createdAt: Date;
  business: Business;
}

// User interface that matches the Prisma schema
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  status: AccountStatus;
  referralCode: string;
  referredBy?: string;
  state: State;
  city: string;
  address: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: string;
  emailVerified?: Date;
  phoneVerified?: Date;
  isVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  lastLoginAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  referredByUser?: User;
  referrals: User[];
  accounts: Account[];
  sessions: Session[];
  reviews: Review[];
  rewards: Reward[];
  rewardRedemptions: RewardRedemption[];
  business?: Business;
  agentProfile?: Agent;
  businessRecommendations: BusinessRecommendation[];
  agentApplications: AgentApplication[];
  adminInvitations: AdminInvitation[];
  adminActions: AdminAction[];
  reportedContent: ReportedContent[];
  resolvedReports: ReportedContent[];
  businessViews: BusinessView[];
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  user: User;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  user: User;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
}

export interface AgentApplication {
  id: string;
  userId: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  invitationToken: string;
  expiresAt: Date;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  createdAt: Date;
  invitedByUser: User;
}

export interface BusinessRecommendation {
  id: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  category: BusinessCategory;
  state: State;
  city: string;
  description?: string;
  recommendedBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  recommendedByUser: User;
}

export interface ReportedContent {
  id: string;
  contentType: "REVIEW" | "BUSINESS" | "USER";
  contentId: string;
  reporterId: string;
  reason:
    | "INAPPROPRIATE_CONTENT"
    | "SPAM"
    | "HARASSMENT"
    | "FALSE_INFORMATION"
    | "COPYRIGHT_VIOLATION"
    | "OTHER";
  description?: string;
  status: "PENDING" | "INVESTIGATED" | "RESOLVED" | "DISMISSED";
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  reporter: User;
  resolver?: User;
}

export interface RewardRedemption {
  id: string;
  userId: string;
  type: string;
  amount: number;
  phone?: string;
  status: string;
  processedAt?: Date;
  createdAt: Date;
  user: User;
}
