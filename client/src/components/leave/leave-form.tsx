import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LeaveRequest } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { addDays, format, differenceInCalendarDays, eachDayOfInterval, isWeekend, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  FileText, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle2,
  AlertCircle,
  Target,
  Star,
  PlusCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface LeaveFormProps {
  leaveRequest?: LeaveRequest;
  onSuccess: () => void;
}

export function LeaveForm({ leaveRequest, onSuccess }: LeaveFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!leaveRequest;

  // Fetch user's leave requests for paid/unpaid calculations
  const { data: myLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests", { userId: user?.id }],
    enabled: !!user,
  });
  
  // Create form schema with proper Zod enum
  const formSchema = z.object({
    type: z.enum(['annual', 'sick', 'personal', 'halfday', 'unpaid', 'other', 'workfromhome'], {
      required_error: "Leave type is required",
    }),
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    reason: z.string().min(1, "Reason is required"),
  }).refine((data) => {
    if (data.type === 'halfday') {
      return data.endDate.getTime() === data.startDate.getTime();
    }
    return data.endDate >= data.startDate;
  }, {
    message: "End date cannot be before start date",
    path: ["endDate"],
  }).refine((data) => {
    if (data.type === 'halfday') {
      return data.endDate.getTime() === data.startDate.getTime();
    }
    return true;
  }, {
    message: "For half day leave, start date and end date must be the same",
    path: ["endDate"],
  });
  
  type FormValues = z.infer<typeof formSchema>;
  
  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: leaveRequest?.type || "annual",
      startDate: leaveRequest ? new Date(leaveRequest.startDate) : new Date(),
      endDate: leaveRequest ? new Date(leaveRequest.endDate) : addDays(new Date(), 1),
      reason: leaveRequest?.reason || "",
    },
  });
  
  // Watch for form values
  const leaveType = form.watch("type");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  
  // Auto-set end date to match start date for half-day leave
  React.useEffect(() => {
    if (leaveType === 'halfday' && startDate) {
      form.setValue('endDate', startDate);
    }
  }, [leaveType, startDate, form]);
  
  const calculateBusinessDays = (start: Date, end: Date): number => {
    if (!start || !end || end < start) return 0;
    
    // For half-day leave, always return 0.5
    if (leaveType === 'halfday') return 0.5;
    
    // Get all days in the range
    const allDays = eachDayOfInterval({ start, end });
    
    // Filter out weekends (Saturday = 6, Sunday = 0)
    const businessDays = allDays.filter(day => !isWeekend(day));
    
    return businessDays.length;
  };
  
  const numDays = calculateBusinessDays(startDate, endDate);

  // Calculate monthly paid leave usage for 1.5 paid leaves per month policy
  const calculateMonthlyPaidLeaveUsage = (userId: number, targetMonth?: Date) => {
    const month = targetMonth || new Date();
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    // Types that count toward paid leave quota (exclude unpaid and workfromhome)
    const paidLeaveTypes = ['annual', 'sick', 'personal', 'halfday', 'other'];
    
    const monthlyPaidLeaveUsed = myLeaveRequests
      .filter((request: LeaveRequest) => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        // Check if request overlaps with target month
        const hasOverlap = requestStart <= monthEnd && requestEnd >= monthStart;
        const isApproved = request.status === "approved";
        const isPaidType = paidLeaveTypes.includes(request.type);
        const isUserRequest = request.userId === userId;
        
        return hasOverlap && isApproved && isPaidType && isUserRequest;
      })
      .reduce((total: number, request: LeaveRequest) => {
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        
        if (request.type === "halfday") {
          // Half day leave - only count if it falls within the month and not on weekend
          if (requestStart >= monthStart && requestStart <= monthEnd && !isWeekend(requestStart)) {
            return total + 0.5;
          }
          return total;
        } else {
          // Clip the request interval to the month boundaries
          const clippedStart = new Date(Math.max(requestStart.getTime(), monthStart.getTime()));
          const clippedEnd = new Date(Math.min(requestEnd.getTime(), monthEnd.getTime()));
          
          if (clippedStart <= clippedEnd) {
            const allDays = eachDayOfInterval({ start: clippedStart, end: clippedEnd });
            const businessDays = allDays.filter(day => !isWeekend(day));
            return total + businessDays.length;
          }
          return total;
        }
      }, 0);
    
    const monthlyLimit = 1.5;
    const remaining = Math.max(0, monthlyLimit - monthlyPaidLeaveUsed);
    
    return {
      used: monthlyPaidLeaveUsed,
      limit: monthlyLimit,
      remaining: remaining,
      canTakePaidLeave: remaining > 0
    };
  };

  // Check if a specific leave request would exceed monthly paid leave limit
  const wouldExceedPaidLeaveLimit = (userId: number, startDate: Date, endDate: Date, leaveType: string) => {
    // If it's already an unpaid leave type, it won't affect the limit
    if (leaveType === 'unpaid' || leaveType === 'workfromhome') {
      return { 
        wouldExceed: false, 
        willBePaid: false,
        perMonthAnalysis: []
      };
    }
    
    // Get all months spanned by this request
    const monthsSpanned: Date[] = [];
    const currentMonth = startOfMonth(startDate);
    let checkMonth = currentMonth;
    
    while (checkMonth <= endOfMonth(endDate)) {
      monthsSpanned.push(new Date(checkMonth));
      checkMonth = startOfMonth(new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 1));
    }
    
    // Analyze each month
    const perMonthAnalysis = monthsSpanned.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const currentUsage = calculateMonthlyPaidLeaveUsage(userId, month);
      
      // Calculate days for this request within this specific month
      let requestDaysInMonth = 0;
      if (leaveType === "halfday") {
        // Half day leave - only count if it falls within the month and not on weekend
        if (startDate >= monthStart && startDate <= monthEnd && !isWeekend(startDate)) {
          requestDaysInMonth = 0.5;
        }
      } else {
        // Clip the request interval to the month boundaries
        const clippedStart = new Date(Math.max(startDate.getTime(), monthStart.getTime()));
        const clippedEnd = new Date(Math.min(endDate.getTime(), monthEnd.getTime()));
        
        if (clippedStart <= clippedEnd) {
          const allDays = eachDayOfInterval({ start: clippedStart, end: clippedEnd });
          const businessDays = allDays.filter(day => !isWeekend(day));
          requestDaysInMonth = businessDays.length;
        }
      }
      
      const wouldExceedInThisMonth = (currentUsage.used + requestDaysInMonth) > currentUsage.limit;
      const exceedDaysInThisMonth = Math.max(0, requestDaysInMonth - currentUsage.remaining);
      
      return {
        month,
        monthName: format(month, 'MMM yyyy'),
        currentUsed: currentUsage.used,
        requestDaysInMonth,
        monthlyLimit: currentUsage.limit,
        remaining: currentUsage.remaining,
        wouldExceed: wouldExceedInThisMonth,
        exceedDays: exceedDaysInThisMonth
      };
    });
    
    // Overall determination
    const anyMonthExceeds = perMonthAnalysis.some(analysis => analysis.wouldExceed);
    const totalRequestDays = perMonthAnalysis.reduce((sum, analysis) => sum + analysis.requestDaysInMonth, 0);
    
    return {
      wouldExceed: anyMonthExceeds,
      willBePaid: !anyMonthExceeds,
      totalRequestDays,
      perMonthAnalysis
    };
  };

  // Calculate paid/unpaid status for current form values
  const paidUnpaidAnalysis = React.useMemo(() => {
    if (!user?.id || !startDate || !endDate || leaveType === 'unpaid' || leaveType === 'workfromhome') {
      return null;
    }
    
    return wouldExceedPaidLeaveLimit(user.id, startDate, endDate, leaveType);
  }, [user?.id, startDate, endDate, leaveType, myLeaveRequests]);
  
  // Create or update leave request mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues | any) => {
      if (isEditing) {
        return await apiRequest(
          "PUT", 
          `/api/leave-requests/${leaveRequest.id}`, 
          values
        );
      } else {
        return await apiRequest(
          "POST", 
          "/api/leave-requests", 
          {
            ...values,
            userId: user?.id,
            status: "pending",
          }
        );
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Leave request updated" : "Leave request submitted",
        description: isEditing 
          ? "Your leave request has been updated successfully." 
          : "Your leave request has been submitted for approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      // Invalidate leave balance for the current user since new/updated requests affect balance
      queryClient.invalidateQueries({ queryKey: ["/api/employees/leave-balance"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: FormValues) => {
    // Convert dates to ISO strings for the API
    let formattedValues = {
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };

    // Automatically set to 'unpaid' if monthly limit would be exceeded
    if (user?.id && values.type !== 'unpaid' && values.type !== 'workfromhome') {
      const analysis = wouldExceedPaidLeaveLimit(
        user.id,
        values.startDate,
        values.endDate,
        values.type
      );
      
      if (analysis.wouldExceed) {
        formattedValues = {
          ...formattedValues,
          type: 'unpaid'
        };
        
        // Show a toast notification about the automatic change
        toast({
          title: "Leave type changed to Unpaid",
          description: "Your request exceeds the monthly paid leave limit (1.5 days/month) and has been automatically set to unpaid.",
          variant: "default",
        });
      }
    }

    mutation.mutate(formattedValues);
  };

  // Get leave type icon and color
  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case 'annual': return { icon: CalendarIcon, color: 'text-blue-600 bg-blue-100' };
      case 'sick': return { icon: Target, color: 'text-red-600 bg-red-100' };
      case 'personal': return { icon: Star, color: 'text-purple-600 bg-purple-100' };
      case 'halfday': return { icon: Clock, color: 'text-orange-600 bg-orange-100' };
      case 'unpaid': return { icon: AlertCircle, color: 'text-gray-600 bg-gray-100' };
      case 'workfromhome': return { icon: User, color: 'text-green-600 bg-green-100' };
      case 'other': return { icon: FileText, color: 'text-indigo-600 bg-indigo-100' };
      default: return { icon: FileText, color: 'text-slate-600 bg-slate-100' };
    }
  };

  const leaveTypeInfo = getLeaveTypeIcon(leaveType);
  const IconComponent = leaveTypeInfo.icon;

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-teal-100 to-emerald-200 w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
            >
              <PlusCircle className="w-10 h-10 text-teal-700" />
            </motion.div>
            
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {isEditing ? 'Update Leave Request' : 'Apply for Leave'}
              </h2>
              <p className="text-slate-600 text-lg mt-2">
                {isEditing ? 'Modify your existing leave request' : 'Submit a new leave request for approval'}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Leave Type Section */}
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className={cn("p-3 rounded-xl shadow-md", leaveTypeInfo.color)}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Leave Type & Duration</h3>
                      <p className="text-slate-600">Select the type of leave you want to apply for</p>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-800">Leave Type *</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 text-base border-2 border-slate-200 hover:border-teal-300 focus:border-teal-500 transition-all duration-200 bg-white shadow-sm">
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="border-2 border-slate-200 shadow-xl">
                            <SelectItem value="annual" className="text-base py-3 hover:bg-blue-50">
                              <div className="flex items-center space-x-3">
                                <CalendarIcon className="w-4 h-4 text-blue-600" />
                                <span>Annual Leave</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="sick" className="text-base py-3 hover:bg-red-50">
                              <div className="flex items-center space-x-3">
                                <Target className="w-4 h-4 text-red-600" />
                                <span>Sick Leave</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="personal" className="text-base py-3 hover:bg-purple-50">
                              <div className="flex items-center space-x-3">
                                <Star className="w-4 h-4 text-purple-600" />
                                <span>Personal Leave</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="halfday" className="text-base py-3 hover:bg-orange-50">
                              <div className="flex items-center space-x-3">
                                <Clock className="w-4 h-4 text-orange-600" />
                                <span>Half Day Leave</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="unpaid" className="text-base py-3 hover:bg-gray-50">
                              <div className="flex items-center space-x-3">
                                <AlertCircle className="w-4 h-4 text-gray-600" />
                                <span>Unpaid Leave</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="workfromhome" className="text-base py-3 hover:bg-green-50">
                              <div className="flex items-center space-x-3">
                                <User className="w-4 h-4 text-green-600" />
                                <span>Work From Home</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="other" className="text-base py-3 hover:bg-indigo-50">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <span>Other</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-600 font-medium" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date Selection Section */}
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-3 rounded-xl shadow-md">
                      <CalendarIcon className="w-6 h-6 text-teal-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Date Selection</h3>
                      <p className="text-slate-600">Choose your leave start and end dates</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-base font-semibold text-slate-800 mb-2">Start Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "h-14 pl-4 text-left font-medium text-base border-2 border-slate-200 hover:border-teal-300 focus:border-teal-500 transition-all duration-200 bg-white shadow-sm",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    <div className="flex items-center space-x-2">
                                      <CalendarIcon className="w-4 h-4 text-teal-600" />
                                      <span>{format(field.value, "PPP")}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                                      <span>Select start date</span>
                                    </div>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-2 border-slate-200 shadow-xl" align="start" side="bottom">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className="rounded-md border-0"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-base font-semibold text-slate-800 mb-2">End Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "h-14 pl-4 text-left font-medium text-base border-2 border-slate-200 hover:border-teal-300 focus:border-teal-500 transition-all duration-200 bg-white shadow-sm",
                                    !field.value && "text-muted-foreground"
                                  )}
                                  disabled={leaveType === 'halfday'}
                                >
                                  {field.value ? (
                                    <div className="flex items-center space-x-2">
                                      <CalendarIcon className="w-4 h-4 text-teal-600" />
                                      <span>{format(field.value, "PPP")}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                                      <span>Select end date</span>
                                    </div>
                                  )}
                                  {leaveType === 'halfday' && (
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                      Auto-filled
                                    </Badge>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-2 border-slate-200 shadow-xl" align="start" side="bottom">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  if (leaveType === 'halfday') {
                                    return date.getTime() !== startDate?.getTime();
                                  }
                                  return date < startDate || date < new Date();
                                }}
                                initialFocus
                                className="rounded-md border-0"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-red-600 font-medium" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Duration Display */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-6 rounded-xl border-2 border-emerald-200 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-2 rounded-lg">
                          <Clock className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-emerald-900">
                            Duration: {leaveType === 'halfday' ? 'Half day' : `${numDays} working day${numDays !== 1 ? 's' : ''}`}
                          </p>
                          <p className="text-sm text-emerald-700">
                            {leaveType === 'halfday' ? 'Single half-day leave' : 'Weekends excluded from calculation'}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="bg-emerald-100 text-emerald-800 border-emerald-300 text-base px-3 py-1 font-semibold"
                      >
                        {leaveType === 'halfday' ? '0.5 days' : `${numDays} days`}
                      </Badge>
                    </div>
                  </motion.div>

                  {/* Paid/Unpaid Status Display */}
                  {paidUnpaidAnalysis && leaveType !== 'unpaid' && leaveType !== 'workfromhome' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={cn(
                        "p-6 rounded-xl border-2 shadow-md",
                        paidUnpaidAnalysis.willBePaid 
                          ? "bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-blue-200" 
                          : "bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-200"
                      )}
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              paidUnpaidAnalysis.willBePaid 
                                ? "bg-gradient-to-br from-blue-100 to-blue-200" 
                                : "bg-gradient-to-br from-amber-100 to-amber-200"
                            )}>
                              {paidUnpaidAnalysis.willBePaid ? (
                                <CheckCircle2 className="w-5 h-5 text-blue-700" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-amber-700" />
                              )}
                            </div>
                            <div>
                              <p className={cn(
                                "text-base font-semibold",
                                paidUnpaidAnalysis.willBePaid ? "text-blue-900" : "text-amber-900"
                              )}>
                                {paidUnpaidAnalysis.willBePaid ? "Paid Leave" : "Unpaid Leave"}
                              </p>
                              <p className={cn(
                                "text-sm",
                                paidUnpaidAnalysis.willBePaid ? "text-blue-700" : "text-amber-700"
                              )}>
                                {paidUnpaidAnalysis.willBePaid 
                                  ? "This leave is within your monthly paid leave allowance" 
                                  : "This leave exceeds your monthly paid leave limit (1.5 days/month)"}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-base px-3 py-1 font-semibold",
                              paidUnpaidAnalysis.willBePaid 
                                ? "bg-blue-100 text-blue-800 border-blue-300" 
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            )}
                          >
                            {paidUnpaidAnalysis.willBePaid ? "PAID" : "UNPAID"}
                          </Badge>
                        </div>

                        {/* Monthly Breakdown */}
                        {paidUnpaidAnalysis.perMonthAnalysis.length > 0 && (
                          <div className="space-y-2">
                            <h4 className={cn(
                              "text-sm font-semibold",
                              paidUnpaidAnalysis.willBePaid ? "text-blue-800" : "text-amber-800"
                            )}>
                              Monthly Usage:
                            </h4>
                            {paidUnpaidAnalysis.perMonthAnalysis.map((monthAnalysis, index) => (
                              <div key={index} className={cn(
                                "flex items-center justify-between p-3 rounded-lg text-sm",
                                paidUnpaidAnalysis.willBePaid ? "bg-blue-50" : "bg-amber-50"
                              )}>
                                <span className={cn(
                                  "font-medium",
                                  paidUnpaidAnalysis.willBePaid ? "text-blue-800" : "text-amber-800"
                                )}>
                                  {monthAnalysis.monthName}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <span className={cn(
                                    "text-xs",
                                    paidUnpaidAnalysis.willBePaid ? "text-blue-600" : "text-amber-600"
                                  )}>
                                    {monthAnalysis.currentUsed + monthAnalysis.requestDaysInMonth}/{monthAnalysis.monthlyLimit} days
                                  </span>
                                  {monthAnalysis.wouldExceed && (
                                    <Badge variant="destructive" className="text-xs">
                                      Exceeds by {monthAnalysis.exceedDays}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Special message for unpaid/work from home */}
                  {(leaveType === 'unpaid' || leaveType === 'workfromhome') && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 p-6 rounded-xl border-2 border-gray-200 shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-2 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-gray-700" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {leaveType === 'unpaid' ? 'Unpaid Leave' : 'Work From Home'}
                          </p>
                          <p className="text-sm text-gray-700">
                            {leaveType === 'unpaid' 
                              ? 'This leave type does not count toward your paid leave allowance' 
                              : 'Work from home requests do not affect your paid leave balance'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reason Section */}
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-3 rounded-xl shadow-md">
                      <FileText className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Leave Details</h3>
                      <p className="text-slate-600">Provide additional information about your leave</p>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold text-slate-800">Reason for Leave *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a detailed reason for your leave request. This helps managers understand the context and make informed decisions." 
                            {...field} 
                            className="resize-none text-base min-h-[120px] border-2 border-slate-200 hover:border-teal-300 focus:border-teal-500 transition-all duration-200 bg-white shadow-sm p-4"
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 font-medium" />
                        <p className="text-sm text-slate-500 mt-2">
                          {field.value?.length || 0} characters
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-br from-white via-slate-50 to-white">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-3 rounded-xl">
                      <CheckCircle2 className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Review & Submit</h3>
                      <p className="text-slate-600">Double-check your details before submitting</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col-reverse lg:flex-row gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onSuccess}
                      className="h-12 px-8 text-base font-semibold border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-teal-600 via-teal-600 to-emerald-600 hover:from-teal-700 hover:via-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white"
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      {isEditing ? "Update Request" : "Submit Request"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
