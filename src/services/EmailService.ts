import nodemailer from "nodemailer";
import logger from "@/lib/logger";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  to: string;
  name: string;
  verificationToken: string;
  verificationUrl: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    let config: { host: string; port: number; secure: boolean };

    if (process.env.NODE_ENV === "production") {
      // Production SMTP settings
      config = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false, // true for 465, false for other ports
      };

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Development - use local Mailpit
      config = {
        host: process.env.SMTP_HOST || "localhost",
        port: parseInt(process.env.SMTP_PORT || "1025"),
        secure: false,
      };

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        // No auth needed for local Mailpit
      });
    }

    logger.info("EmailService initialized", {
      environment: process.env.NODE_ENV,
      host: config.host,
      port: config.port,
      secure: config.secure,
    });
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      logger.info("Sending email", {
        to: options.to,
        subject: options.subject,
        environment: process.env.NODE_ENV,
      });

      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@snaprate.com",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        messageId: result.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error("Failed to send email", {
        error: error instanceof Error ? error.message : "Unknown error",
        to: options.to,
        subject: options.subject,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      logger.info("Sending verification email", {
        to: data.to,
        name: data.name,
        verificationUrl: data.verificationUrl,
      });

      const html = this.generateVerificationEmailHTML(data);
      const text = this.generateVerificationEmailText(data);

      return await this.sendEmail({
        to: data.to,
        subject: "Verify Your SnapRate Account",
        html,
        text,
      });
    } catch (error) {
      logger.error("Failed to send verification email", {
        error: error instanceof Error ? error.message : "Unknown error",
        to: data.to,
        name: data.name,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      logger.info("Sending welcome email", {
        to,
        name,
      });

      const html = this.generateWelcomeEmailHTML(name);
      const text = this.generateWelcomeEmailText(name);

      return await this.sendEmail({
        to,
        subject: "Welcome to SnapRate! 🎉",
        html,
        text,
      });
    } catch (error) {
      logger.error("Failed to send welcome email", {
        error: error instanceof Error ? error.message : "Unknown error",
        to,
        name,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetToken: string,
  ): Promise<boolean> {
    try {
      logger.info("Sending password reset email", {
        to,
        name,
        resetToken: resetToken.substring(0, 8) + "...", // Log partial token for security
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

      const html = this.generatePasswordResetEmailHTML(name, resetUrl);
      const text = this.generatePasswordResetEmailText(name, resetUrl);

      return await this.sendEmail({
        to,
        subject: "Reset Your SnapRate Password",
        html,
        text,
      });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        error: error instanceof Error ? error.message : "Unknown error",
        to,
        name,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * Send verification SMS (placeholder for now)
   * In production, you'd integrate with Twilio, AWS SNS, etc.
   */
  async sendVerificationSMS(phone: string, code: string): Promise<boolean> {
    try {
      logger.info("Sending verification SMS", {
        phone,
        code: code.substring(0, 3) + "...", // Log partial code for security
      });

      // TODO: Integrate with actual SMS service like Twilio
      // For now, just log the SMS
      logger.info("SMS would be sent in production", {
        phone,
        message: `Your SnapRate verification code is: ${code}. Valid for 10 minutes.`,
        service: "SMS Service (Twilio/AWS SNS)",
      });

      // Simulate SMS sending delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      logger.info("Verification SMS sent successfully", { phone });
      return true;
    } catch (error) {
      logger.error("Failed to send verification SMS", {
        error: error instanceof Error ? error.message : "Unknown error",
        phone,
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * Generate verification email HTML
   */
  private generateVerificationEmailHTML(data: VerificationEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your SnapRate Account</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌟 Welcome to SnapRate!</h1>
              <p>Your journey to earning rewards starts here</p>
            </div>
            <div class="content">
              <h2>Hi ${data.name},</h2>
              <p>Thank you for joining SnapRate! To complete your registration and start earning rewards, please verify your email address.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${data.verificationUrl}</p>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              
              <p>If you didn't create a SnapRate account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 SnapRate. All rights reserved.</p>
              <p>Connecting consumers with businesses through honest reviews and rewards.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate verification email text version
   */
  private generateVerificationEmailText(data: VerificationEmailData): string {
    return `
Welcome to SnapRate!

Hi ${data.name},

Thank you for joining SnapRate! To complete your registration and start earning rewards, please verify your email address.

Verify your email by clicking this link:
${data.verificationUrl}

This link will expire in 24 hours.

If you didn't create a SnapRate account, you can safely ignore this email.

Best regards,
The SnapRate Team

© 2024 SnapRate. All rights reserved.
    `;
  }

  /**
   * Generate welcome email HTML
   */
  private generateWelcomeEmailHTML(name: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SnapRate!</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SnapRate!</h1>
              <p>Your account is now verified and ready to go!</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Congratulations! Your SnapRate account has been successfully verified. You're now ready to start earning rewards by reviewing businesses!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
              </div>
              
              <h3>What you can do now:</h3>
              <ul>
                <li>📝 Write reviews and earn ₦50 per review</li>
                <li>👥 Refer friends and earn referral bonuses</li>
                <li>🏆 Level up and unlock higher rewards</li>
                <li>💰 Redeem your earnings for airtime, coupons, or bank transfer</li>
              </ul>
              
              <p>Happy reviewing!</p>
            </div>
            <div class="footer">
              <p>© 2024 SnapRate. All rights reserved.</p>
              <p>Connecting consumers with businesses through honest reviews and rewards.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate welcome email text version
   */
  private generateWelcomeEmailText(name: string): string {
    return `
Welcome to SnapRate!

Hi ${name},

Congratulations! Your SnapRate account has been successfully verified. You're now ready to start earning rewards by reviewing businesses!

What you can do now:
- Write reviews and earn ₦50 per review
- Refer friends and earn referral bonuses
- Level up and unlock higher rewards
- Redeem your earnings for airtime, coupons, or bank transfer

Go to your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Happy reviewing!

Best regards,
The SnapRate Team

© 2024 SnapRate. All rights reserved.
    `;
  }

  /**
   * Generate password reset email HTML
   */
  private generatePasswordResetEmailHTML(
    name: string,
    resetUrl: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your SnapRate Password</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Reset Your Password</h1>
              <p>Secure your SnapRate account</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your SnapRate account password. Click the button below to create a new password.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #fa709a;">${resetUrl}</p>
              
              <p><strong>This link will expire in 1 hour.</strong></p>
              
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>© 2024 SnapRate. All rights reserved.</p>
              <p>Connecting consumers with businesses through honest reviews and rewards.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate password reset email text version
   */
  private generatePasswordResetEmailText(
    name: string,
    resetUrl: string,
  ): string {
    return `
Reset Your SnapRate Password

Hi ${name},

We received a request to reset your SnapRate account password. Click the link below to create a new password.

Reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The SnapRate Team

© 2024 SnapRate. All rights reserved.
    `;
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
      .replace(/&amp;/g, "&") // Replace &amp; with &
      .replace(/&lt;/g, "<") // Replace &lt; with <
      .replace(/&gt;/g, ">") // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Test email service connection
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info("Testing email service connection");

      await this.transporter.verify();

      logger.info("Email service connection successful");
      return true;
    } catch (error) {
      logger.error("Email service connection failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }
}
