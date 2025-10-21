"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, X, Upload, Loader2, GripVertical, Trash2 } from "lucide-react";
import {
  validateFileUpload,
  DEFAULT_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from "@/utils/uploadValidation";

interface ServicesImageUploadProps {
  businessId: string;
  currentImages: string[];
  onImagesUpdate: (imageUrls: string[]) => void;
  className?: string;
}

export default function ServicesImageUpload({
  businessId,
  currentImages,
  onImagesUpdate,
  className,
}: ServicesImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      try {
        setError(null);

        // Check if we have a businessId
        if (!businessId) {
          setError("Business ID is required for image upload");
          return;
        }

        // Check if we already have 3 images
        if (currentImages.length >= 3) {
          setError("Maximum 3 service images allowed");
          return;
        }

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
        formData.append("type", "service");

        const uploadUrl = `/api/business/${businessId}/upload-image`;

        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload image");
        }

        const data = await response.json();

        // Business-specific endpoint returns data.data.imageUrl
        const imageUrl = data.data.imageUrl;
        console.log(`Upload successful. Image URL: ${imageUrl}`);

        const newImages = [...currentImages, imageUrl];
        console.log(`Updating local state with images:`, newImages);
        onImagesUpdate(newImages);
      } catch (error) {
        console.error("Upload error:", error);
        setError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [businessId, currentImages, onImagesUpdate],
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

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload],
  );

  const handleRemoveImage = useCallback(
    (index: number) => {
      const newImages = currentImages.filter((_, i) => i !== index);
      onImagesUpdate(newImages);
    },
    [currentImages, onImagesUpdate],
  );

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDropReorder = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newImages = [...currentImages];
      const [draggedImage] = newImages.splice(draggedIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);

      onImagesUpdate(newImages);
      setDraggedIndex(null);
    },
    [currentImages, draggedIndex, onImagesUpdate],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  // Don't render if no businessId
  if (!businessId) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div>
          <Label>Service/Product Images (Max 3)</Label>
          <p className="text-sm text-gray-500 mt-1">
            Business ID is required for image upload
          </p>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <div className="text-gray-500">
            <p className="text-sm">
              Cannot upload images without a business ID
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label>Service/Product Images (Max 3)</Label>
        <p className="text-sm text-gray-500 mt-1">
          Upload images showcasing your services or products
        </p>
      </div>

      {/* Current Images Display */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {currentImages.map((image, index) => (
            <div
              key={index}
              className={`relative group border-2 border-dashed border-gray-300 rounded-lg overflow-hidden ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropReorder(e, index)}
              onDragEnd={handleDragEnd}
            >
              <img
                src={image}
                alt={`Service ${index + 1}`}
                className="w-full h-24 object-cover"
              />

              {/* Drag Handle */}
              <div className="absolute top-1 left-1 bg-black/50 rounded p-1 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3 text-white" />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              {/* Image Number */}
              <div className="absolute bottom-1 left-1 bg-black/50 rounded px-2 py-1">
                <span className="text-xs text-white font-medium">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {currentImages.length < 3 && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="service-image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
            disabled={uploading}
          />

          <label
            htmlFor="service-image-upload"
            className="cursor-pointer block"
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-blue-600">Uploading...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {dragActive ? "Drop image here" : "Upload service image"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Drag & drop or click to select
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Image Count */}
      <div className="text-sm text-gray-500 text-center">
        {currentImages.length}/3 images uploaded
      </div>
    </div>
  );
}
