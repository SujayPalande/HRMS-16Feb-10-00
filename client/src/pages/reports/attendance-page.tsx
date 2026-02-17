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
  FileText,
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
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // day, week, month, year
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`);
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
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    } else { // year
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
      const matchesSearch = searchQuery === "" || 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employeeId || "").toLowerCase().includes(searchQuery.toLowerCase());
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
        subtitle: `Period: ${selectedPeriod.toUpperCase()} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}) | Unit: ${selectedUnit === 'all' ? 'All Units' : units.find(u => u.id === parseInt(selectedUnit))?.name}` 
      });
      
      const tableData = filteredEmployees.map(emp => {
        const stats = getDetailedAttendance(emp.id);
        return [
          emp.employeeId || '-',
          `${emp.firstName} ${emp.lastName}`,
          departments.find(d => d.id === emp.departmentId)?.name || '-',
          stats.present.toString(),
          stats.absent.toString(),
          stats.halfday.toString(),
          stats.late.toString(),
          (stats.present + stats.absent + stats.halfday).toString()
        ];
      });

      autoTable(doc, {
        head: [['Emp ID', 'Name', 'Department', 'Present', 'Absent', 'Half Day', 'Late', 'Total Days']],
        body: tableData,
        startY: 70,
        headStyles: { fillColor: [15, 23, 42] as [number, number, number] },
        alternateRowStyles: { fillColor: [245, 247, 250] as [number, number, number] },
        margin: { top: 70 }
      });

      addFooter(doc);
      const refNumber = generateReferenceNumber("ATT");
      addReferenceNumber(doc, refNumber, 68);
      addDocumentDate(doc, undefined, 68);
      doc.save(`attendance_report_${selectedMonth.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "PDF Exported Successfully" });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  const handleDownloadIndividualPDF = (emp: User) => {
    try {
      const doc = new jsPDF() as any;
      addWatermark(doc);
      addCompanyHeader(doc, { 
        title: "INDIVIDUAL ATTENDANCE REPORT", 
        subtitle: `${emp.firstName} ${emp.lastName} | ${selectedMonth}` 
      });

      const stats = getDetailedAttendance(emp.id);
      const dept = departments.find(d => d.id === emp.departmentId);

      autoTable(doc, {
        startY: 70,
        head: [['Field', 'Details']],
        body: [
          ['Employee Name', `${emp.firstName} ${emp.lastName}`],
          ['Employee ID', emp.employeeId || '-'],
          ['Department', dept?.name || '-'],
          ['Position', emp.position || '-'],
          ['Present Days', stats.present.toString()],
          ['Absent Days', stats.absent.toString()],
          ['Half Days', stats.halfday.toString()],
          ['Late Arrivals', stats.late.toString()],
          ['Total Recorded Days', (stats.present + stats.absent + stats.halfday).toString()],
        ],
        headStyles: { fillColor: [15, 23, 42] as [number, number, number] },
        theme: 'striped'
      });

      addFooter(doc);
      addHRSignature(doc, (doc as any).lastAutoTable?.finalY || 170);
      const refNumber = generateReferenceNumber("IND-ATT");
      addReferenceNumber(doc, refNumber, 68);
      addDocumentDate(doc, undefined, 68);
      doc.save(`attendance_${emp.firstName}_${emp.lastName}_${selectedMonth.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "Individual Report Exported" });
    } catch (error) {
      console.error("Individual PDF Export Error:", error);
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredEmployees.map(emp => {
      const stats = getDetailedAttendance(emp.id);
      return {
        'Employee ID': emp.employeeId || '-',
        'Name': `${emp.firstName} ${emp.lastName}`,
        'Department': departments.find(d => d.id === emp.departmentId)?.name || '-',
        'Present Days': stats.present,
        'Absent Days': stats.absent,
        'Half Days': stats.halfday,
        'Late Arrivals': stats.late,
        'Total Recorded Days': (stats.present + stats.absent + stats.halfday)
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `attendance_report_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
    toast({ title: "Excel Exported Successfully" });
  };

  const handleExportText = () => {
    const dataToExport = filteredEmployees.map(emp => {
      const stats = getDetailedAttendance(emp.id);
      return `${emp.employeeId || '-'}\t${emp.firstName} ${emp.lastName}\t${departments.find(d => d.id === emp.departmentId)?.name || '-'}\t${stats.present}\t${stats.absent}\t${stats.total}\n`;
    });

    let textContent = `ATTENDANCE REPORT - ${selectedMonth}\n`;
    textContent += `Unit: ${selectedUnit === 'all' ? 'All' : selectedUnit}\n`;
    textContent += "=".repeat(80) + "\n";
    textContent += `Emp ID\tName\tDepartment\tPresent\tAbsent\tTotal\n`;
    textContent += "-".repeat(80) + "\n";
    textContent += dataToExport.join("");

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${selectedMonth.replace(/\s+/g, '_')}.txt`;
    a.click();
    toast({ title: "Text File Exported" });
  };

  const handleExportIndividualExcel = (emp: User) => {
    const stats = getDetailedAttendance(emp.id);
    const dept = departments.find(d => d.id === emp.departmentId);
    
    const data = [{
      'Employee Name': `${emp.firstName} ${emp.lastName}`,
      'Employee ID': emp.employeeId || '-',
      'Department': dept?.name || '-',
      'Position': emp.position || '-',
      'Present Days': stats.present,
      'Absent Days': stats.absent,
      'Half Days': stats.halfday,
      'Late Arrivals': stats.late,
      'Total Recorded Days': stats.total
    }];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `attendance_${emp.firstName}_${emp.lastName}_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
    toast({ title: "Individual Excel Exported" });
  };

  const handleExportIndividualText = (emp: User) => {
    const stats = getDetailedAttendance(emp.id);
    const dept = departments.find(d => d.id === emp.departmentId);
    
    let textContent = `ATTENDANCE STATEMENT - ${selectedMonth}\n`;
    textContent += `Employee: ${emp.firstName} ${emp.lastName} (${emp.employeeId})\n`;
    textContent += `Department: ${dept?.name || '-'}\n`;
    textContent += "=".repeat(50) + "\n";
    textContent += `Present Days: ${stats.present}\n`;
    textContent += `Absent Days: ${stats.absent}\n`;
    textContent += `Half Days: ${stats.halfday}\n`;
    textContent += `Late Arrivals: ${stats.late}\n`;
    textContent += `Total Days: ${stats.total}\n`;
    
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${emp.firstName}_${emp.lastName}.txt`;
    a.click();
    toast({ title: "Individual Text Exported" });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white" data-testid="text-page-title">Attendance Intelligence</h1>
            <p className="text-slate-500 font-medium">Deep analysis of workforce presence and patterns</p>
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 h-9 font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day wise</SelectItem>
                  <SelectItem value="week">Week wise</SelectItem>
                  <SelectItem value="month">Month wise</SelectItem>
                  <SelectItem value="year">Year wise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Selection</label>
              {selectedPeriod === 'month' ? (
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-40 h-9 font-bold shadow-sm" data-testid="select-month">
                    <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthsList.map(m => (
                      <SelectItem key={m} value={`${m} ${selectedDate ? new Date(selectedDate).getFullYear() : currentYear}`}>{m} {selectedDate ? new Date(selectedDate).getFullYear() : currentYear}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedPeriod === 'week' ? (
                 <Input
                  type="week"
                  value={selectedDate ? (() => {
                    const d = new Date(selectedDate);
                    const year = d.getFullYear();
                    const oneJan = new Date(year, 0, 1);
                    const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
                    const result = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
                    return `${year}-W${String(result).padStart(2, '0')}`;
                  })() : ""}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [year, week] = e.target.value.split('-W');
                    const d = new Date(parseInt(year), 0, 1);
                    d.setDate(d.getDate() + (parseInt(week) - 1) * 7);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="h-9 w-40 font-bold shadow-sm"
                />
              ) : selectedPeriod === 'year' ? (
                <Select value={String(new Date(selectedDate).getFullYear())} onValueChange={(v) => {
                  const d = new Date(selectedDate);
                  d.setFullYear(parseInt(v));
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}>
                  <SelectTrigger className="w-40 h-9 font-bold shadow-sm">
                    <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsList.map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-9 w-40 font-bold shadow-sm"
                />
              )}
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 h-9">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2 font-bold" onClick={handleExportPDF}>
                <FileDown className="h-3 w-3" /> PDF
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2 font-bold" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-3 w-3" /> Excel
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2 font-bold" onClick={handleExportText}>
                <FileText className="h-3 w-3" /> Text
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-4 mb-6">
          <div className="w-64">
            <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Unit</label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger>
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Department</label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments
                  .filter(d => selectedUnit === 'all' || d.unitId === parseInt(selectedUnit))
                  .map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportStats.map((stat, index) => (
            <Card key={stat.title} data-testid={`card-stat-${index}`} className="hover-elevate transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.color} shadow-sm`}>{stat.icon}</div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" />
                Unit Hierarchy View
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredDepartments.map((dept) => {
              const deptEmployees = filteredEmployees.filter(e => e.departmentId === dept.id);
              const deptAttendance = attendanceRecords.filter(r => deptEmployees.some(e => e.id === r.userId));
              
              if (deptEmployees.length === 0) return null;

              return (
                <div key={dept.id} className="border rounded-lg overflow-hidden transition-all duration-300 hover:border-teal-200">
                  <div className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border-b">
                    <div className="flex items-center gap-3">
                      <ChevronDown className="h-4 w-4 text-teal-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{dept.name}</span>
                      <Badge variant="secondary" className="ml-2 font-medium bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                        {deptEmployees.length} Employees
                      </Badge>
                      <Badge variant="outline" className="ml-2 border-teal-200 text-teal-600">
                        {deptAttendance.length} Total Records
                      </Badge>
                    </div>
                  </div>
                  <div className="p-0 bg-white dark:bg-slate-950 divide-y">
                    {deptEmployees
                      .map(emp => {
                        const stats = getDetailedAttendance(emp.id);
                        const isExpanded = expandedEmployees.has(emp.id);
                        
                        return (
                          <div key={emp.id} className="flex flex-col">
                            <button
                              onClick={() => toggleEmployee(emp.id)}
                              className="p-4 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-900/80 transition-all w-full text-left"
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 transition-transform duration-200">
                                  {isExpanded ? <ChevronDown className="h-4 w-4 text-teal-600" /> : <ChevronRight className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-slate-100">{emp.firstName} {emp.lastName}</p>
                                  <p className="text-xs font-medium text-slate-500 uppercase tracking-tighter">{emp.employeeId} • {emp.position}</p>
                                </div>
                              </div>
                              <div className="flex gap-3">
                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 font-bold px-2 py-0.5">Present: {stats.present}</Badge>
                                <Badge variant="outline" className="text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/30 font-bold px-2 py-0.5">Absent: {stats.absent}</Badge>
                              </div>
                            </button>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="bg-slate-50/40 dark:bg-slate-900/40 p-5 border-t border-slate-100 dark:border-slate-800"
                                >
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-sm transition-transform hover:scale-[1.02]">
                                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Present</p>
                                      <p className="text-xl font-black text-emerald-600">{stats.present}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-sm transition-transform hover:scale-[1.02]">
                                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Absent</p>
                                      <p className="text-xl font-black text-rose-600">{stats.absent}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-sm transition-transform hover:scale-[1.02]">
                                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Half Day</p>
                                      <p className="text-xl font-black text-amber-600">{stats.halfday}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-sm transition-transform hover:scale-[1.02]">
                                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Late Arrivals</p>
                                      <p className="text-xl font-black text-blue-600">{stats.late}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex justify-end gap-3 flex-wrap">
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold gap-2 hover-elevate" onClick={() => handleDownloadIndividualPDF(emp)}>
                                      <FileDown className="h-3.5 w-3.5" /> PDF
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold gap-2 hover-elevate" onClick={() => handleExportIndividualExcel(emp)}>
                                      <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold gap-2 hover-elevate" onClick={() => handleExportIndividualText(emp)}>
                                      <FileText className="h-3.5 w-3.5" /> Text
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 rounded-lg text-xs font-bold gap-2 hover-elevate" 
                                      onClick={() => window.location.href=`/payroll/salary/${emp.id}?tab=attendance`}
                                    >
                                      Full Profile
                                    </Button>
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
