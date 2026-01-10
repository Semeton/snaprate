-- Update coupon model to support multiple users per coupon
-- This migration adds support for one-to-many relationship between coupons and users

-- Add the assignments relation to the Coupon model
-- The CouponAssignment model already exists and supports multiple users per coupon

-- Update the coupon model to use assignments instead of single assignedUserId for public coupons
-- For private coupons, we'll still use assignedUserId for backward compatibility
-- For public coupons, we'll use the CouponAssignment table

-- No schema changes needed as the CouponAssignment model already supports this
-- The relation has been added to the Coupon model in the schema.prisma file
