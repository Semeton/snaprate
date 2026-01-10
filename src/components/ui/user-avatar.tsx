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
  sm: { width: 32, height: 32, textSize: "xs" },
  md: { width: 40, height: 40, textSize: "sm" },
  lg: { width: 48, height: 48, textSize: "base" },
  xl: { width: 64, height: 64, textSize: "lg" },
};

const textSizeClasses = {
  sm: { textSize: "xs" },
  md: { textSize: "sm" },
  lg: { textSize: "base" },
  xl: { textSize: "lg" },
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
              sizeClasses[size].width,
              sizeClasses[size].height,
            )}
            width={sizeClasses[size].width}
            height={sizeClasses[size].height}
            priority
            unoptimized
          />
        ) : (
          <div
            className={cn(
              "rounded-full flex items-center justify-center text-white font-medium border-2 border-gray-200 dark:border-gray-600",
              fallbackColor,
              sizeClasses[size].width,
              sizeClasses[size].height,
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
                textSizeClasses[size].textSize,
              )}
            >
              {user.name}
            </p>
          )}
          {showEmail && user.email && (
            <p
              className={cn(
                "text-gray-500 dark:text-gray-400 truncate",
                textSizeClasses[size].textSize,
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
            sizeClasses[size].width,
            sizeClasses[size].height,
            className,
          )}
          width={sizeClasses[size].width}
          height={sizeClasses[size].height}
          priority
          unoptimized
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center text-white font-medium border-2 border-gray-200 dark:border-gray-600",
            fallbackColor,
            sizeClasses[size].width,
            sizeClasses[size].height,
            className,
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
