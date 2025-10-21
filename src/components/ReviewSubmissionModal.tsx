"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X, Star, Camera, Video, AlertCircle } from "lucide-react";
import { BusinessServiceData } from "@/types";

interface ReviewSubmissionModalProps {
  business: BusinessServiceData;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

interface ReviewFormData {
  rating: number;
  title: string;
  content: string;
  images: File[];
  video: File | null;
  isAnonymous: boolean;
}

export default function ReviewSubmissionModal({
  business,
  isOpen,
  onClose,
  onReviewSubmitted,
}: ReviewSubmissionModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    title: "",
    content: "",
    images: [],
    video: null,
    isAnonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + formData.images.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));
    setError(null);
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size > 50 * 1024 * 1024) {
      // 50MB limit
      setError("Video file size must be less than 50MB");
      return;
    }
    setFormData((prev) => ({ ...prev, video: file || null }));
    setError(null);
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = () => {
    setFormData((prev) => ({ ...prev, video: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      setError("You must be logged in to submit a review");
      return;
    }

    if (formData.rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (!formData.content.trim()) {
      setError("Please provide review content");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // For now, we'll handle file uploads as base64 strings
      // In production, you'd upload to a service like Cloudinary or AWS S3
      const imageUrls: string[] = [];
      const videoUrl = formData.video ? "video_placeholder_url" : undefined;

      const reviewData = {
        businessId: business.id,
        rating: formData.rating,
        title: formData.title.trim() || undefined,
        content: formData.content.trim(),
        images: imageUrls,
        video: videoUrl,
        isAnonymous: formData.isAnonymous,
      };

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      await response.json();
      setSuccess(true);

      // Show success message for 2 seconds then close
      setTimeout(() => {
        onReviewSubmitted();
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to submit review",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Write a Review
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {business.name} • {business.category}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    ✓
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Review submitted successfully!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  You earned your reward for your review. Thank you for your
                  feedback!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Overall Rating *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className={`p-2 rounded-lg transition-colors ${
                      formData.rating >= star
                        ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                        : "text-gray-300 hover:text-gray-400"
                    }`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        formData.rating >= star ? "fill-current" : ""
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {formData.rating === 0 && "Click to rate"}
                {formData.rating > 0 && `${formData.rating} out of 5 stars`}
              </p>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Review Title (Optional)
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Summarize your experience..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Review Content *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Share your detailed experience with this business..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={10}
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.content.length}/1000 characters
              </p>
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Photos (Optional, max 5)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {formData.images.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500">IMG</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 5 && (
                    <label className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Camera className="h-6 w-6 text-gray-400" />
                    </label>
                  )}
                </div>
              </div>

              {/* Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video (Optional, max 50MB)
                </label>
                {formData.video ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Video className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {formData.video.name}
                    </span>
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="ml-auto text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="block w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <div className="text-center">
                      <Video className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Click to upload video
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        MP4, MOV up to 50MB
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.isAnonymous}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isAnonymous: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="anonymous"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Submit review anonymously
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  formData.rating === 0 ||
                  !formData.content.trim()
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
