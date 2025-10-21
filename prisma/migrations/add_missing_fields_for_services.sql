-- Add missing fields for services

-- Add fields to businesses table
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "onboardedByAgentId" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "cacNumber" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "utilityBill" TEXT;

-- Add fields to reviews table
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN DEFAULT false;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reported" BOOLEAN DEFAULT false;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reportReason" TEXT;

-- Add fields to admin_actions table
ALTER TABLE "admin_actions" ADD COLUMN IF NOT EXISTS "adminName" TEXT;
ALTER TABLE "admin_actions" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;

-- Add fields to rewards table
ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "reviewId" TEXT;

-- Add foreign key constraints
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_onboardedByAgentId_fkey" 
    FOREIGN KEY ("onboardedByAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "businesses_onboardedByAgentId_idx" ON "businesses"("onboardedByAgentId");
CREATE INDEX IF NOT EXISTS "reviews_reported_idx" ON "reviews"("reported");
CREATE INDEX IF NOT EXISTS "rewards_reviewId_idx" ON "rewards"("reviewId");
