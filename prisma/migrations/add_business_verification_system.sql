-- Add business verification system
-- This migration adds new fields for the dual status system while preserving existing data

-- Add new enum types
CREATE TYPE "AddressVerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'REJECTED');
CREATE TYPE "DirectorIdType" AS ENUM ('NATIONAL_ID', 'INTERNATIONAL_PASSPORT', 'DRIVERS_LICENSE', 'VOTER_CARD');
CREATE TYPE "CacDocumentType" AS ENUM ('CAC_CERTIFICATE_OF_INCORPORATION', 'CAC_STATUS_REPORT', 'CAC_BUSINESS_NAME_REGISTRATION');
CREATE TYPE "AddressEvidenceType" AS ENUM ('UTILITY_BILL', 'LEASE_AGREEMENT', 'SIGNAGE_PHOTO');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');

-- Update ReviewStatus enum to replace FLAGGED with SUSPENDED
ALTER TYPE "ReviewStatus" RENAME VALUE 'FLAGGED' TO 'SUSPENDED';

-- Add new fields to businesses table
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "reviewStatus" "ReviewStatus" DEFAULT 'PENDING';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "addressVerificationStatus" "AddressVerificationStatus" DEFAULT 'UNVERIFIED';

-- Create business_verifications table
CREATE TABLE IF NOT EXISTS "business_verifications" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "directorIdType" "DirectorIdType" NOT NULL,
    "directorIdNumber" TEXT NOT NULL,
    "directorIdImage" TEXT NOT NULL,
    "cacDocumentType" "CacDocumentType",
    "cacDocumentImage" TEXT,
    "firsTaxClearance" TEXT,
    "addressEvidenceType" "AddressEvidenceType",
    "addressEvidenceImage" TEXT,
    "verificationStatus" "VerificationStatus" DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_verifications_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on businessId
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_businessId_key" UNIQUE ("businessId");

-- Add foreign key constraint
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "business_verifications_businessId_idx" ON "business_verifications"("businessId");
CREATE INDEX IF NOT EXISTS "business_verifications_verificationStatus_idx" ON "business_verifications"("verificationStatus");

-- Update existing businesses to have appropriate default values
-- Set reviewStatus based on current verificationStatus
UPDATE "businesses" 
SET "reviewStatus" = CASE 
    WHEN "verificationStatus" = 'VERIFIED' THEN 'APPROVED'
    WHEN "verificationStatus" = 'REJECTED' THEN 'REJECTED'
    ELSE 'PENDING'
END;

-- Set addressVerificationStatus to UNVERIFIED for all existing businesses
UPDATE "businesses" SET "addressVerificationStatus" = 'UNVERIFIED' WHERE "addressVerificationStatus" IS NULL;
