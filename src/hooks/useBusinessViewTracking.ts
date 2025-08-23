import { useEffect, useState } from "react";

interface BusinessViewTrackingProps {
  businessId: string;
  onViewTracked?: () => void;
}

export const useBusinessViewTracking = ({
  businessId,
  onViewTracked,
}: BusinessViewTrackingProps) => {
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!businessId || isTracking) return;

    const trackView = async () => {
      try {
        setIsTracking(true);

        const response = await fetch("/api/business-views", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessId,
            metadata: {
              source: "PROFILE_VIEW",
              viewType: "PROFILE",
            },
          }),
        });

        if (response.ok) {
          onViewTracked?.();
        }
      } catch (error) {
        console.error("Failed to track business view:", error);
      } finally {
        setIsTracking(false);
      }
    };

    trackView();
  }, [businessId, isTracking, onViewTracked]);

  return { isTracking };
};
