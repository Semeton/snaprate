"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Flag, AlertTriangle, X } from "lucide-react";

interface ReportButtonProps {
  contentType: "REVIEW" | "BUSINESS" | "USER";
  contentId: string;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ReportButton({
  contentType,
  contentId,
  className = "",
  variant = "outline",
  size = "sm",
}: ReportButtonProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType,
          contentId,
          reason,
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description:
            "Content reported successfully. Our team will review it.",
        });
        setShowReportModal(false);
        setReason("");
        setDescription("");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to report content",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to report content:", error);
      toast({
        title: "Error",
        description: "Failed to report content",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getContentTypeLabel = () => {
    switch (contentType) {
      case "REVIEW":
        return "Review";
      case "BUSINESS":
        return "Business";
      case "USER":
        return "User";
      default:
        return "Content";
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowReportModal(true)}
        className={className}
      >
        <Flag className="h-4 w-4 mr-1" />
        Report
      </Button>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Report {getContentTypeLabel()}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReportModal(false);
                    setReason("");
                    setDescription("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label
                    htmlFor="reason"
                    className="text-sm font-medium text-gray-700"
                  >
                    Reason for reporting *
                  </Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INAPPROPRIATE_CONTENT">
                        Inappropriate Content
                      </SelectItem>
                      <SelectItem value="SPAM">Spam</SelectItem>
                      <SelectItem value="HARASSMENT">Harassment</SelectItem>
                      <SelectItem value="FALSE_INFORMATION">
                        False Information
                      </SelectItem>
                      <SelectItem value="COPYRIGHT_VIOLATION">
                        Copyright Violation
                      </SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Additional details (optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide more details about why you're reporting this content..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {description.length}/500 characters
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowReportModal(false);
                        setReason("");
                        setDescription("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!reason || submitting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Submit Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Reports are reviewed by our moderation
                  team. False reports may result in account restrictions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
