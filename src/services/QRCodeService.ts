import QRCode from "qrcode";
import jsPDF from "jspdf";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface CouponPDFData {
  couponCode: string;
  businessName: string;
  couponTitle: string;
  couponDescription?: string;
  couponValue: string;
  validUntil: string;
  userIdentifier?: string;
  userName?: string;
}

export class QRCodeService {
  /**
   * Generate QR code as data URL
   */
  static async generateQRCodeDataURL(
    data: string,
    options: QRCodeOptions = {},
  ): Promise<string> {
    try {
      const defaultOptions = {
        width: options.width || 256,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
      };

      return await QRCode.toDataURL(data, defaultOptions);
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateQRCodeSVG(
    data: string,
    options: QRCodeOptions = {},
  ): Promise<string> {
    try {
      const defaultOptions = {
        width: options.width || 256,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
      };

      return await QRCode.toString(data, { type: "svg", ...defaultOptions });
    } catch (error) {
      throw new Error(`Failed to generate QR code SVG: ${error}`);
    }
  }

  /**
   * Generate QR code as PNG buffer
   */
  static async generateQRCodeBuffer(
    data: string,
    options: QRCodeOptions = {},
  ): Promise<Buffer> {
    try {
      const defaultOptions = {
        width: options.width || 256,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
      };

      return await QRCode.toBuffer(data, defaultOptions);
    } catch (error) {
      throw new Error(`Failed to generate QR code buffer: ${error}`);
    }
  }

  /**
   * Generate coupon PDF with QR code
   */
  static async generateCouponPDF(pdfData: CouponPDFData): Promise<Buffer> {
    try {
      // Generate QR code
      const qrCodeDataURL = await this.generateQRCodeDataURL(
        `${process.env.NEXT_PUBLIC_APP_URL}/verify/${pdfData.couponCode}`,
        { width: 200 },
      );

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set up colors
      const primaryColor = "#2563eb"; // Blue
      const secondaryColor = "#64748b"; // Gray
      const accentColor = "#10b981"; // Green

      // Header
      pdf.setFillColor(primaryColor);
      pdf.rect(0, 0, 210, 30, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("SnapRate", 20, 20);

      // Coupon title
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(pdfData.couponTitle, 20, 50);

      // Business name
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(secondaryColor);
      pdf.text(`From: ${pdfData.businessName}`, 20, 60);

      // Coupon description
      if (pdfData.couponDescription) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        const descriptionLines = pdf.splitTextToSize(
          pdfData.couponDescription,
          170,
        );
        pdf.text(descriptionLines, 20, 70);
      }

      // Coupon value
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(accentColor);
      pdf.text(pdfData.couponValue, 20, 90);

      // QR Code
      pdf.addImage(qrCodeDataURL, "PNG", 140, 40, 50, 50);

      // Coupon code
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Coupon Code:", 20, 120);

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "monospace");
      pdf.text(pdfData.couponCode, 20, 130);

      // User information
      if (pdfData.userName && pdfData.userIdentifier) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(secondaryColor);
        pdf.text(`Customer: ${pdfData.userName}`, 20, 145);
        pdf.text(`ID: ${pdfData.userIdentifier}`, 20, 152);
      }

      // Validity
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Valid until: ${pdfData.validUntil}`, 20, 165);

      // Instructions
      pdf.setFontSize(10);
      pdf.setTextColor(secondaryColor);
      const instructions = [
        "Instructions:",
        "1. Present this coupon at the business location",
        "2. Staff will scan the QR code or enter the coupon code manually",
        "3. Show valid ID if required",
        "4. Enjoy your discount!",
      ];

      instructions.forEach((instruction, index) => {
        pdf.text(instruction, 20, 180 + index * 5);
      });

      // Footer
      pdf.setFillColor(secondaryColor);
      pdf.rect(0, 270, 210, 20, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Powered by SnapRate - Review Businesses. Earn Money.", 20, 282);

      return Buffer.from(pdf.output("arraybuffer"));
    } catch (error) {
      throw new Error(`Failed to generate coupon PDF: ${error}`);
    }
  }

  /**
   * Generate QR code for verification URL
   */
  static async generateVerificationQRCode(couponCode: string): Promise<string> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://snaprate.com";
    const verificationURL = `${baseUrl.replace(
      /\/+$/,
      "",
    )}/verify/${couponCode}`;
    return await this.generateQRCodeDataURL(verificationURL, {
      width: 256,
      color: {
        dark: "#2563eb",
        light: "#ffffff",
      },
    });
  }
}
