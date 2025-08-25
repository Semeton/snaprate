-- Create business_invitations table
CREATE TABLE IF NOT EXISTS "business_invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "invitationToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_invitations_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "business_invitations_email_key" ON "business_invitations"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "business_invitations_invitationToken_key" ON "business_invitations"("invitationToken");

-- Add foreign key constraint
ALTER TABLE "business_invitations" ADD CONSTRAINT "business_invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
