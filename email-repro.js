import nodemailer from "nodemailer";

async function testEmail() {
  console.log("Testing production config simulation...");

  // Simulate missing env vars in production
  const config = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  console.log("Config used:", config);

  const transporter = nodemailer.createTransport(config);

  try {
    await transporter.verify();
    console.log("Verification SUCCESS");
  } catch (err) {
    console.error("Verification FAILED:", err);
  }
}

testEmail();
