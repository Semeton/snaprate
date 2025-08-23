import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface UseBusinessViewTrackingOptions {
  businessId: string;
  source?: "DIRECT" | "SEARCH" | "SOCIAL" | "REFERRAL" | "FEATURED";
  viewType?: "PROFILE" | "SEARCH_RESULT" | "FEATURED_LIST" | "RECOMMENDATION";
  autoTrack?: boolean;
  sessionId?: string;
}

export function useBusinessViewTracking({
  businessId,
  source = "DIRECT",
  viewType = "PROFILE",
  autoTrack = true,
  sessionId,
}: UseBusinessViewTrackingOptions) {
  const { data: session } = useSession();

  const trackView = useCallback(async () => {
    try {
      // Generate a unique session ID if not provided
      const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const params = new URLSearchParams({
        source,
        viewType,
        sessionId: currentSessionId,
      });

      const response = await fetch(`/api/businesses/${businessId}/track-view?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("Failed to track business view");
      }
    } catch (error) {
      console.warn("Error tracking business view:", error);
    }
  }, [businessId, source, viewType, sessionId]);

  // Auto-track view when component mounts
  useEffect(() => {
    if (autoTrack && businessId) {
      trackView();
    }
  }, [businessId, autoTrack, trackView]);

  return {
    trackView,
  };
}

// Hook for tracking views from different sources
export function useBusinessViewSourceTracking(businessId: string) {
  const { trackView: baseTrackView } = useBusinessViewTracking({
    businessId,
    autoTrack: false, // Don't auto-track, let us control when
  });

  const trackSearchView = useCallback(() => {
    baseTrackView();
  }, [baseTrackView]);

  const trackFeaturedView = useCallback(() => {
    baseTrackView();
  }, [baseTrackView]);

  const trackReferralView = useCallback(() => {
    baseTrackView();
  }, [baseTrackView]);

  const trackSocialView = useCallback(() => {
    baseTrackView();
  }, [baseTrackView]);

  return {
    trackSearchView,
    trackFeaturedView,
    trackReferralView,
    trackSocialView,
  };
}
