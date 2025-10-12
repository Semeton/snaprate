"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  UserPlus,
  X,
  Mail,
  Phone,
  MapPin,
  Star,
} from "lucide-react";
import { Coupon } from "@/types";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  userIdentifier: string;
  avatar?: string;
  role: string;
  _count?: {
    reviews: number;
  };
  averageRating?: number;
}

interface AssignUserModalProps {
  coupon: Coupon | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (couponId: string, userId: string) => Promise<void>;
  loading?: boolean;
}

const AssignUserModal: React.FC<AssignUserModalProps> = ({
  coupon,
  isOpen,
  onClose,
  onAssign,
  loading = false,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.userIdentifier
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (user.city &&
            user.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.state &&
            user.state.toLowerCase().includes(searchTerm.toLowerCase())),
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);

      const response = await fetch("/api/reviewers");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.reviewers || []);
      setFilteredUsers(data.reviewers || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId || !coupon) return;

    try {
      await onAssign(coupon.id, selectedUserId);
      setSelectedUserId("");
      onClose();
    } catch (error) {
      console.error("Failed to assign user:", error);
    }
  };

  const handleClose = () => {
    setSelectedUserId("");
    setSearchTerm("");
    setError(null);
    onClose();
  };

  if (!coupon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Coupon to User
          </DialogTitle>
          <DialogDescription>
            Assign the coupon "{coupon.title}" to a specific user. Only assigned
            users will be able to use this private coupon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Coupon Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {coupon.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {coupon.description || "No description"}
                </p>
              </div>
              <Badge variant="secondary">Private Coupon</Badge>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Search by name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">
                <Users className="h-12 w-12 mx-auto mb-2" />
                <p>{error}</p>
              </div>
              <Button onClick={fetchUsers} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {/* Users List */}
          {loadingUsers ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse"
                >
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "No reviewers are available for assignment"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUserId === user.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <Avatar
                        user={{
                          name: user.name,
                          avatar: user.avatar,
                        }}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {user.userIdentifier}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.city && user.state && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {user.city}, {user.state}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {user._count?.reviews && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              <span>{user._count.reviews} reviews</span>
                            </div>
                          )}
                          {user.averageRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span>{user.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedUserId === user.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <X className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedUserId || loading}
            >
              {loading ? "Assigning..." : "Assign Coupon"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignUserModal;
