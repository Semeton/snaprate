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
import BusinessDetailModal from "@/components/BusinessDetailModal";
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  owner: {
    name: string;
    email: string;
  };
}

export default function AdminBusinessesPage() {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Business>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const [showBusinessModal, setShowBusinessModal] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/businesses");
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Business) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Business) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  const handleVerification = async (
    businessId: string,
    status: "VERIFIED" | "REJECTED",
  ) => {
    try {
      const response = await fetch(
        `/api/admin/businesses/${businessId}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Business ${status.toLowerCase()} successfully`,
        });
        fetchBusinesses();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update business status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update business status:", error);
      toast({
        title: "Error",
        description: "Failed to update business status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "VERIFIED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBusinesses = businesses
    .filter((business) => {
      const matchesFilter =
        filter === "ALL" || business.verificationStatus === filter;
      const matchesSearch =
        searchTerm === "" ||
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.city.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
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

  const pendingCount = businesses.filter(
    (b) => b.verificationStatus === "PENDING",
  ).length;
  const verifiedCount = businesses.filter(
    (b) => b.verificationStatus === "VERIFIED",
  ).length;
  const rejectedCount = businesses.filter(
    (b) => b.verificationStatus === "REJECTED",
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Business Management
              </h1>
              <p className="text-gray-600">
                Verify and manage business registrations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-900">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">
                {pendingCount}
              </div>
              <p className="text-yellow-700">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-900">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {verifiedCount}
              </div>
              <p className="text-green-700">Approved businesses</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-900">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">
                {rejectedCount}
              </div>
              <p className="text-red-700">Declined registrations</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="filter">Status Filter</Label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("ALL");
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Businesses ({filteredBusinesses.length})</span>
              <Button onClick={fetchBusinesses} variant="outline" size="sm">
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
                        Business Name
                        {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("category")}
                    >
                      <div className="flex items-center">
                        Category
                        {getSortIcon("category")}
                      </div>
                    </TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("verificationStatus")}
                    >
                      <div className="flex items-center">
                        Status
                        {getSortIcon("verificationStatus")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center">
                        Registered
                        {getSortIcon("createdAt")}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBusinesses.map((business) => (
                    <TableRow key={business.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {business.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {business.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>
                              {business.city}, {business.state}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{business.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span>{business.email}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 text-gray-400" />
                            <span>{business.owner.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(business.verificationStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {business.verificationStatus === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  handleVerification(business.id, "VERIFIED")
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleVerification(business.id, "REJECTED")
                                }
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {business.verificationStatus !== "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedBusiness(business);
                                setShowBusinessModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredBusinesses.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No businesses found matching your criteria
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          isOpen={showBusinessModal}
          onClose={() => {
            setShowBusinessModal(false);
            setSelectedBusiness(null);
          }}
          onVerification={handleVerification}
        />
      )}
    </div>
  );
}
