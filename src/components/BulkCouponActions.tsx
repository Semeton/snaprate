"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Download } from "lucide-react";

interface Reviewer {
  id: string;
  name: string;
  email: string;
}

interface Coupon {
  id: string;
  title: string;
  baseCode: string;
}

interface BulkCouponActionsProps {
  coupon: Coupon;
  onAssignToUsers: (couponId: string, userIds: string[]) => Promise<void>;
  onDownloadQRCode: (couponId: string) => void;
}

export default function BulkCouponActions({
  coupon,
  onAssignToUsers,
  onDownloadQRCode,
}: BulkCouponActionsProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchReviewers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reviewers");
      console.log("response", response);
      if (!response.ok) throw new Error("Failed to fetch reviewers");
      const data = await response.json();
      setReviewers(Array.isArray(data.reviewers) ? data.reviewers : []);
    } catch (error) {
      console.error("Error fetching reviewers:", error);
      setReviewers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignDialog = () => {
    setShowAssignDialog(true);
    fetchReviewers();
  };

  const handleAssignToUsers = async () => {
    if (selectedReviewers.length === 0) return;
    
    setAssigning(true);
    try {
      await onAssignToUsers(coupon.id, selectedReviewers);
      setShowAssignDialog(false);
      setSelectedReviewers([]);
    } catch (error) {
      console.error("Error assigning coupon:", error);
    } finally {
      setAssigning(false);
    }
  };

  const toggleReviewerSelection = (reviewerId: string) => {
    setSelectedReviewers(prev => 
      prev.includes(reviewerId)
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const filteredReviewers = Array.isArray(reviewers) ? reviewers.filter(reviewer => 
    reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reviewer.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="flex space-x-2">
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenAssignDialog}
            className="flex items-center gap-1"
          >
            <Users className="h-4 w-4" />
            <span>Assign</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Coupon to Reviewers</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Reviewers</Label>
              <Input
                id="search"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              {loading ? (
                <div className="flex justify-center p-4">Loading reviewers...</div>
              ) : filteredReviewers.length === 0 ? (
                <div className="text-center p-4 text-gray-500">No reviewers found</div>
              ) : (
                <div className="space-y-2">
                  {filteredReviewers.map((reviewer) => (
                    <div 
                      key={reviewer.id} 
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => toggleReviewerSelection(reviewer.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedReviewers.includes(reviewer.id)}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                      <div>
                        <div className="font-medium">{reviewer.name}</div>
                        <div className="text-sm text-gray-500">{reviewer.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm">
                {selectedReviewers.length} reviewer{selectedReviewers.length !== 1 ? 's' : ''} selected
              </div>
              <Button 
                onClick={handleAssignToUsers} 
                disabled={selectedReviewers.length === 0 || assigning}
              >
                {assigning ? "Assigning..." : "Assign Coupon"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDownloadQRCode(coupon.id)}
        className="flex items-center gap-1"
      >
        <Download className="h-4 w-4" />
        <span>QR Code</span>
      </Button>
    </div>
  );
}