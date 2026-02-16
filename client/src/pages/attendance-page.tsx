import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { CheckButton } from "@/components/attendance/check-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { 
  Clock, CheckCircle2, XCircle, Users, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Activity, Clock4, UserCheck, 
  FileDown, FileSpreadsheet, FileText, LayoutDashboard, History,
  TrendingUp, Timer, AlertCircle, BarChart3, Target, ArrowRight,
  Search, Filter
} from "lucide-react";
import { Attendance, User, LeaveRequest } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function AttendancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const initialEmployeeId = searchParams.get('id');

  const { data: myAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", { userId: user?.id }],
    enabled: !!user,
  });
  
  const { data: dateAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance", { date: format(selectedDate, 'yyyy-MM-dd') }],
    enabled: !!user && ['admin', 'hr', 'manager'].includes(user.role),
  });
  
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: !!user && ['admin', 'hr', 'manager'].includes(user.role),
  });

  const { data: allLeaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
    enabled: !!user && ['admin', 'hr', 'manager'].includes(user.role),
  });

  const isEmployeeOnLeave = (employeeId: number, date: Date): boolean => {
    return allLeaveRequests.some(request => {
      if (request.userId !== employeeId || request.status !== 'approved') return false;
      const start = new Date(request.startDate);
      const end = new Date(request.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    });
  };

  const getDayStatus = (date: Date, attendance: Attendance[]) => {
    const record = attendance.find(r => r.date && isSameDay(new Date(r.date), date));
    if (record) return record.status;
    if (isEmployeeOnLeave(user?.id || 0, date)) return 'on leave';
    if (date > new Date()) return 'upcoming';
    return 'absent';
  };

  const allEmployeeAttendanceData = employees.map(employee => {
    const attendanceRecord = dateAttendance.find(record => record.userId === employee.id);
    const onLeave = isEmployeeOnLeave(employee.id, selectedDate);
    let status: string;
    if (onLeave) status = 'on leave';
    else if (attendanceRecord?.checkInTime) status = attendanceRecord.status || 'present';
    else status = 'absent';
    
    return {
      id: attendanceRecord?.id || 0,
      userId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      checkInTime: attendanceRecord?.checkInTime || null,
      checkOutTime: attendanceRecord?.checkOutTime || null,
      status,
    };
  });

  const filteredAttendanceData = allEmployeeAttendanceData.filter(record => 
    record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayRecord = myAttendance.find(r => r.date && isToday(new Date(r.date)));

  const stats = [
    { label: "Today's Status", value: todayRecord?.status || "Absent", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Check In Time", value: todayRecord?.checkInTime ? format(new Date(todayRecord.checkInTime), 'hh:mm a') : "--:--", icon: Clock, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Check Out Time", value: todayRecord?.checkOutTime ? format(new Date(todayRecord.checkOutTime), 'hh:mm a') : "--:--", icon: Clock4, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
    { label: "Work Hours", value: "8.5h", icon: Timer, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
  ];

  const teamStats = [
    { label: "Present Today", value: allEmployeeAttendanceData.filter(d => d.status === 'present').length, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-50/50", border: "border-emerald-200/50" },
    { label: "Absent Today", value: allEmployeeAttendanceData.filter(d => d.status === 'absent').length, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50/50", border: "border-rose-200/50" },
    { label: "Half Day", value: allEmployeeAttendanceData.filter(d => d.status === 'halfday').length, icon: Clock4, color: "text-orange-500", bg: "bg-orange-50/50", border: "border-orange-200/50" },
    { label: "On Leave", value: allEmployeeAttendanceData.filter(d => d.status === 'on leave').length, icon: CalendarIcon, color: "text-amber-500", bg: "bg-amber-50/50", border: "border-amber-200/50" },
    { label: "Total Team", value: employees.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50/50", border: "border-blue-200/50" },
  ];

  const adminColumns: ColumnDef<any>[] = [
    { 
      accessorKey: "employeeName", 
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
            {row.original.employeeName.charAt(0)}
          </div>
          <span className="font-medium text-slate-700">{row.original.employeeName}</span>
        </div>
      )
    },
    { 
      accessorKey: "checkInTime", 
      header: "Check In", 
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          {row.original.checkInTime ? format(new Date(row.original.checkInTime), 'hh:mm a') : 'N/A'}
        </div>
      )
    },
    { 
      accessorKey: "checkOutTime", 
      header: "Check Out", 
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-slate-600">
          <LogOut className="h-3.5 w-3.5 text-slate-400" />
          {row.original.checkOutTime ? format(new Date(row.original.checkOutTime), 'hh:mm a') : 'N/A'}
        </div>
      )
    },
    { 
      accessorKey: "status", 
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variants: Record<string, string> = {
          present: "bg-emerald-50 text-emerald-600 border-emerald-100",
          absent: "bg-rose-50 text-rose-600 border-rose-100",
          halfday: "bg-orange-50 text-orange-600 border-orange-100",
          'on leave': "bg-amber-50 text-amber-600 border-amber-100"
        };
        return (
          <Badge variant="outline" className={cn("capitalize px-2 py-0.5 rounded-full font-medium", variants[status] || "bg-slate-50")}>
            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", 
              status === 'present' ? "bg-emerald-500" :
              status === 'absent' ? "bg-rose-500" :
              status === 'halfday' ? "bg-orange-500" : "bg-amber-500"
            )} />
            {status}
          </Badge>
        );
      }
    }
  ];

  return (
    <AppLayout>
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        {/* Modern Executive Header */}
        <header className="bg-[#0f172a] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-emerald-600/10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-8 py-14 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-2xl backdrop-blur-sm border border-blue-500/30">
                    <LayoutDashboard className="h-7 w-7 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                      Attendance Management
                    </h1>
                    <p className="text-slate-400 font-medium mt-1">Enterprise workforce monitoring & productivity analytics</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-6 bg-slate-800/40 backdrop-blur-md p-5 rounded-3xl border border-slate-700/50 shadow-2xl"
              >
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Live Status</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className={cn("w-2 h-2 rounded-full animate-pulse", todayRecord ? "bg-emerald-500" : "bg-rose-500")} />
                    <p className="text-lg font-bold tracking-tight">{todayRecord ? "Checked In" : "Awaiting Check-in"}</p>
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-700" />
                <CheckButton currentAttendance={todayRecord} />
              </motion.div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-8 -mt-8 relative z-20">
          <Tabs defaultValue="my-attendance" className="w-full space-y-8">
            <div className="flex justify-center">
              <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border shadow-xl flex gap-1">
                <TabsList className="bg-transparent h-12 gap-1">
                  <TabsTrigger 
                    value="my-attendance" 
                    className="data-[state=active]:bg-[#0f172a] data-[state=active]:text-white rounded-xl px-8 font-bold transition-all duration-300"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Personal Portal
                  </TabsTrigger>
                  {['admin', 'hr', 'manager'].includes(user?.role || '') && (
                    <TabsTrigger 
                      value="team-overview" 
                      className="data-[state=active]:bg-[#0f172a] data-[state=active]:text-white rounded-xl px-8 font-bold transition-all duration-300"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Executive Overview
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="my-attendance" className="space-y-8 mt-0 focus-visible:outline-none">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  {stats.map((stat, i) => (
                    <Card key={i} className={cn("border shadow-sm hover-elevate transition-all duration-300 overflow-visible group", stat.border)}>
                      <CardContent className="p-6 flex items-center gap-5">
                        <div className={cn("p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110", stat.bg)}>
                          <stat.icon className={cn("h-7 w-7", stat.color)} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                          <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-0 border-b-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                              <CalendarIcon className="h-6 w-6 text-blue-500" />
                            </div>
                            Attendance Calendar
                          </CardTitle>
                          <p className="text-slate-500 font-medium mt-1">Visualize your presence patterns and history</p>
                        </div>
                        <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border">
                          <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}>
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <div className="px-4 flex items-center font-bold text-slate-700 min-w-[120px] justify-center">
                            {format(currentMonth, 'MMM yyyy')}
                          </div>
                          <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}>
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-7 gap-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pb-4">{d}</div>
                        ))}
                        {eachDayOfInterval({ 
                          start: startOfWeek(startOfMonth(currentMonth)), 
                          end: endOfWeek(endOfMonth(currentMonth)) 
                        }).map((date, i) => {
                          const isCurrentMonth = isSameDay(startOfMonth(date), startOfMonth(currentMonth));
                          const status = getDayStatus(date, myAttendance);
                          const isTodayDate = isToday(date);
                          const isSelected = isSameDay(date, selectedDate);
                          
                          return (
                            <motion.div 
                              key={i} 
                              whileHover={{ scale: 1.05 }}
                              className={cn(
                                "aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer border group",
                                !isCurrentMonth ? "bg-slate-50/30 border-transparent opacity-30 pointer-events-none" : "bg-white border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md",
                                isTodayDate && "border-blue-500 bg-blue-50/30",
                                isSelected && "ring-2 ring-offset-2 ring-blue-600 scale-105 shadow-xl z-10"
                              )}
                              onClick={() => setSelectedDate(date)}
                            >
                              <span className={cn(
                                "text-sm font-black",
                                isTodayDate ? "text-blue-600" : "text-slate-700",
                                !isCurrentMonth && "text-slate-300"
                              )}>
                                {format(date, 'd')}
                              </span>
                              {isCurrentMonth && status !== 'upcoming' && (
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full mt-1.5",
                                  status === 'present' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                  status === 'halfday' ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" :
                                  status === 'on leave' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                )} />
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-8">
                    <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                      <CardHeader className="p-6 border-b-0">
                        <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-emerald-500" />
                          </div>
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-3">
                        {myAttendance.slice(0, 4).map((record, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                record.status === 'present' ? "bg-emerald-50" : "bg-rose-50"
                              )}>
                                {record.status === 'present' ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-rose-500" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{record.date ? format(new Date(record.date), 'MMM dd, yyyy') : 'N/A'}</p>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : 'No record'}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Target className="h-32 w-32" />
                      </div>
                      <CardContent className="p-8 relative z-10">
                        <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">Monthly Target</p>
                        <h3 className="text-3xl font-black mb-6">Attendance Goal</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Progress</span>
                            <span>{Math.round((myAttendance.filter(r => r.status === 'present').length / 22) * 100)}%</span>
                          </div>
                          <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(myAttendance.filter(r => r.status === 'present').length / 22) * 100}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            />
                          </div>
                          <p className="text-blue-100 text-xs font-medium">Keep up the good work! You are on track for this month's target.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="lg:col-span-3 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                      <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                          <History className="h-6 w-6 text-indigo-500" />
                        </div>
                        Comprehensive Logs
                      </CardTitle>
                      <p className="text-slate-500 font-medium mt-1">Detailed history of every clocking event</p>
                    </CardHeader>
                    <CardContent className="p-8">
                      <DataTable 
                        columns={[
                          { accessorKey: "date", header: "Log Date", cell: ({ row }) => row.original.date ? format(new Date(row.original.date), 'EEEE, MMM dd, yyyy') : 'N/A' },
                          { 
                            accessorKey: "checkInTime", 
                            header: "In Time", 
                            cell: ({ row }) => (
                              <div className="flex items-center gap-2 font-bold text-emerald-600">
                                <Clock className="h-4 w-4" />
                                {row.original.checkInTime ? format(new Date(row.original.checkInTime), 'hh:mm a') : 'N/A'}
                              </div>
                            )
                          },
                          { 
                            accessorKey: "checkOutTime", 
                            header: "Out Time", 
                            cell: ({ row }) => (
                              <div className="flex items-center gap-2 font-bold text-slate-400">
                                <LogOut className="h-4 w-4" />
                                {row.original.checkOutTime ? format(new Date(row.original.checkOutTime), 'hh:mm a') : 'N/A'}
                              </div>
                            )
                          },
                          { 
                            accessorKey: "status", 
                            header: "Final Status", 
                            cell: ({ row }) => {
                              const status = row.original.status;
                              return (
                                <Badge className={cn("capitalize px-3 py-1 rounded-lg border-0 font-bold",
                                  status === 'present' ? "bg-emerald-500/10 text-emerald-600" :
                                  status === 'absent' ? "bg-rose-500/10 text-rose-600" :
                                  status === 'halfday' ? "bg-orange-500/10 text-orange-600" : "bg-amber-500/10 text-amber-600"
                                )}>
                                  {status}
                                </Badge>
                              );
                            }
                          }
                        ]} 
                        data={myAttendance} 
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="team-overview" className="space-y-8 mt-0 focus-visible:outline-none">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
                >
                  {teamStats.map((stat, i) => (
                    <Card key={i} className={cn("border-none shadow-lg bg-white rounded-3xl group transition-all duration-300 hover:shadow-2xl overflow-visible", stat.border)}>
                      <CardContent className="p-6 text-center space-y-3">
                        <div className={cn("w-14 h-14 rounded-2xl mx-auto flex items-center justify-center transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110", stat.bg)}>
                          <stat.icon className={cn("h-7 w-7", stat.color)} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                          <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="space-y-8">
                    <Card className="border-none shadow-xl bg-[#0f172a] text-white rounded-[2rem] overflow-hidden">
                      <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black">Control Panel</CardTitle>
                        <p className="text-slate-400 text-sm font-medium">Filter team records by date and year</p>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Month Selector</label>
                            <Select defaultValue={format(selectedDate, 'MMMM')}>
                              <SelectTrigger className="bg-slate-800 border-slate-700 h-12 rounded-xl text-white font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                  <SelectItem key={m} value={m} className="focus:bg-slate-800 focus:text-white">{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fiscal Year</label>
                            <Select defaultValue="2026">
                              <SelectTrigger className="bg-slate-800 border-slate-700 h-12 rounded-xl text-white font-bold"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="2026" className="focus:bg-slate-800 focus:text-white">FY 2026-27</SelectItem>
                                <SelectItem value="2025" className="focus:bg-slate-800 focus:text-white">FY 2025-26</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-black tracking-tight shadow-xl shadow-blue-900/20">
                          <Filter className="h-4 w-4 mr-2" />
                          Apply Filters
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                      <CardHeader className="p-8 flex flex-row items-center justify-between border-b-0">
                        <div>
                          <CardTitle className="text-xl font-black text-slate-900">{format(selectedDate, 'MMM dd, yyyy')}</CardTitle>
                          <p className="text-sm text-slate-500 font-medium">Daily productivity metric</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-emerald-500" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 space-y-8">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-4xl font-black text-slate-900 leading-none">
                              {Math.round((allEmployeeAttendanceData.filter(d => d.status === 'present').length / employees.length) * 100) || 0}%
                            </p>
                            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Attendance Rate</p>
                          </div>
                          <BarChart3 className="h-12 w-12 text-slate-100" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Checked In</p>
                            <p className="text-2xl font-black text-blue-600">{allEmployeeAttendanceData.filter(d => d.status === 'present').length}</p>
                          </div>
                          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absent</p>
                            <p className="text-2xl font-black text-rose-600">{allEmployeeAttendanceData.filter(d => d.status === 'absent').length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-500" />
                          </div>
                          Team Roster
                        </CardTitle>
                        <p className="text-slate-500 font-medium mt-1">Real-time presence tracking of all members</p>
                      </div>
                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          placeholder="Search talent..." 
                          className="pl-11 h-11 bg-slate-50 border-slate-200 rounded-xl font-medium focus:ring-blue-500"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <DataTable columns={adminColumns} data={filteredAttendanceData} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  );
}

function LogOut(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}
