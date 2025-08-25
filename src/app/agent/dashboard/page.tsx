"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Building2,
  TrendingUp,
  Award,
  MapPin,
  Mail,
  Shield,
  Users,
  FileText,
  Settings,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Agent } from "@prisma/client";

interface AgentDashboardStats {
  totalBusinessesOnboarded: number;
  totalEarnings: number;
  pendingApprovals: number;
  monthlyEarnings: number;
  approvalRate: number;
}

interface OnboardedBusiness {
  id: string;
  name: string;
  category: string;
  state: string;
  city: string;
  verificationStatus: string;
  createdAt: Date;
  owner: {
    name: string;
    email: string;
  };
}

export default function AgentDashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<AgentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentProfile, setAgentProfile] = useState<Agent | null>(null);
  const [onboardedBusinesses, setOnboardedBusinesses] = useState<
    OnboardedBusiness[]
  >([]);

  useEffect(() => {
    if (session?.user) {
      // TODO: Replace with actual API calls to get agent data and stats
      // For now, show loading state
      setAgentProfile(null);
      setStats({
        totalBusinessesOnboarded: 0,
        totalEarnings: 0,
        pendingApprovals: 0,
        monthlyEarnings: 0,
        approvalRate: 0,
      });
      setOnboardedBusinesses([]);
      setLoading(false);
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            You need to be signed in to view this page.
          </p>
          <Button asChild>
            <a href="/auth/signin">Sign In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!agentProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Agent Profile Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            You need to create an agent profile to access this dashboard.
          </p>
          <Button asChild>
            <a href="/agent/register">Register as Agent</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!agentProfile.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Profile Pending Approval
          </h1>
          <p className="text-gray-600 mb-4">
            Your agent profile is currently under review. You&apos;ll be
            notified once it&apos;s approved.
          </p>
          <div className="flex items-center justify-center space-x-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            <span>Status: Pending Approval</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge variant="default">Verified</Badge>;
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome, {session.user.name}!
                </h1>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved Agent
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Business Onboarding Agent Dashboard
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <Building2 className="h-4 w-4" />
                  <span>
                    {stats?.totalBusinessesOnboarded} businesses onboarded
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Award className="h-4 w-4" />
                  <span>
                    {formatCurrency(stats?.totalEarnings || 0)} total earnings
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{stats?.approvalRate}% approval rate</span>
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Onboard Business
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Onboarded
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalBusinessesOnboarded}
                </div>
                <p className="text-xs text-muted-foreground">Businesses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalEarnings)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Earnings
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.monthlyEarnings)}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approvals
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendingApprovals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting verification
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Approval Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvalRate}%</div>
                <p className="text-xs text-muted-foreground">Success rate</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Info Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Agent Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Name:</span>
                    <span>{session.user.name}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Email:</span>
                    <span>{session.user.email}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Status:</span>
                    <Badge variant="default" className="bg-green-600">
                      Approved
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Businesses:</span>
                    <span>{stats?.totalBusinessesOnboarded}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Total Earnings:</span>
                    <span>{formatCurrency(stats?.totalEarnings || 0)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full" variant="outline">
                    Update Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>For receiving commissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">
                    Bank: {agentProfile.bankName}
                  </div>
                  <div className="text-gray-600">
                    Account: {agentProfile.accountNumber}
                  </div>
                  <div className="text-gray-600">
                    Name: {agentProfile.accountName}
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Update Bank Details
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Onboard Business
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Businesses
                </Button>
                <Button className="w-full" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="businesses">Businesses</TabsTrigger>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest business onboarding activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            ABC Restaurant verified successfully
                          </p>
                          <p className="text-sm text-gray-500">2 hours ago</p>
                        </div>
                        <Badge variant="default">Verified</Badge>
                      </div>

                      <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Plus className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            New business &quot;Tech Solutions Ltd&quot;
                            onboarded
                          </p>
                          <p className="text-sm text-gray-500">1 day ago</p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>

                      <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Award className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            Commission earned: ₦5,000 from Fashion Boutique
                          </p>
                          <p className="text-sm text-gray-500">3 days ago</p>
                        </div>
                        <Badge variant="outline">₦5,000</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                    <CardDescription>
                      This month&apos;s key metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          +3
                        </div>
                        <div className="text-sm text-gray-600">
                          New Businesses
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          +12%
                        </div>
                        <div className="text-sm text-gray-600">
                          Earnings Growth
                        </div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          95%
                        </div>
                        <div className="text-sm text-gray-600">
                          Verification Rate
                        </div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          ₦25K
                        </div>
                        <div className="text-sm text-gray-600">
                          Monthly Earnings
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="businesses" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Onboarded Businesses</CardTitle>
                    <CardDescription>
                      Manage all businesses you&apos;ve onboarded
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {onboardedBusinesses.map((business) => (
                        <div
                          key={business.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-medium">{business.name}</h3>
                              {getStatusIcon(business.verificationStatus)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>
                                  {business.city}, {business.state}
                                </span>
                              </span>
                              <span className="ml-4">
                                Owner: {business.owner.name}
                              </span>
                              <span className="ml-4">
                                Category: {business.category}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Onboarded: {formatDate(business.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(business.verificationStatus)}
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="earnings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Earnings & Commissions</CardTitle>
                    <CardDescription>
                      Track your earnings and commission history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-center py-8">
                      Earnings and commission tracking interface will be
                      displayed here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Reports</CardTitle>
                    <CardDescription>
                      Generate and view detailed performance reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-center py-8">
                      Performance reporting interface will be displayed here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
