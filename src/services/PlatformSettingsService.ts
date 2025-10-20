import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

export interface PlatformSettings {
  minimumRedemptionAmount: number;
  reviewRewardAmount: number;
  referralRewardAmount: number;
  businessRecommendationRewardAmount: number;
  businessRegistrationRewardRate: number;
  minimumBusinessesForAgent: number;
}

export class PlatformSettingsService {
  private static instance: PlatformSettingsService;
  private cachedSettings: PlatformSettings | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): PlatformSettingsService {
    if (!PlatformSettingsService.instance) {
      PlatformSettingsService.instance = new PlatformSettingsService();
    }
    return PlatformSettingsService.instance;
  }

  /**
   * Get platform settings with caching
   */
  public async getSettings(): Promise<PlatformSettings> {
    const now = Date.now();

    // Return cached settings if still valid
    if (this.cachedSettings && now - this.lastFetch < this.CACHE_DURATION) {
      return this.cachedSettings;
    }

    try {
      // Fetch from database
      const settings = await prisma.platformSettings.findFirst({
        where: { id: "main" },
      });

      if (!settings) {
        // Return default settings if none exist
        const defaultSettings: PlatformSettings = {
          minimumRedemptionAmount: 5000,
          reviewRewardAmount: 50,
          referralRewardAmount: 20,
          businessRecommendationRewardAmount: 100,
          businessRegistrationRewardRate: 200,
          minimumBusinessesForAgent: 5,
        };

        // Create default settings in database
        await this.createDefaultSettings();

        this.cachedSettings = defaultSettings;
        this.lastFetch = now;

        logger.info("Created default platform settings");
        return defaultSettings;
      }

      // Cache the settings
      this.cachedSettings = {
        minimumRedemptionAmount: settings.minimumRedemptionAmount,
        reviewRewardAmount: settings.reviewRewardAmount,
        referralRewardAmount: settings.referralRewardAmount,
        businessRecommendationRewardAmount:
          settings.businessRecommendationRewardAmount,
        businessRegistrationRewardRate: settings.businessRegistrationRewardRate,
        minimumBusinessesForAgent: settings.minimumBusinessesForAgent,
      };
      this.lastFetch = now;

      return this.cachedSettings;
    } catch (error) {
      logger.error("Failed to fetch platform settings", { error });

      // Return default settings on error
      return {
        minimumRedemptionAmount: 5000,
        reviewRewardAmount: 50,
        referralRewardAmount: 20,
        businessRecommendationRewardAmount: 100,
        businessRegistrationRewardRate: 200,
        minimumBusinessesForAgent: 5,
      };
    }
  }

  /**
   * Clear cache (useful when settings are updated)
   */
  public clearCache(): void {
    this.cachedSettings = null;
    this.lastFetch = 0;
    logger.info("Platform settings cache cleared");
  }

  /**
   * Create default platform settings
   */
  private async createDefaultSettings(): Promise<void> {
    try {
      await prisma.platformSettings.create({
        data: {
          id: "main",
          minimumRedemptionAmount: 5000,
          reviewRewardAmount: 50,
          referralRewardAmount: 20,
          businessRecommendationRewardAmount: 100,
          businessRegistrationRewardRate: 200,
          minimumBusinessesForAgent: 5,
        },
      });
    } catch (error) {
      logger.error("Failed to create default platform settings", { error });
    }
  }

  /**
   * Get review reward amount
   */
  public async getReviewRewardAmount(): Promise<number> {
    const settings = await this.getSettings();
    return settings.reviewRewardAmount;
  }

  /**
   * Get referral reward amount
   */
  public async getReferralRewardAmount(): Promise<number> {
    const settings = await this.getSettings();
    return settings.referralRewardAmount;
  }

  /**
   * Get business recommendation reward amount
   */
  public async getBusinessRecommendationRewardAmount(): Promise<number> {
    const settings = await this.getSettings();
    return settings.businessRecommendationRewardAmount;
  }

  /**
   * Get minimum redemption amount
   */
  public async getMinimumRedemptionAmount(): Promise<number> {
    const settings = await this.getSettings();
    return settings.minimumRedemptionAmount;
  }

  /**
   * Get minimum businesses for agent
   */
  public async getMinimumBusinessesForAgent(): Promise<number> {
    const settings = await this.getSettings();
    return settings.minimumBusinessesForAgent;
  }
}

export default PlatformSettingsService;
