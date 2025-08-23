-- Create BusinessView table
CREATE TABLE IF NOT EXISTS "business_views" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "viewerId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "source" TEXT NOT NULL DEFAULT 'DIRECT',
    "viewType" TEXT NOT NULL DEFAULT 'PROFILE',
    "sessionId" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "business_views_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "business_views_businessId_createdAt_idx" ON "business_views"("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "business_views_viewerId_createdAt_idx" ON "business_views"("viewerId", "createdAt");
CREATE INDEX IF NOT EXISTS "business_views_source_createdAt_idx" ON "business_views"("source", "createdAt");

-- Add foreign key constraints
ALTER TABLE "business_views" ADD CONSTRAINT "business_views_businessId_fkey" 
    FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "business_views" ADD CONSTRAINT "business_views_viewerId_fkey" 
    FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update existing businesses to have totalVisits if not already set
UPDATE "businesses" SET "totalVisits" = 0 WHERE "totalVisits" IS NULL;
