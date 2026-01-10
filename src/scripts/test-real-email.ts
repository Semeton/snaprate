import "dotenv/config"; // Ensure env vars are loaded
import { EmailService } from "../services/EmailService";
import logger from "../lib/logger";

// Force logger to output to console for this script
// @ts-ignore
logger.error = (...args) => console.error(...args);
// @ts-ignore
logger.info = (...args) => console.log(...args);
// @ts-ignore
logger.warn = (...args) => console.warn(...args);

async function sendTestEmails() {
  console.log("\n📧 --- Real Email Send Test ---");

  // Ensure we are testing in production mode to trigger the strict validation logic
  // But preserve the original value if it was passed explicitly
  const originalNodeEnv = process.env.NODE_ENV;
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "ℹ️  Forcing NODE_ENV='production' for this test to verify strict configuration rules.\n",
    );
    (process.env as any).NODE_ENV = "production";
  }

  console.log("Configuration Check:");
  console.log(`  SMTP_HOST: ${process.env.SMTP_HOST || "❌ MISSING"}`);
  console.log(
    `  SMTP_USER: ${process.env.SMTP_USER ? "✅ SET" : "❌ MISSING"}`,
  );
  console.log(`  SMTP_PORT: ${process.env.SMTP_PORT || "587 (Default)"}`);
  console.log(`  SMTP_SECURE: ${process.env.SMTP_SECURE || "false (Default)"}`);

  if (process.env.SMTP_HOST === "localhost") {
    console.warn(
      "\n⚠️  WARNING: SMTP_HOST is set to 'localhost'. Emails will NOT reach external inboxes like Gmail/Yahoo.",
    );
    console.warn(
      "   They will likely be trapped by a local tool like Mailpit.",
    );
    console.warn(
      "   Update your .env file with real SMTP credentials to test actual delivery.\n",
    );
  }

  try {
    const emailService = new EmailService();
    const recipients = ["balogunsemeton@gmail.com", "balogunsemeton@yahoo.com"];

    console.log("🚀 Attempting to send emails...");

    for (const to of recipients) {
      process.stdout.write(`   Sending to ${to}... `);
      try {
        const success = await emailService.sendEmail({
          to,
          subject: "Test Email from SnapRate Production Fix",
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                <h1 style="color: #4facfe;">It Works! 🎉</h1>
                <p>This is a test email to verify the SnapRate production email configuration.</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>Configured Host:</strong> ${
                  process.env.SMTP_HOST
                }</p>
            </div>
          `,
          text: `It Works! timestamp: ${new Date().toISOString()}`,
        });

        if (success) {
          console.log("✅ SENT");
        } else {
          console.log("❌ FAILED (Service returned false)");
        }
      } catch (innerError: any) {
        console.log("❌ EXCEPTION");
        console.error(`      Error: ${innerError.message}`);
      }
    }
    console.log("\n✅ Test sequence completed.");
  } catch (error: any) {
    console.error("\n❌ FATAL ERROR: EmailService failed to initialize.");
    console.error(`   Reason: ${error.message}`);
    console.error(
      `   Make sure your .env file has SMTP_HOST, SMTP_USER, and SMTP_PASS set.`,
    );
  } finally {
    (process.env as any).NODE_ENV = originalNodeEnv;
  }
}

sendTestEmails();
