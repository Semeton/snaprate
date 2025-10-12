-- Add CouponVisibility enum
CREATE TYPE "CouponVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- Add visibility column to coupons table
ALTER TABLE "coupons" ADD COLUMN "visibility" "CouponVisibility" NOT NULL DEFAULT 'PUBLIC';

-- Create coupon_claims table
CREATE TABLE "coupon_claims" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewCompleted" BOOLEAN NOT NULL DEFAULT false,
    "reviewId" TEXT,

    CONSTRAINT "coupon_claims_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for coupon_claims
CREATE UNIQUE INDEX "coupon_claims_couponId_userId_key" ON "coupon_claims"("couponId", "userId");

-- Add foreign key constraints for coupon_claims
ALTER TABLE "coupon_claims" ADD CONSTRAINT "coupon_claims_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coupon_claims" ADD CONSTRAINT "coupon_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coupon_claims" ADD CONSTRAINT "coupon_claims_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coupon_claims" ADD CONSTRAINT "coupon_claims_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
