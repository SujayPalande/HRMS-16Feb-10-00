import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LeaveForm } from "@/components/leave/leave-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FileText,
  Check,
  X,
  CalendarDays,
  UserCheck,
  Timer,
  Target,
  Activity,
  BarChart3,
  Award,
  Briefcase,
  Search,
  Filter,
  Eye,
  Settings,
  ChevronRight,
  Star,
  Crown,
  User as UserIcon,
  Mail,
  Building2,
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { LeaveRequest, User, LeaveBalance } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { format, eachDayOfInterval, isWeekend, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LeavePage() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [location] = useLocation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [activeTab, setActiveTab] = useState("my-requests");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Parse userId from URL if present
  const queryParams = useMemo(() => new URLSearchParams(window.location.search), [window.location.search]);
  const targetUserId = queryParams.get("id") ? parseInt(queryParams.get("id")!) : authUser?.id;
  
  // Fetch all employees to display names (Needed for effectiveUser derivation)
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: !!authUser,
  });

  const effectiveUser = useMemo(() => {
    if (targetUserId === authUser?.id) return authUser;
    return employees.find(emp => emp.id === targetUserId);
  }, [targetUserId, authUser, employees]);
  
  // Fetch leave requests for current user (My Requests tab)
  const { data: myLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", { userId: authUser?.id }],
    enabled: !!authUser,
  });

  // Fetch leave requests for the effective user (Main profile display)
  const { data: targetLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", { userId: effectiveUser?.id }],
    enabled: !!effectiveUser && targetUserId !== authUser?.id,
  });

  const displayLeaveRequests = targetUserId === authUser?.id ? myLeaveRequests : targetLeaveRequests;
  
  // Fetch pending leave requests (for admins/HR/managers)
  const { data: pendingRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", { status: "pending" }],
    enabled: !!authUser && (authUser.role === 'admin' || authUser.role === 'hr' || authUser.role === 'manager'),
  });
  
  // Fetch all leave requests for analytics (admin view)
  const { data: allLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
    enabled: !!authUser && (authUser.role === 'admin' || authUser.role === 'hr' || authUser.role === 'manager'),
  });
  
  // Fetch effective user's leave balance
  const { data: leaveBalance, isLoading: isLoadingLeaveBalance } = useQuery<LeaveBalance>({
    queryKey: ['/api/employees/leave-balance', effectiveUser?.id],
    queryFn: async () => {
      const response = await fetch(`/api/employees/${effectiveUser?.id}/leave-balance`);
      if (!response.ok) throw new Error('Failed to fetch leave balance');
      return response.json();
    },
    enabled: !!effectiveUser,
  });
  
  // Approve leave request
  const approveMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("PUT", `/api/leave-requests/${requestId}`, {
        status: "approved",
        approvedById: authUser?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      toast({ title: "Request approved" });
    },
  });
  
  // Reject leave request
  const rejectMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("PUT", `/api/leave-requests/${requestId}`, {
        status: "rejected",
        approvedById: authUser?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      toast({ title: "Request rejected" });
    },
  });
  
  // Cancel leave request
  const cancelMutation = useMutation({
    mutationFn: async (requestId: number) => {
      await apiRequest("DELETE", `/api/leave-requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      toast({ title: "Request canceled" });
    },
  });
  
  // Get user info by ID
  const getUserById = (userId: number) => {
    return employees.find(emp => emp.id === userId);
  };
  
  // Format date range
  const formatDateRange = (start: string | Date, end: string | Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };
  
  // Calculate duration in business days
  const calculateDuration = (start: string | Date, end: string | Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!startDate || !endDate || endDate < startDate) return '0 days';
    const businessDays = eachDayOfInterval({ start: startDate, end: endDate }).filter(day => !isWeekend(day));
    return `${businessDays.length} working day${businessDays.length !== 1 ? 's' : ''}`;
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
    }
  };

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'annual': return <Calendar className="w-4 h-4" />;
      case 'sick': return <Target className="w-4 h-4" />;
      case 'personal': return <Star className="w-4 h-4" />;
      case 'halfday': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const calculateMonthlyPaidLeaveUsage = (userId: number, targetMonth?: Date) => {
    const month = targetMonth || new Date();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const paidLeaveTypes = ['annual', 'sick', 'personal', 'halfday', 'other'];
    
    const leaveRequestsData = userId === authUser?.id ? myLeaveRequests : 
                             userId === effectiveUser?.id ? targetLeaveRequests : 
                             allLeaveRequests;
    
    const monthlyPaidLeaveUsed = leaveRequestsData
      .filter(request => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        return requestStart <= monthEnd && requestEnd >= monthStart && 
               request.status === "approved" && paidLeaveTypes.includes(request.type) && 
               request.userId === userId;
      })
      .reduce((total: number, request: LeaveRequest) => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        if (request.type === "halfday") {
          return (requestStart >= monthStart && requestStart <= monthEnd && !isWeekend(requestStart)) ? total + 0.5 : total;
        } else {
          const clippedStart = new Date(Math.max(requestStart.getTime(), monthStart.getTime()));
          const clippedEnd = new Date(Math.min(requestEnd.getTime(), monthEnd.getTime()));
          return clippedStart <= clippedEnd ? total + eachDayOfInterval({ start: clippedStart, end: clippedEnd }).filter(day => !isWeekend(day)).length : total;
        }
      }, 0);
    
    return { used: monthlyPaidLeaveUsed, limit: 1.5, remaining: Math.max(0, 1.5 - monthlyPaidLeaveUsed) };
  };

  const wouldExceedPaidLeaveLimit = (userId: number, startDate: Date, endDate: Date, leaveType: string) => {
    if (leaveType === 'unpaid' || leaveType === 'workfromhome') return { wouldExceed: false };
    const monthsSpanned: Date[] = [];
    let checkMonth = startOfMonth(startDate);
    while (checkMonth <= endOfMonth(endDate)) {
      monthsSpanned.push(new Date(checkMonth));
      checkMonth = startOfMonth(new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 1));
    }
    const perMonthAnalysis = monthsSpanned.map(month => {
      const currentUsage = calculateMonthlyPaidLeaveUsage(userId, month);
      let requestDaysInMonth = 0;
      if (leaveType === "halfday") {
        if (startDate >= startOfMonth(month) && startDate <= endOfMonth(month) && !isWeekend(startDate)) requestDaysInMonth = 0.5;
      } else {
        const clippedStart = new Date(Math.max(startDate.getTime(), startOfMonth(month).getTime()));
        const clippedEnd = new Date(Math.min(endDate.getTime(), endOfMonth(month).getTime()));
        if (clippedStart <= clippedEnd) requestDaysInMonth = eachDayOfInterval({ start: clippedStart, end: clippedEnd }).filter(day => !isWeekend(day)).length;
      }
      return { wouldExceed: (currentUsage.used + requestDaysInMonth) > currentUsage.limit };
    });
    return { wouldExceed: perMonthAnalysis.some(a => a.wouldExceed) };
  };

  const getPaidUnpaidBadge = (request: LeaveRequest) => {
    if (request.type === 'unpaid') return <Badge className="bg-gray-100 text-gray-800">Unpaid</Badge>;
    if (request.type === 'workfromhome') return <Badge className="bg-green-100 text-green-800">WFH</Badge>;
    const analysis = wouldExceedPaidLeaveLimit(request.userId, new Date(request.startDate), new Date(request.endDate), request.type);
    return analysis.wouldExceed ? <Badge className="bg-red-100 text-red-800">Unpaid</Badge> : <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
  };

  const getLeaveAnalytics = () => {
    const thisMonth = new Date();
    const requestsData = displayLeaveRequests;
    const thisMonthRequests = requestsData.filter(req => {
      const d = new Date(req.createdAt || req.startDate);
      return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
    });
    return {
      totalRequests: requestsData.length,
      pendingCount: requestsData.filter(r => r.status === 'pending').length,
      approvedCount: requestsData.filter(r => r.status === 'approved').length,
      rejectedCount: requestsData.filter(r => r.status === 'rejected').length,
      thisMonthRequests: thisMonthRequests.length,
      workFromHomeCount: requestsData.filter(r => r.type === 'workfromhome').length,
    };
  };

  const analytics = getLeaveAnalytics();
  const filteredMyRequests = displayLeaveRequests.filter(r => {
    const s = searchQuery.toLowerCase();
    return r.type.toLowerCase().includes(s) || (r.reason && r.reason.toLowerCase().includes(s)) || (r.status && r.status.toLowerCase().includes(s));
  });

  const filteredPendingRequests = pendingRequests.filter(request => {
    const employee = getUserById(request.userId);
    const searchLower = searchQuery.toLowerCase();
    return (
      request.type.toLowerCase().includes(searchLower) ||
      (request.reason && request.reason.toLowerCase().includes(searchLower)) ||
      (employee && `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchLower))
    );
  });

  const handleView = (r: LeaveRequest) => { setSelectedLeave(r); setIsViewOpen(true); };
  const handleEdit = (r: LeaveRequest) => { setSelectedLeave(r); setIsEditOpen(true); };

  const LeaveRequestCard = ({ request, index, showEmployee = false }: { request: LeaveRequest; index: number; showEmployee?: boolean }) => {
    const employee = getUserById(request.userId);
    const isPending = request.status === 'pending';
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
        <Card className="group border-2 border-slate-200 shadow-lg hover:shadow-2xl hover:border-teal-300 transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {showEmployee && employee ? (
                    <>
                      <Avatar className="h-12 w-12 border-3 border-white shadow-lg">
                        <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal-900">{employee.firstName} {employee.lastName}</h3>
                        <p className="text-sm text-slate-600 font-medium">{employee.position || "Employee"}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <div className="bg-teal-100 p-3 rounded-xl shadow-lg">{getLeaveTypeIcon(request.type)}</div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal-900 capitalize">{request.type} Leave</h3>
                        <p className="text-sm text-slate-600 font-medium">{calculateDuration(request.startDate, request.endDate)}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Dialog open={isViewOpen && selectedLeave?.id === request.id} onOpenChange={(open) => {
                    if (!open) setIsViewOpen(false);
                    else handleView(request);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-teal-100">
                        <Eye className="h-4 w-4 text-teal-600" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Leave Details</DialogTitle>
                      </DialogHeader>
                      {selectedLeave && (
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium text-slate-500">Employee</span>
                            <span className="font-bold">{employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium text-slate-500">Type</span>
                            <Badge variant="outline" className="capitalize">{selectedLeave.type}</Badge>
                          </div>
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium text-slate-500">Period</span>
                            <span className="text-sm font-medium">{formatDateRange(selectedLeave.startDate, selectedLeave.endDate)}</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium text-slate-500">Duration</span>
                            <span className="text-sm font-medium">{calculateDuration(selectedLeave.startDate, selectedLeave.endDate)}</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm font-medium text-slate-500">Status</span>
                            {getStatusBadge(selectedLeave.status)}
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-slate-500">Reason</span>
                            <p className="text-sm bg-slate-50 p-3 rounded-lg border italic">
                              {selectedLeave.reason || 'No reason provided'}
                            </p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  {isPending && !showEmployee && (
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(request)} className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-slate-100"><Settings className="h-4 w-4 text-slate-600" /></Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-600"><CalendarDays className="w-4 h-4 text-teal-500" /><span>{formatDateRange(request.startDate, request.endDate)}</span></div>
                {request.reason && <p className="text-sm text-slate-500 line-clamp-2">{request.reason}</p>}
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(request.status)}
                  {getPaidUnpaidBadge(request)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const calculateLeaveBalance = (type: string) => {
    const annual = 20;
    const sick = 10;
    const personal = 5;
    const halfday = 12;
    
    const used = displayLeaveRequests
      .filter(request => request.status === "approved" && request.type === type)
      .reduce((total, request) => {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        if (type === "halfday") {
          return total + 1;
        } else {
          const businessDays = eachDayOfInterval({ start, end }).filter(day => !isWeekend(day));
          return total + businessDays.length;
        }
      }, 0);
    
    switch (type) {
      case "annual": return { total: annual, used, remaining: annual - used };
      case "sick": return { total: sick, used, remaining: sick - used };
      case "personal": return { total: personal, used, remaining: personal - used };
      case "halfday": return { total: halfday, used, remaining: halfday - used };
      default: return { total: 0, used: 0, remaining: 0 };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 -mx-6 -mt-6 px-6 py-8 border-b-2 border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-teal-100 p-4 rounded-2xl shadow-lg"><Calendar className="w-8 h-8 text-teal-700" /></div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                  {effectiveUser ? `${effectiveUser.firstName} ${effectiveUser.lastName}'s ` : ""}Leave Management
                </h1>
                <p className="text-slate-600 text-lg">Manage leave requests and track time off</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-xl px-4 py-3 shadow-md border border-slate-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-600">{targetUserId === authUser?.id ? "My Requests" : "Total Requests"}</div>
                    <div className="text-2xl font-bold text-slate-900">{displayLeaveRequests.length}</div>
                  </div>
                </div>
              </div>
              {targetUserId === authUser?.id && (
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-teal-600 hover:bg-teal-700 px-6 py-3 h-auto text-white font-semibold shadow-lg transition-all"><Plus className="h-5 w-5 mr-2" />Apply for Leave</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
                    <LeaveForm onSuccess={() => { setIsAddOpen(false); queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] }); }} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="border-2 border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-sm font-medium text-blue-700 mb-1">Total Requests</div><div className="text-3xl font-bold text-blue-900">{analytics.totalRequests}</div></div>
              <div className="bg-blue-500 p-3 rounded-xl"><BarChart3 className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
          <Card className="border-2 border-slate-200 bg-gradient-to-br from-amber-50 to-amber-100"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-sm font-medium text-amber-700 mb-1">Pending Approval</div><div className="text-3xl font-bold text-amber-900">{analytics.pendingCount}</div></div>
              <div className="bg-amber-500 p-3 rounded-xl"><Timer className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
          <Card className="border-2 border-slate-200 bg-gradient-to-br from-emerald-50 to-emerald-100"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-sm font-medium text-emerald-700 mb-1">Approved</div><div className="text-3xl font-bold text-emerald-900">{analytics.approvedCount}</div></div>
              <div className="bg-emerald-500 p-3 rounded-xl"><CheckCircle2 className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
          <Card className="border-2 border-slate-200 bg-gradient-to-br from-indigo-50 to-indigo-100"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-sm font-medium text-indigo-700 mb-1">This Month</div><div className="text-3xl font-bold text-indigo-900">{analytics.thisMonthRequests}</div></div>
              <div className="bg-indigo-500 p-3 rounded-xl"><Activity className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
          <Card className="border-2 border-slate-200 bg-gradient-to-br from-teal-50 to-teal-100"><CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><div className="text-sm font-medium text-teal-700 mb-1">Work From Home</div><div className="text-3xl font-bold text-teal-900">{analytics.workFromHomeCount}</div></div>
              <div className="bg-teal-500 p-3 rounded-xl"><Briefcase className="w-6 h-6 text-white" /></div>
            </div>
          </CardContent></Card>
        </div>

        <Card className="border-2 border-slate-200 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-teal-600 p-2 rounded-lg"><UserCheck className="w-5 h-5 text-white" /></div>
                <div><h2 className="text-2xl font-bold text-slate-900">{targetUserId === authUser?.id ? "Your Leave Balance" : "Employee Leave Balance"}</h2><p className="text-slate-500 text-sm font-medium">Current status and upcoming accruals</p></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white border-2 border-teal-100 shadow-lg group hover:border-teal-300 transition-all"><CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-teal-50 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors"><Calendar className="w-6 h-6" /></div>
                  <Badge className="bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">Annual</Badge>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{leaveBalance?.annual || 0} <span className="text-sm font-medium text-slate-400">Days</span></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Total Balance</p>
                <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span className="text-teal-600">Used: {calculateLeaveBalance('annual').used}</span><span className="text-slate-400">Rem: {calculateLeaveBalance('annual').remaining}</span></div><Progress value={(calculateLeaveBalance('annual').used / 20) * 100} className="h-2 bg-teal-50" /></div>
              </CardContent></Card>
              <Card className="bg-white border-2 border-indigo-100 shadow-lg group hover:border-indigo-300 transition-all"><CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Award className="w-6 h-6" /></div>
                  <Badge className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Sick</Badge>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{leaveBalance?.sick || 0} <span className="text-sm font-medium text-slate-400">Days</span></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Available Days</p>
                <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span className="text-indigo-600">Used: {calculateLeaveBalance('sick').used}</span><span className="text-slate-400">Rem: {calculateLeaveBalance('sick').remaining}</span></div><Progress value={(calculateLeaveBalance('sick').used / 10) * 100} className="h-2 bg-indigo-50" /></div>
              </CardContent></Card>
              <Card className="bg-white border-2 border-purple-100 shadow-lg group hover:border-purple-300 transition-all"><CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Star className="w-6 h-6" /></div>
                  <Badge className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Personal</Badge>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{leaveBalance?.personal || 0} <span className="text-sm font-medium text-slate-400">Days</span></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Accrued Leaves</p>
                <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span className="text-purple-600">Used: {calculateLeaveBalance('personal').used}</span><span className="text-slate-400">Rem: {calculateLeaveBalance('personal').remaining}</span></div><Progress value={(calculateLeaveBalance('personal').used / 5) * 100} className="h-2 bg-purple-50" /></div>
              </CardContent></Card>
              <Card className="bg-white border-2 border-emerald-100 shadow-lg group hover:border-emerald-300 transition-all"><CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Clock className="w-6 h-6" /></div>
                  <Badge className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Monthly Quota</Badge>
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{calculateMonthlyPaidLeaveUsage(effectiveUser?.id || 0).remaining} <span className="text-sm font-medium text-slate-400">Remaining</span></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Of 1.5 Paid Leaves / Mo</p>
                <div className="space-y-2"><div className="flex justify-between text-xs font-bold"><span className="text-emerald-600">Used: {calculateMonthlyPaidLeaveUsage(effectiveUser?.id || 0).used}</span><span className="text-slate-400">Limit: 1.5</span></div><Progress value={(calculateMonthlyPaidLeaveUsage(effectiveUser?.id || 0).used / 1.5) * 100} className="h-2 bg-emerald-50" /></div>
              </CardContent></Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <TabsList className="bg-slate-100 p-1 rounded-xl w-fit">
                <TabsTrigger value="my-requests" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  {targetUserId === authUser?.id ? "My Requests" : "Requests"}
                  <Badge className="ml-2 bg-slate-200 text-slate-700">{filteredMyRequests.length}</Badge>
                </TabsTrigger>
                {(authUser?.role === 'admin' || authUser?.role === 'hr' || authUser?.role === 'manager') && targetUserId === authUser?.id && (
                  <TabsTrigger value="approvals" className="rounded-lg px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Pending Approvals
                    <Badge className="ml-2 bg-amber-100 text-amber-700">{filteredPendingRequests.length}</Badge>
                  </TabsTrigger>
                )}
              </TabsList>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search leaves..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-white border-2 border-slate-200 focus:border-teal-500 rounded-xl transition-all shadow-sm" />
              </div>
            </div>
            <TabsContent value="my-requests" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMyRequests.map((request, index) => (
                  <LeaveRequestCard key={request.id} request={request} index={index} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="approvals" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPendingRequests.map((request, index) => (
                  <LeaveRequestCard key={request.id} request={request} index={index} showEmployee />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
