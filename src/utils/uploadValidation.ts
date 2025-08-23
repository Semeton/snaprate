import { z } from "zod";

// File validation schemas
export const imageFileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
  type: z
    .string()
    .refine((type) => type.startsWith("image/"), "File must be an image"),
});

export const documentFileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
  type: z
    .string()
    .refine(
      (type) =>
        type === "application/pdf" ||
        type === "application/msword" ||
        type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "File must be a PDF or Word document",
    ),
});

export const videoFileSchema = z.object({
  name: z.string().min(1, "File name is required"),
  size: z.number().max(50 * 1024 * 1024, "File size must be less than 50MB"),
  type: z
    .string()
    .refine((type) => type.startsWith("video/"), "File must be a video"),
});

// Validation functions
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  try {
    imageFileSchema.parse(file);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: "Invalid file" };
  }
}

export function validateDocumentFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  try {
    documentFileSchema.parse(file);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: "Invalid file" };
  }
}

export function validateVideoFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  try {
    videoFileSchema.parse(file);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: "Invalid file" };
  }
}

// Generic file validation
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {},
): { isValid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024,
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${Math.round(
        maxSize / (1024 * 1024),
      )}MB`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  if (allowedExtensions.length > 0) {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File extension .${fileExtension} is not allowed`,
      };
    }
  }

  return { isValid: true };
}
