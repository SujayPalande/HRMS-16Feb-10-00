import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ClipboardList, 
  Calendar, 
  Users, 
  TrendingUp, 
  Search, 
  FileSpreadsheet, 
  Building2, 
  ChevronRight, 
  ChevronDown, 
  FileDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber } from "@/lib/pdf-utils";
import { User, Department, Unit } from "@shared/schema";

export default function AttendanceReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

  const { data: units = [] } = useQuery<Unit[]>({ queryKey: ["/api/masters/units"] });
  const { data: employees = [] } = useQuery<User[]>({ queryKey: ["/api/employees"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: attendanceRecords = [] } = useQuery<any[]>({ queryKey: ["/api/attendance"] });
  const { data: leaveRequests = [] } = useQuery<any[]>({ queryKey: ["/api/leave-requests"] });

  const toggleEmployee = (empId: number) => {
    const newSet = new Set(expandedEmployees);
    if (newSet.has(empId)) newSet.delete(empId);
    else newSet.add(empId);
    setExpandedEmployees(newSet);
  };

  const getReportPeriod = () => {
    const date = new Date(selectedDate);
    let startDate, endDate;

    if (selectedPeriod === "day") {
      startDate = new Date(date.setHours(0, 0, 0, 0));
      endDate = new Date(date.setHours(23, 59, 59, 999));
    } else if (selectedPeriod === "week") {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(date.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (selectedPeriod === "month") {
      startDate = new Date(selectedYear, selectedMonth, 1);
      endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(date.getFullYear(), 0, 1);
      endDate = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    return { startDate, endDate };
  };

  const { startDate, endDate } = getReportPeriod();

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: User) => {
      const dept = departments.find(d => d.id === emp.departmentId);
      const matchesUnit = selectedUnit === 'all' || (dept && dept.unitId === parseInt(selectedUnit));
      const matchesDept = selectedDept === 'all' || emp.departmentId === parseInt(selectedDept);
      const empIdFormatted = `EMP${String(emp.id).padStart(3, '0')}`;
      const matchesSearch = searchQuery === "" || 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empIdFormatted.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesUnit && matchesDept && matchesSearch;
    });
  }, [employees, departments, selectedUnit, selectedDept, searchQuery]);

  const filteredDepartments = departments.filter((d: Department) => 
    (selectedUnit === "all" || d.unitId === parseInt(selectedUnit)) &&
    (selectedDept === "all" || d.id === parseInt(selectedDept))
  );

  const getDetailedAttendance = (userId: number) => {
    const userRecords = attendanceRecords.filter(r => {
      const d = new Date(r.date);
      return r.userId === userId && d >= startDate && d <= endDate;
    });
    return {
      present: userRecords.filter(r => r.status === 'present').length,
      absent: userRecords.filter(r => r.status === 'absent').length,
      halfday: userRecords.filter(r => r.status === 'halfday').length,
      late: userRecords.filter(r => r.status === 'late').length,
      total: userRecords.length
    };
  };

  const reportStats = [
    { title: "Total Employees", value: filteredEmployees.length.toString(), icon: <Users className="h-6 w-6" />, color: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
    { title: "Units", value: units.length.toString(), icon: <Building2 className="h-6 w-6" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "Departments", value: departments.length.toString(), icon: <ClipboardList className="h-6 w-6" />, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
    { title: "Present Today", value: attendanceRecords.filter(r => new Date(r.date).toDateString() === new Date().toDateString() && r.status === 'present').length.toString(), icon: <TrendingUp className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ];

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' }) as any;
      addWatermark(doc);
      addCompanyHeader(doc, { 
        title: "UNIT-WISE ATTENDANCE REPORT", 
        subtitle: `Period: MONTH (${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')})` 
      });
      const tableData = filteredEmployees.map(emp => {
        const stats = getDetailedAttendance(emp.id);
        const userLeaves = leaveRequests.filter((r: any) => {
          const start = new Date(r.startDate);
          return r.userId === emp.id && start >= startDate && start <= endDate && r.status === 'approved';
        });
        const totalLeaves = userLeaves.length;
        return [
          `EMP${String(emp.id).padStart(3, '0')}`,
          `${emp.firstName} ${emp.lastName}`,
          departments.find(d => d.id === emp.departmentId)?.name || '-',
          stats.present.toString(),
          stats.absent.toString(),
          totalLeaves.toString(),
          stats.halfday.toString(),
          stats.late.toString(),
          (stats.present + stats.halfday - totalLeaves).toString()
        ];
      });
      autoTable(doc, {
        head: [['Emp ID', 'Name', 'Department', 'Present', 'Absent', 'Leaves', 'Half Day', 'Late', 'Payable Days']],
        body: tableData,
        startY: 70,
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
        margin: { top: 70 }
      });
      addFooter(doc);
      const refNumber = generateReferenceNumber("ATT");
      addReferenceNumber(doc, refNumber, 68);
      addDocumentDate(doc, undefined, 68);
      doc.save(`attendance_report_${monthsList[selectedMonth]}_${selectedYear}.pdf`);
      toast({ title: "PDF Exported Successfully" });
    } catch (error) {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  const handleDownloadIndividualPDF = (emp: User) => {
    try {
      const doc = new jsPDF() as any;
      addWatermark(doc);
      addCompanyHeader(doc, { 
        title: "INDIVIDUAL ATTENDANCE REPORT", 
        subtitle: `${emp.firstName} ${emp.lastName} | ${monthsList[selectedMonth]} ${selectedYear}` 
      });
      const stats = getDetailedAttendance(emp.id);
      const userLeaves = leaveRequests.filter((r: any) => {
        const start = new Date(r.startDate);
        return r.userId === emp.id && start >= startDate && start <= endDate && r.status === 'approved';
      });
      const totalLeaves = userLeaves.length;
      autoTable(doc, {
        startY: 70,
        head: [['Field', 'Details']],
        body: [
          ['Employee Name', `${emp.firstName} ${emp.lastName}`],
          ['Employee ID', `EMP${String(emp.id).padStart(3, '0')}`],
          ['Department', departments.find(d => d.id === emp.departmentId)?.name || '-'],
          ['Present Days', stats.present.toString()],
          ['Absent Days', stats.absent.toString()],
          ['Leaves', totalLeaves.toString()],
          ['Half Days', stats.halfday.toString()],
          ['Late Arrivals', stats.late.toString()],
          ['Payable Days', (stats.present + stats.halfday - totalLeaves).toString()],
        ],
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
        theme: 'plain'
      });
      addFooter(doc);
      addHRSignature(doc, (doc as any).lastAutoTable?.finalY || 170);
      const refNumber = generateReferenceNumber("IND-ATT");
      addReferenceNumber(doc, refNumber, 68);
      addDocumentDate(doc, undefined, 68);
      doc.save(`attendance_${emp.firstName}_${emp.lastName}.pdf`);
    } catch (error) {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredEmployees.map(emp => {
      const stats = getDetailedAttendance(emp.id);
      const userRecords = attendanceRecords.filter((r: any) => {
        const d = new Date(r.date);
        return r.userId === emp.id && d >= startDate && d <= endDate;
      });
      const userLeaves = leaveRequests.filter((r: any) => {
        const start = new Date(r.startDate);
        return r.userId === emp.id && start >= startDate && start <= endDate && r.status === 'approved';
      });
      const totalLeaves = userLeaves.length;
      const latestRecord = userRecords.length > 0 ? userRecords[userRecords.length - 1] : null;
      return {
        'Employee ID': `EMP${String(emp.id).padStart(3, '0')}`,
        'Name': `${emp.firstName} ${emp.lastName}`,
        'Department': departments.find(d => d.id === emp.departmentId)?.name || '-',
        'Check-in Time': latestRecord?.checkInTime ? new Date(latestRecord.checkInTime).toLocaleTimeString() : '-',
        'Check-out Time': latestRecord?.checkOutTime ? new Date(latestRecord.checkOutTime).toLocaleTimeString() : '-',
        'Present Days': stats.present,
        'Absent Days': stats.absent,
        'Leaves': totalLeaves,
        'Half Days': stats.halfday,
        'Late Arrivals': stats.late,
        'Payable Days': (stats.present + stats.halfday - totalLeaves)
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `attendance_report_${monthsList[selectedMonth]}_${selectedYear}.xlsx`);
    toast({ title: "Excel Exported Successfully" });
  };

  const handleExportIndividualExcel = (emp: User) => {
    const stats = getDetailedAttendance(emp.id);
    const data = [{
      'Employee Name': `${emp.firstName} ${emp.lastName}`,
      'Employee ID': `EMP${String(emp.id).padStart(3, '0')}`,
      'Department': departments.find(d => d.id === emp.departmentId)?.name || '-',
      'Present Days': stats.present,
      'Absent Days': stats.absent,
      'Payable Days': stats.present + stats.halfday
    }];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `attendance_${emp.firstName}_${emp.lastName}.xlsx`);
    toast({ title: "Individual Excel Exported" });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Attendance Report</h1>
            <p className="text-slate-500 font-medium">Analysis of workforce presence and patterns</p>
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 h-9">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2 font-bold" onClick={handleExportPDF}>
                <FileDown className="h-3 w-3" /> PDF
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2 font-bold" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-3 w-3" /> Excel
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportStats.map((stat, index) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color} shadow-sm`}>{stat.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" /> Unit Hierarchy View
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredDepartments.map((dept) => {
              const deptEmployees = filteredEmployees.filter(e => e.departmentId === dept.id);
              if (deptEmployees.length === 0) return null;
              return (
                <div key={dept.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b flex justify-between items-center">
                    <span className="font-semibold">{dept.name}</span>
                    <Badge variant="secondary">{deptEmployees.length} Employees</Badge>
                  </div>
                  <div className="divide-y">
                    {deptEmployees.map(emp => {
                      const stats = getDetailedAttendance(emp.id);
                      const isExpanded = expandedEmployees.has(emp.id);
                      const empIdFormatted = `EMP${String(emp.id).padStart(3, '0')}`;
                      return (
                        <div key={emp.id}>
                          <button onClick={() => toggleEmployee(emp.id)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-teal-600" /> : <ChevronRight className="h-4 w-4" />}
                              <div className="text-left">
                                <p className="font-semibold">{emp.firstName} {emp.lastName}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-widest">{empIdFormatted} • {emp.position}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-emerald-600 border-emerald-100 font-bold">Present: {stats.present}</Badge>
                              <Badge variant="outline" className="text-rose-600 border-rose-100 font-bold">Absent: {stats.absent}</Badge>
                            </div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/40 p-5 border-t">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Present</p>
                                    <p className="text-xl font-black text-emerald-600">{stats.present}</p>
                                  </div>
                                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Absent</p>
                                    <p className="text-xl font-black text-rose-600">{stats.absent}</p>
                                  </div>
                                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Half Day</p>
                                    <p className="text-xl font-black text-amber-600">{stats.halfday}</p>
                                  </div>
                                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Late</p>
                                    <p className="text-xl font-black text-blue-600">{stats.late}</p>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                  <Button variant="outline" size="sm" className="h-8 font-bold gap-2" onClick={() => handleDownloadIndividualPDF(emp)}><FileDown className="h-3.5 w-3.5" /> PDF</Button>
                                  <Button variant="outline" size="sm" className="h-8 font-bold gap-2" onClick={() => handleExportIndividualExcel(emp)}><FileSpreadsheet className="h-3.5 w-3.5" /> Excel</Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
