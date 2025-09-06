import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingSuperAdmin) {
    console.log("✅ Super admin already exists, skipping...");
    return;
  }

  // Create default super admin
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@snaprate.com",
      password: hashedPassword,
      name: "Platform Administrator",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isVerified: true,
      referralCode: "ADMIN001",
      userIdentifier: "ADMIN",
      state: "LAGOS",
      city: "Lagos",
      address: "Platform Headquarters",
      phone: "+2348000000000",
      emailVerified: new Date(),
      phoneVerified: new Date(),
    },
  });

  console.log("✅ Super admin created:", superAdmin.email);

  // Create default platform settings
  const existingSettings = await prisma.platformSettings.findFirst({
    where: { id: "main" },
  });

  if (!existingSettings) {
    await prisma.platformSettings.create({
      data: {
        id: "main",
        minimumRedemptionAmount: 5000,
        reviewRewardAmount: 50,
        referralRewardAmount: 20,
        businessRecommendationRewardAmount: 100,
        minimumBusinessesForAgent: 5,
      },
    });

    console.log("✅ Platform settings created");
  } else {
    console.log("✅ Platform settings already exist");
  }

  console.log("🎉 Database seeding completed!");
  console.log("📧 Super Admin Email: admin@snaprate.com");
  console.log("🔑 Super Admin Password: admin123");
  console.log("⚠️  Please change this password after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
