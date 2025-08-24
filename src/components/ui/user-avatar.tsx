import { cn } from "@/lib/utils";
import Image from "next/image";

interface UserAvatarProps {
  user: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showName?: boolean;
  showEmail?: boolean;
  showRole?: boolean;
  role?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

export function UserAvatar({
  user,
  size = "md",
  className,
  showName = false,
  showEmail = false,
  showRole = false,
  role,
}: UserAvatarProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";

    const names = name.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getFallbackColor = (name: string | null | undefined) => {
    if (!name) return "bg-gray-500";

    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-teal-500",
    ];

    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const initials = getInitials(user.name);
  const fallbackColor = getFallbackColor(user.name);

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Avatar */}
      <div className="relative">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name || "User"}
            className={cn(
              "rounded-full object-cover border-2 border-gray-200 dark:border-gray-600",
              sizeClasses[size],
            )}
            width={100}
            height={100}
          />
        ) : (
          <div
            className={cn(
              "rounded-full flex items-center justify-center text-white font-medium border-2 border-gray-200 dark:border-gray-600",
              fallbackColor,
              sizeClasses[size],
            )}
          >
            {initials}
          </div>
        )}
      </div>

      {/* User Info */}
      {(showName || showEmail || showRole) && (
        <div className="flex-1 min-w-0">
          {showName && user.name && (
            <p
              className={cn(
                "font-medium text-gray-900 dark:text-white truncate",
                textSizeClasses[size],
              )}
            >
              {user.name}
            </p>
          )}
          {showEmail && user.email && (
            <p
              className={cn(
                "text-gray-500 dark:text-gray-400 truncate",
                textSizeClasses[size],
              )}
            >
              {user.email}
            </p>
          )}
          {showRole && role && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1",
                {
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200":
                    role === "REVIEWER",
                  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200":
                    role === "AGENT",
                  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200":
                    role === "ADMIN" || role === "SUPER_ADMIN",
                  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200":
                    role === "BUSINESS_OWNER",
                },
              )}
            >
              {role === "SUPER_ADMIN"
                ? "Super Admin"
                : role === "BUSINESS_OWNER"
                ? "Business Owner"
                : role}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Standalone avatar component for simple avatar display
export function Avatar({
  user,
  size = "md",
  className,
}: {
  user: {
    name?: string | null;
    avatar?: string | null;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";

    const names = name.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getFallbackColor = (name: string | null | undefined) => {
    if (!name) return "bg-gray-500";

    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-teal-500",
    ];

    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const initials = getInitials(user.name);
  const fallbackColor = getFallbackColor(user.name);

  return (
    <div className="relative">
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={user.name || "User"}
          className={cn(
            "rounded-full object-cover border-2 border-gray-200 dark:border-gray-600",
            sizeClasses[size],
            className,
          )}
          width={100}
          height={100}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center text-white font-medium border-2 border-gray-200 dark:border-gray-600",
            fallbackColor,
            sizeClasses[size],
            className,
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
