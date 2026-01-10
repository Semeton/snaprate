"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Coupon } from "@/types";

interface CouponNotification {
  id: string;
  type: "expiring" | "new" | "claimed" | "recommended";
  title: string;
  message: string;
  couponId?: string;
  businessId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationSettings {
  expiringReminder: boolean;
  newCoupons: boolean;
  recommendations: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export const useCouponNotifications = () => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<CouponNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    expiringReminder: true,
    newCoupons: true,
    recommendations: true,
    emailNotifications: false,
    pushNotifications: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/notifications/coupons?userId=${session.user.id}`,
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch notifications",
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Fetch notification settings
  const fetchSettings = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(
        `/api/notifications/settings?userId=${session.user.id}`,
      );

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error("Failed to fetch notification settings:", error);
    }
  }, [session?.user?.id]);

  // Update notification settings
  const updateSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/notifications/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            settings: newSettings,
          }),
        });

        if (response.ok) {
          setSettings((prev) => ({ ...prev, ...newSettings }));
        }
      } catch (error) {
        console.error("Failed to update notification settings:", error);
      }
    },
    [session?.user?.id],
  );

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
        },
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true })),
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, [session?.user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId),
        );
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, []);

  // Check for expiring coupons
  const checkExpiringCoupons = useCallback(async () => {
    if (!session?.user?.id || !settings.expiringReminder) return;

    try {
      const response = await fetch(
        `/api/coupons/expiring-check?userId=${session.user.id}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.expiringCoupons && data.expiringCoupons.length > 0) {
          // Create notifications for expiring coupons
          const newNotifications = data.expiringCoupons.map(
            (coupon: Coupon & { validUntil: Date }) =>
              ({
                id: `expiring-${coupon.id}`,
                type: "expiring" as const,
                title: "Coupon Expiring Soon",
                message: `Your coupon "${coupon.title}" expires in ${coupon.validUntil} days`,
                couponId: coupon.id,
                businessId: coupon.business?.id,
                read: false,
                createdAt: new Date().toISOString(),
              } as CouponNotification),
          );

          setNotifications((prev) => [...newNotifications, ...prev]);
        }
      }
    } catch (error) {
      console.error("Failed to check expiring coupons:", error);
    }
  }, [session?.user?.id, settings.expiringReminder]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  }, []);

  // Show browser notification
  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });
      }
    },
    [],
  );

  // Get unread count
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  // Get notifications by type
  const getNotificationsByType = useCallback(
    (type: CouponNotification["type"]) => {
      return notifications.filter((notification) => notification.type === type);
    },
    [notifications],
  );

  // Initialize
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      fetchSettings();
    }
  }, [session?.user?.id, fetchNotifications, fetchSettings]);

  // Check for expiring coupons every hour
  useEffect(() => {
    if (session?.user?.id) {
      checkExpiringCoupons();
      const interval = setInterval(checkExpiringCoupons, 60 * 60 * 1000); // 1 hour
      return () => clearInterval(interval);
    }
  }, [session?.user?.id, checkExpiringCoupons]);

  return {
    notifications,
    settings,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    updateSettings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    checkExpiringCoupons,
    requestNotificationPermission,
    showNotification,
    getNotificationsByType,
  };
};
