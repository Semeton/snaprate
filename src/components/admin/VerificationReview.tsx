"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  User,
  MapPin,
  FileText,
} from "lucide-react";

interface VerificationSubmission {
  id: string;
  businessId: string;
  directorIdType: string;
  directorIdNumber: string;
  directorIdImage: string;
  cacDocumentType?: string;
  cacDocumentImage?: string;
  firsTaxClearance?: string;
  addressEvidenceType?: string;
  addressEvidenceImage?: string;
  verificationStatus: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  business: {
    name: string;
    category: string;
    city: string;
    state: string;
    owner: {
      name: string;
      email: string;
      phone: string;
    };
  };
}

interface VerificationReviewProps {
  status?: string;
}

export default function VerificationReview({
  status = "ALL",
}: VerificationReviewProps) {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<VerificationSubmission[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedVerification, setSelectedVerification] =
    useState<VerificationSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [imagePreview, setImagePreview] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, [selectedStatus, pagination.page]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: selectedStatus,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/verification?${params}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Verification data received:", data);
        setVerifications(data.data.verifications);
        setPagination(data.data.pagination);
      } else {
        throw new Error("Failed to fetch verifications");
      }
    } catch (error) {
      console.log("Error fetching verifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch verification submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (
    verification: VerificationSubmission,
    action: "APPROVE" | "REJECT",
  ) => {
    setSelectedVerification(verification);
    setAction(action);
    setAdminNotes(verification.adminNotes || "");
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedVerification) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: selectedVerification.id,
          action,
          adminNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Review submitted",
          description: `Verification ${action.toLowerCase()}d successfully`,
        });
        setReviewDialogOpen(false);
        fetchVerifications();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "UNDER_REVIEW":
        return (
          <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>
        );
      case "VERIFIED":
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "UNDER_REVIEW":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case "VERIFIED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Verification Review</h1>
          <p className="text-gray-600">
            Review and approve business verification documents (ID, CAC, FIRS,
            Address)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Document Statuses</SelectItem>
              <SelectItem value="PENDING">Documents Pending</SelectItem>
              <SelectItem value="UNDER_REVIEW">
                Documents Under Review
              </SelectItem>
              <SelectItem value="APPROVED">Documents Approved</SelectItem>
              <SelectItem value="REJECTED">Documents Rejected</SelectItem>
              <SelectItem value="VERIFIED">Documents Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Documents Pending</p>
                <p className="text-2xl font-bold">
                  {
                    verifications.filter(
                      (v) => v.verificationStatus === "PENDING",
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Documents Under Review</p>
                <p className="text-2xl font-bold">
                  {
                    verifications.filter(
                      (v) => v.verificationStatus === "UNDER_REVIEW",
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Documents Approved</p>
                <p className="text-2xl font-bold">
                  {
                    verifications.filter(
                      (v) => v.verificationStatus === "APPROVED",
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Documents Rejected</p>
                <p className="text-2xl font-bold">
                  {
                    verifications.filter(
                      (v) => v.verificationStatus === "REJECTED",
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verifications List */}
      <div className="space-y-4">
        {verifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No verification submissions found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Debug Info */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Debug: Found {verifications.length} verification(s)
              </p>
              {verifications.map((v, i) => (
                <div key={i} className="text-xs text-blue-600 mt-1">
                  {v.business.name}:{" "}
                  {v.directorIdImage ? "Has ID Image" : "No ID Image"} |
                  {v.cacDocumentImage ? " Has CAC" : " No CAC"} |
                  {v.firsTaxClearance ? " Has FIRS" : " No FIRS"} |
                  {v.addressEvidenceImage ? " Has Address" : " No Address"}
                </div>
              ))}
            </div>

            {/* Verifications List */}
            {verifications.map((verification) => (
              <Card key={verification.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      {/* Business Info */}
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg">
                            {verification.business.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {verification.business.category} •{" "}
                            {verification.business.city},{" "}
                            {verification.business.state}
                          </p>
                        </div>
                      </div>

                      {/* Owner Info */}
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-gray-600" />
                        <div className="text-sm">
                          <span className="font-medium">
                            {verification.business.owner.name}
                          </span>
                          <span className="text-gray-600">
                            {" "}
                            • {verification.business.owner.email}
                          </span>
                          <span className="text-gray-600">
                            {" "}
                            • {verification.business.owner.phone}
                          </span>
                        </div>
                      </div>

                      {/* Document Status Summary */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Documents Submitted:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            ✓ Director ID
                          </Badge>
                          {verification.cacDocumentType && (
                            <Badge
                              variant="outline"
                              className="text-xs text-green-600"
                            >
                              ✓ CAC Document
                            </Badge>
                          )}
                          {verification.firsTaxClearance && (
                            <Badge
                              variant="outline"
                              className="text-xs text-green-600"
                            >
                              ✓ FIRS Tax Clearance
                            </Badge>
                          )}
                          {verification.addressEvidenceType && (
                            <Badge
                              variant="outline"
                              className="text-xs text-green-600"
                            >
                              ✓ Address Evidence
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Documents Submitted */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Director ID */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">
                              Director ID
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {verification.directorIdType} •{" "}
                            {verification.directorIdNumber}
                          </p>
                          {verification.directorIdImage && (
                            <div className="mt-2">
                              <img
                                src={verification.directorIdImage}
                                alt="Director ID"
                                className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() =>
                                  setImagePreview({
                                    src: verification.directorIdImage,
                                    alt: "Director ID Document",
                                  })
                                }
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextElementSibling?.classList.remove(
                                    "hidden",
                                  );
                                }}
                              />
                              <div className="hidden w-32 h-20 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                Image not available
                              </div>
                              <div className="flex gap-2 mt-1">
                                <p className="text-xs text-gray-500">
                                  Click to view full size
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = verification.directorIdImage;
                                    link.download = `director-id-${verification.business.name}.jpg`;
                                    link.click();
                                  }}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CAC Document */}
                        {verification.cacDocumentType && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">
                                CAC Document
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {verification.cacDocumentType}
                            </p>
                            {verification.cacDocumentImage && (
                              <div className="mt-2">
                                <img
                                  src={verification.cacDocumentImage}
                                  alt="CAC Document"
                                  className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() =>
                                    verification.cacDocumentImage &&
                                    setImagePreview({
                                      src: verification.cacDocumentImage,
                                      alt: "CAC Document",
                                    })
                                  }
                                />
                                <div className="flex gap-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    Click to view full size
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      if (verification.cacDocumentImage) {
                                        const link =
                                          document.createElement("a");
                                        link.href =
                                          verification.cacDocumentImage;
                                        link.download = `cac-document-${verification.business.name}.jpg`;
                                        link.click();
                                      }
                                    }}
                                  >
                                    Download
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* FIRS Tax Clearance */}
                        {verification.firsTaxClearance && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">
                                FIRS Tax Clearance
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Document submitted
                            </p>
                            <div className="mt-2">
                              <img
                                src={verification.firsTaxClearance}
                                alt="FIRS Tax Clearance"
                                className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                onClick={() =>
                                  verification.firsTaxClearance &&
                                  setImagePreview({
                                    src: verification.firsTaxClearance,
                                    alt: "FIRS Tax Clearance Document",
                                  })
                                }
                              />
                              <div className="flex gap-2 mt-1">
                                <p className="text-xs text-gray-500">
                                  Click to view full size
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => {
                                    if (verification.firsTaxClearance) {
                                      const link = document.createElement("a");
                                      link.href = verification.firsTaxClearance;
                                      link.download = `firs-tax-clearance-${verification.business.name}.jpg`;
                                      link.click();
                                    }
                                  }}
                                >
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Address Evidence */}
                        {verification.addressEvidenceType && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium">
                                Address Evidence
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {verification.addressEvidenceType}
                            </p>
                            {verification.addressEvidenceImage && (
                              <div className="mt-2">
                                <img
                                  src={verification.addressEvidenceImage}
                                  alt="Address Evidence"
                                  className="w-32 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                  onClick={() =>
                                    verification.addressEvidenceImage &&
                                    setImagePreview({
                                      src: verification.addressEvidenceImage,
                                      alt: "Address Evidence Document",
                                    })
                                  }
                                />
                                <div className="flex gap-2 mt-1">
                                  <p className="text-xs text-gray-500">
                                    Click to view full size
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      if (verification.addressEvidenceImage) {
                                        const link =
                                          document.createElement("a");
                                        link.href =
                                          verification.addressEvidenceImage;
                                        link.download = `address-evidence-${verification.business.name}.jpg`;
                                        link.click();
                                      }
                                    }}
                                  >
                                    Download
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Submission Date */}
                      <div className="text-sm text-gray-500">
                        Submitted: {formatDate(verification.createdAt)}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(verification.verificationStatus)}
                        {getStatusBadge(verification.verificationStatus)}
                      </div>

                      {verification.verificationStatus === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleReview(verification, "APPROVE")
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify Business
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReview(verification, "REJECT")}
                          >
                            <XCircle className="h-4 w-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {verification.adminNotes && (
                        <div className="text-sm text-gray-600 max-w-xs text-right">
                          <strong>Notes:</strong> {verification.adminNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>

          <Button
            variant="outline"
            disabled={pagination.page === pagination.pages}
            onClick={() =>
              setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            Next
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === "APPROVE" ? "Verify" : "Reject"} Verification
            </DialogTitle>
            <DialogDescription>
              {selectedVerification?.business.name} -{" "}
              {selectedVerification?.business.owner.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={`Enter notes for ${action.toLowerCase()}ing this verification...`}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={submitting}
                className={
                  action === "APPROVE"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {submitting
                  ? "Submitting..."
                  : `${
                      action === "APPROVE" ? "Verify" : "Reject"
                    } Verification`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Image Preview Modal */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{imagePreview?.alt}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {imagePreview && (
              <img
                src={imagePreview.src}
                alt={imagePreview.alt}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
