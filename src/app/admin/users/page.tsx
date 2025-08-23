"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import {
  Users,
  Search,
  Filter,
  Eye,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Building2,
  Star,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "REVIEWER" | "BUSINESS_OWNER" | "AGENT" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isVerified: boolean;
  city: string;
  state: string;
  createdAt: string;
  lastLoginAt?: string;
  _count: {
    reviews: number;
    rewards: number;
  };
  business?: {
    id: string;
    name: string;
    verificationStatus: string;
  };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sortField, setSortField] = useState<keyof User>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    userId: string,
    newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User status updated successfully",
        });
        fetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: newStatus });
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update user status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      REVIEWER: { label: "Reviewer", variant: "default" as const },
      BUSINESS_OWNER: {
        label: "Business Owner",
        variant: "secondary" as const,
      },
      AGENT: { label: "Agent", variant: "outline" as const },
      ADMIN: { label: "Admin", variant: "destructive" as const },
      SUPER_ADMIN: { label: "Super Admin", variant: "destructive" as const },
    };

    const config =
      roleConfig[role as keyof typeof roleConfig] || roleConfig.REVIEWER;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: "Active", variant: "default" as const },
      INACTIVE: { label: "Inactive", variant: "secondary" as const },
      SUSPENDED: { label: "Suspended", variant: "destructive" as const },
      PENDING: { label: "Pending", variant: "outline" as const },
      VERIFIED: { label: "Verified", variant: "default" as const },
      REJECTED: { label: "Rejected", variant: "destructive" as const },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof User) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const filteredUsers = users
    .filter((user) => {
      const matchesFilter = filter === "ALL" || user.status === filter;
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesSearch =
        searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.state.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesRole && matchesSearch;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return 0;
    });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    inactive: users.filter((u) => u.status === "INACTIVE").length,
    suspended: users.filter((u) => u.status === "SUSPENDED").length,
    verified: users.filter((u) => u.isVerified).length,
    businessOwners: users.filter((u) => u.role === "BUSINESS_OWNER").length,
    agents: users.filter((u) => u.role === "AGENT").length,
    reviewers: users.filter((u) => u.role === "REVIEWER").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all platform users, their status, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Users</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inactive}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.suspended}
            </div>
            <div className="text-sm text-gray-600">Suspended</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.verified}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {stats.businessOwners}
            </div>
            <div className="text-sm text-gray-600">Businesses</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.agents}
            </div>
            <div className="text-sm text-gray-600">Agents</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-teal-600">
              {stats.reviewers}
            </div>
            <div className="text-sm text-gray-600">Reviewers</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label
                htmlFor="search"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Search Users
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, city, or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="status-filter"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Status Filter
              </Label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger id="status-filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                htmlFor="role-filter"
                className="text-sm font-medium text-gray-700 mb-2 block"
              >
                Role Filter
              </Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role-filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="REVIEWER">Reviewers</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">
                    Business Owners
                  </SelectItem>
                  <SelectItem value="AGENT">Agents</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({filteredUsers.length})</span>
            <Button onClick={fetchUsers} variant="outline" size="sm">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Name
                      {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center">
                      Email
                      {getSortIcon("email")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center">
                      Role
                      {getSortIcon("role")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIcon("status")}
                    </div>
                  </TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center">
                      Joined
                      {getSortIcon("createdAt")}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.isVerified ? "✓ Verified" : "Unverified"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span>
                            {user.city}, {user.state}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-blue-500" />
                          <span>{user._count.reviews}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Building2 className="h-3 w-3 text-green-500" />
                          <span>{user.business ? "1" : "0"}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3 text-purple-500" />
                          <span>{user._count.rewards}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select
                          value={user.status}
                          onValueChange={(
                            value: "ACTIVE" | "INACTIVE" | "SUSPENDED",
                          ) => handleStatusChange(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SUSPENDED">Suspend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No users found matching your criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  User Details
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Name
                    </Label>
                    <p className="text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Role
                    </Label>
                    <div className="mt-1">
                      {getRoleBadge(selectedUser.role)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedUser.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      City
                    </Label>
                    <p className="text-gray-900">{selectedUser.city}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      State
                    </Label>
                    <p className="text-gray-900">{selectedUser.state}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Verified
                    </Label>
                    <p className="text-gray-900">
                      {selectedUser.isVerified ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Joined
                    </Label>
                    <p className="text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedUser.business && (
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Business Information
                    </Label>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Business Name
                        </Label>
                        <p className="text-gray-900">
                          {selectedUser.business.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Verification Status
                        </Label>
                        <div className="mt-1">
                          {getStatusBadge(
                            selectedUser.business.verificationStatus,
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Activity Summary
                  </Label>
                  <div className="mt-2 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">
                        {selectedUser._count.reviews}
                      </div>
                      <div className="text-sm text-blue-700">Reviews</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">
                        {selectedUser.business ? "1" : "0"}
                      </div>
                      <div className="text-sm text-green-700">Businesses</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">
                        {selectedUser._count.rewards}
                      </div>
                      <div className="text-sm text-purple-700">Rewards</div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Account Actions
                  </Label>
                  <div className="mt-2 flex items-center space-x-2">
                    {selectedUser.status !== "SUSPENDED" ? (
                      <>
                        {selectedUser.status === "ACTIVE" ? (
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(selectedUser.id, "INACTIVE")
                            }
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              handleStatusChange(selectedUser.id, "ACTIVE")
                            }
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate
                          </Button>
                        )}

                        <Button
                          variant="destructive"
                          onClick={() =>
                            handleStatusChange(selectedUser.id, "SUSPENDED")
                          }
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Suspend
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleStatusChange(selectedUser.id, "ACTIVE")
                        }
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Reactivate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
