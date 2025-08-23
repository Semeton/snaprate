export interface UploadValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  type?: "image" | "video" | "document";
}

export const DEFAULT_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const DEFAULT_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const DEFAULT_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/avi",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export function validateFileUpload(
  file: File,
  options: UploadValidationOptions = {},
) {
  const {
    maxSize = DEFAULT_IMAGE_SIZE,
    allowedTypes = ALLOWED_IMAGE_TYPES,
    type = "image",
  } = options;

  // Check if file exists
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map((t) => t.split("/")[1]?.toUpperCase())
      .filter(Boolean)
      .join(", ");

    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions}`,
    };
  }

  return { valid: true, error: null };
}

export function getMaxSizeForType(
  type: "image" | "video" | "document",
): number {
  switch (type) {
    case "image":
      return DEFAULT_IMAGE_SIZE;
    case "video":
      return DEFAULT_VIDEO_SIZE;
    case "document":
      return DEFAULT_DOCUMENT_SIZE;
    default:
      return DEFAULT_IMAGE_SIZE;
  }
}

export function getAllowedTypesForType(
  type: "image" | "video" | "document",
): string[] {
  switch (type) {
    case "image":
      return ALLOWED_IMAGE_TYPES;
    case "video":
      return ALLOWED_VIDEO_TYPES;
    case "document":
      return ALLOWED_DOCUMENT_TYPES;
    default:
      return ALLOWED_IMAGE_TYPES;
  }
}
