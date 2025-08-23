// Service interfaces following SOLID principles
// Interface Segregation Principle: Clients should not be forced to depend on interfaces they don't use

// Base user interface
export interface BaseUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// User profile interface
export interface UserProfile extends BaseUser {
  avatar?: string;
  bio?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  referralCode?: string;
  referredBy?: string;
  lastLoginAt?: Date;
}

// Business interface
export interface BusinessData {
  id: string;
  name: string;
  description?: string;
  category: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Review interface
export interface ReviewData {
  id: string;
  content: string;
  rating: number;
  businessId: string;
  reviewerId: string;
  status: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Reward interface
export interface RewardData {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Coupon interface
export interface CouponData {
  id: string;
  code: string;
  businessId: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  currentUses: number;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Auth service interfaces
export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: BaseUser;
  token: string;
}

export interface EmailVerificationData {
  email: string;
  token: string;
}

export interface PasswordResetData {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

// Business service interfaces
export interface BusinessCreateData {
  name: string;
  description?: string;
  category: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city: string;
  state: string;
  ownerId: string;
}

export interface BusinessUpdateData {
  name?: string;
  description?: string;
  category?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
}

// Review service interfaces
export interface ReviewCreateData {
  content: string;
  rating: number;
  businessId: string;
  reviewerId: string;
  isAnonymous?: boolean;
}

export interface ReviewUpdateData {
  content?: string;
  rating?: number;
  isAnonymous?: boolean;
}

export interface ReviewFilterData {
  businessId?: string;
  reviewerId?: string;
  status?: string;
  rating?: number;
  page?: number;
  limit?: number;
}

// Reward service interfaces
export interface RewardCreateData {
  userId: string;
  amount: number;
  type: string;
  description?: string;
}

export interface RewardFilterData {
  userId?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Coupon service interfaces
export interface CouponCreateData {
  code: string;
  businessId: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  expiresAt: Date;
}

export interface CouponUpdateData {
  code?: string;
  discountType?: string;
  discountValue?: number;
  maxUses?: number;
  status?: string;
  expiresAt?: Date;
}

export interface CouponFilterData {
  businessId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// Admin service interfaces
export interface AdminActionData {
  action: string;
  targetType: string;
  targetId: string;
  adminId: string;
  adminName: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface UserFilterData {
  role?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface BusinessFilterData {
  category?: string;
  state?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ReviewFilterDataAdmin {
  businessId?: string;
  reviewerId?: string;
  status?: string;
  rating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

// Email service interfaces
export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

export interface EmailTemplateData {
  name: string;
  email: string;
  verificationUrl?: string;
  resetUrl?: string;
  businessName?: string;
  amount?: number;
  [key: string]: unknown;
}

// SMS service interfaces
export interface SMSData {
  to: string;
  message: string;
  template?: string;
  data?: Record<string, unknown>;
}

// File upload interfaces
export interface FileUploadData {
  file: File;
  type: "image" | "video";
  businessId?: string;
  userId?: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// Pagination interfaces
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationData;
}

// Search interfaces
export interface SearchData {
  query: string;
  type?: string;
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  results: T[];
  total: number;
  query: string;
  pagination: PaginationData;
}
