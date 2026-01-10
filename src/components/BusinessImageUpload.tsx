"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, X, Upload, Loader2 } from "lucide-react";
import {
  validateFileUpload,
  DEFAULT_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "@/utils/uploadValidation";

interface BusinessImageUploadProps {
  businessId: string;
  currentImage?: string;
  imageType: "logo" | "coverImage";
  onImageUpdate: (imageUrl: string) => void;
  className?: string;
}

export default function BusinessImageUpload({
  businessId,
  currentImage,
  imageType,
  onImageUpdate,
  className,
}: BusinessImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        setError(null);
        setUploading(true);

        // Validate file
        const validation = validateFileUpload(file, {
          maxSize: DEFAULT_IMAGE_SIZE,
          allowedTypes: ALLOWED_IMAGE_TYPES,
          type: "image",
        });

        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        // Create FormData
        const formData = new FormData();
        formData.append("image", file);
        formData.append("type", imageType);

        // Upload image
        const response = await fetch(
          `/api/business/${businessId}/upload-image`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload image");
        }

        const data = await response.json();
        onImageUpdate(data.data.imageUrl);
      } catch (error) {
        console.error("Upload error:", error);
        setError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [businessId, imageType, onImageUpdate],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload],
  );

  const removeImage = useCallback(async () => {
    try {
      setUploading(true);
      const response = await fetch(`/api/business/${businessId}/remove-image`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: imageType }),
      });

      if (response.ok) {
        onImageUpdate("");
      }
    } catch (error) {
      console.error("Remove image error:", error);
      setError("Failed to remove image");
    } finally {
      setUploading(false);
    }
  }, [businessId, imageType, onImageUpdate]);

  const isLogo = imageType === "logo";
  const maxSizeMB = Math.round(DEFAULT_IMAGE_SIZE / (1024 * 1024));

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-sm font-medium">
        {isLogo ? "Business Logo" : "Cover Image"}
      </Label>

      <div className="space-y-3">
        {/* Current Image Display */}
        {currentImage && (
          <div className="relative">
            <div
              className={`relative overflow-hidden rounded-lg ${
                isLogo ? "w-24 h-24" : "w-full h-48"
              }`}
            >
              <img
                src={currentImage}
                alt={isLogo ? "Business Logo" : "Cover Image"}
                className={`w-full h-full object-cover ${
                  isLogo ? "rounded-lg" : "rounded-t-lg"
                }`}
              />
            </div>

            {/* Remove Button */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 w-6 h-6 p-0"
              onClick={removeImage}
              disabled={uploading}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-3">
            <div className="flex justify-center">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploading
                  ? "Uploading..."
                  : "Drag and drop an image here, or click to select"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Max size: {maxSizeMB}MB • Supported: JPG, PNG, WebP
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById(`file-input-${imageType}`)?.click()
              }
              disabled={uploading}
            >
              <Camera className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
          </div>

          <input
            id={`file-input-${imageType}`}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Error Display */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading image...</span>
          </div>
        )}
      </div>
    </div>
  );
}
