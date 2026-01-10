import { NextRequest, NextResponse } from "next/server";
import PlatformSettingsService from "@/services/PlatformSettingsService";

// GET /api/platform-settings - Get platform settings for reward calculations
export async function GET(request: NextRequest) {
  try {
    // Get platform settings using the service
    const platformSettingsService = PlatformSettingsService.getInstance();
    const settings = await platformSettingsService.getSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Failed to fetch platform settings", { error });
    return NextResponse.json(
      { success: false, error: "Failed to fetch platform settings" },
      { status: 500 },
    );
  }
}
