import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CalendarDays, 
  Calendar, 
  Users, 
  Clock, 
  Search, 
  Building2, 
  ChevronRight, 
  ChevronDown, 
  FileSpreadsheet,
  FileDown,
  CheckCircle
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

export default function LeaveReportPage() {
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
  const { data: leaveRequests = [] } = useQuery<any[]>({ queryKey: ["/api/leave-requests"] });
  const { data: leaveBalances = {} } = useQuery<Record<number, any>>({ queryKey: ["/api/employees/leave-balances"] });

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
      const empIdFormatted = emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`;
      const matchesSearch = searchQuery === "" || 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        empIdFormatted.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesUnit && matchesDept && matchesSearch;
    });
  }, [employees, departments, selectedUnit, selectedDept, searchQuery]);

  const filteredDepartments = departments.filter((dept: Department) => 
    (selectedUnit === "all" || dept.unitId === parseInt(selectedUnit)) &&
    (selectedDept === "all" || dept.id === parseInt(selectedDept))
  );

  const toggleEmployee = (empId: number) => {
    const newSet = new Set(expandedEmployees);
    if (newSet.has(empId)) newSet.delete(empId);
    else newSet.add(empId);
    setExpandedEmployees(newSet);
  };

  const getLeaveBalance = (userId: number) => {
    const balance = leaveBalances[userId];
    if (balance) {
      return {
        totalAccrued: balance.totalAccrued || 0,
        totalTaken: balance.totalTaken || 0,
        pendingRequests: balance.pendingRequests || 0,
        remainingBalance: balance.remainingBalance || 0,
        accruedThisYear: balance.accruedThisYear || 0,
        takenThisYear: balance.takenThisYear || 0,
        nextAccrualDate: balance.nextAccrualDate ? new Date(balance.nextAccrualDate).toLocaleDateString('en-GB') : 'N/A',
        accrualRate: '1.5 days/month'
      };
    }
    return {
      totalAccrued: 0,
      totalTaken: 0,
      pendingRequests: 0,
      remainingBalance: 0,
      accruedThisYear: 0,
      takenThisYear: 0,
      nextAccrualDate: 'N/A',
      accrualRate: '1.5 days/month'
    };
  };

  const getEmployeeLeaveRequests = (userId: number) => {
    return leaveRequests.filter((r: any) => {
      const start = new Date(r.startDate);
      return r.userId === userId && start >= startDate && start <= endDate;
    });
  };

  const getMonthlyBreakdown = (userId: number) => {
    const userLeaves = leaveRequests.filter((r: any) => r.userId === userId && r.status === 'approved');
    const monthlyData: Record<string, number> = {};
    userLeaves.forEach((leave: any) => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const monthKey = `${monthsList[startDate.getMonth()]} ${startDate.getFullYear()}`;
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + days;
    });
    return monthlyData;
  };

  const totalApproved = leaveRequests.filter((r: any) => r.status === 'approved').length;
  const totalPending = leaveRequests.filter((r: any) => r.status === 'pending').length;
  const totalRejected = leaveRequests.filter((r: any) => r.status === 'rejected').length;

  const leaveStats = [
    { title: "Approved Leaves", value: totalApproved.toString(), icon: <CheckCircle className="h-6 w-6" />, color: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
    { title: "Pending Requests", value: totalPending.toString(), icon: <Clock className="h-6 w-6" />, color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
    { title: "Rejected", value: totalRejected.toString(), icon: <CalendarDays className="h-6 w-6" />, color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
    { title: "Total Employees", value: filteredEmployees.length.toString(), icon: <Users className="h-6 w-6" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  ];

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' }) as any;
      addWatermark(doc);
      addCompanyHeader(doc, { 
        title: "LEAVE MANAGEMENT REPORT", 
        subtitle: `Period: ${selectedPeriod.toUpperCase()} (${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')})` 
      });

      const tableData = filteredEmployees.map(emp => {
        const balance = getLeaveBalance(emp.id);
        const empIdFormatted = emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`;
        const deptName = departments.find(d => d.id === emp.departmentId)?.name || '-';
        return [
          empIdFormatted,
          `${emp.firstName} ${emp.lastName}`,
          deptName,
          balance.totalAccrued.toFixed(1),
          balance.totalTaken.toString(),
          balance.pendingRequests.toString(),
          balance.remainingBalance.toFixed(1),
          balance.accruedThisYear.toFixed(1),
          balance.takenThisYear.toString(),
          balance.accrualRate,
          balance.nextAccrualDate
        ];
      });

      autoTable(doc, { 
        head: [['Emp ID', 'Emp Name', 'Department', 'Total Accrued', 'Total Used', 'Pending', 'Remaining Balance', 'Accrued This Year', 'Used This Year', 'Accrual Rate', 'Next Accrual']], 
        body: tableData, 
        startY: 70,
        headStyles: { fillColor: [0, 128, 128], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 16, halign: 'center' },
          6: { cellWidth: 25, halign: 'center' },
          7: { cellWidth: 22, halign: 'center' },
          8: { cellWidth: 20, halign: 'center' },
          9: { cellWidth: 22, halign: 'center' },
          10: { cellWidth: 22, halign: 'center' }
        }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;

      if (finalY + 40 < doc.internal.pageSize.height) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Leave Requests Detail:', 14, finalY + 15);

        const detailData = filteredEmployees.flatMap(emp => {
          const userLeaves = getEmployeeLeaveRequests(emp.id);
          const empIdFormatted = emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`;
          if (userLeaves.length === 0) return [];
          return userLeaves.map((leave: any) => [
            empIdFormatted,
            `${emp.firstName} ${emp.lastName}`,
            leave.type || '-',
            new Date(leave.startDate).toLocaleDateString('en-GB'),
            new Date(leave.endDate).toLocaleDateString('en-GB'),
            leave.days?.toString() || '1',
            (leave.status || 'pending').toUpperCase(),
            leave.reason || '-'
          ]);
        });

        if (detailData.length > 0) {
          autoTable(doc, {
            head: [['Emp ID', 'Name', 'Type', 'From', 'To', 'Days', 'Status', 'Reason']],
            body: detailData,
            startY: finalY + 20,
            headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
            styles: { fontSize: 7, cellPadding: 2 }
          });
        }
      }

      addFooter(doc);
      const refNumber = generateReferenceNumber("LEV");
      addReferenceNumber(doc, refNumber, 68);
      addDocumentDate(doc, undefined, 68);
      doc.save(`leave_report_${monthsList[selectedMonth]}_${selectedYear}.pdf`);
      toast({ title: "PDF Exported Successfully" });
    } catch (error) { 
      console.error(error);
      toast({ title: "Export Failed", variant: "destructive" }); 
    }
  };

  const handleExportExcel = () => {
    const balanceData = filteredEmployees.map(emp => {
      const balance = getLeaveBalance(emp.id);
      const empIdFormatted = emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`;
      const deptName = departments.find(d => d.id === emp.departmentId)?.name || '-';
      return {
        'Emp ID': empIdFormatted,
        'Emp Name': `${emp.firstName} ${emp.lastName}`,
        'Department': deptName,
        'Total Accrued': Number(balance.totalAccrued.toFixed(1)),
        'Total Used': balance.totalTaken,
        'Pending Requests': balance.pendingRequests,
        'Remaining Balance': Number(balance.remainingBalance.toFixed(1)),
        'Accrued This Year': Number(balance.accruedThisYear.toFixed(1)),
        'Used This Year': balance.takenThisYear,
        'Accrual Rate': balance.accrualRate,
        'Next Accrual Date': balance.nextAccrualDate
      };
    });

    const detailData = filteredEmployees.flatMap(emp => {
      const userLeaves = getEmployeeLeaveRequests(emp.id);
      const empIdFormatted = emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`;
      const deptName = departments.find(d => d.id === emp.departmentId)?.name || '-';
      if (userLeaves.length === 0) return [];
      return userLeaves.map((leave: any) => ({
        'Emp ID': empIdFormatted,
        'Emp Name': `${emp.firstName} ${emp.lastName}`,
        'Department': deptName,
        'Leave Type': leave.type || '-',
        'Start Date': new Date(leave.startDate).toLocaleDateString('en-GB'),
        'End Date': new Date(leave.endDate).toLocaleDateString('en-GB'),
        'Days': leave.days || 1,
        'Status': (leave.status || 'pending').toUpperCase(),
        'Reason': leave.reason || '-'
      }));
    });

    const workbook = XLSX.utils.book_new();

    const balanceSheet = XLSX.utils.json_to_sheet(balanceData);
    balanceSheet['!cols'] = [12, 25, 20, 14, 12, 14, 16, 16, 14, 16, 16].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(workbook, balanceSheet, "Leave Balance");

    if (detailData.length > 0) {
      const detailSheet = XLSX.utils.json_to_sheet(detailData);
      detailSheet['!cols'] = [12, 25, 20, 15, 12, 12, 8, 12, 30].map(w => ({ wch: w }));
      XLSX.utils.book_append_sheet(workbook, detailSheet, "Leave Requests");
    }

    XLSX.writeFile(workbook, `leave_report_${monthsList[selectedMonth]}_${selectedYear}.xlsx`);
    toast({ title: "Excel Exported Successfully" });
  };

  const handleDownloadIndividualPDF = (emp: User) => {
    try {
      const doc = new jsPDF() as any;
      addWatermark(doc);
      addCompanyHeader(doc, { title: "INDIVIDUAL LEAVE REPORT", subtitle: `${emp.firstName} ${emp.lastName}` });
      const balance = getLeaveBalance(emp.id);
      const empIdFormatted = emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`;

      autoTable(doc, {
        startY: 70,
        head: [['Leave Detail', 'Value']],
        body: [
          ['Employee ID', empIdFormatted],
          ['Department', departments.find(d => d.id === emp.departmentId)?.name || '-'],
          ['Total Accrued', `${balance.totalAccrued.toFixed(1)} days`],
          ['Total Used', `${balance.totalTaken} days`],
          ['Pending Requests', `${balance.pendingRequests} days`],
          ['Remaining Balance', `${balance.remainingBalance.toFixed(1)} days`],
          ['Accrued This Year', `${balance.accruedThisYear.toFixed(1)} days`],
          ['Used This Year', `${balance.takenThisYear} days`],
          ['Accrual Rate', balance.accrualRate],
          ['Next Accrual Date', balance.nextAccrualDate]
        ],
        headStyles: { fillColor: [0, 128, 128], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        theme: 'striped'
      });

      const userLeaves = getEmployeeLeaveRequests(emp.id);
      if (userLeaves.length > 0) {
        const detailY = (doc as any).lastAutoTable?.finalY + 15 || 180;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Leave Requests:', 14, detailY);

        autoTable(doc, {
          startY: detailY + 5,
          head: [['Type', 'From', 'To', 'Days', 'Status', 'Reason']],
          body: userLeaves.map((leave: any) => [
            leave.type || '-',
            new Date(leave.startDate).toLocaleDateString('en-GB'),
            new Date(leave.endDate).toLocaleDateString('en-GB'),
            leave.days?.toString() || '1',
            (leave.status || 'pending').toUpperCase(),
            leave.reason || '-'
          ]),
          headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 8 }
        });
      }

      const monthlyBreakdown = getMonthlyBreakdown(emp.id);
      const monthlyEntries = Object.entries(monthlyBreakdown);
      if (monthlyEntries.length > 0) {
        const monthY = (doc as any).lastAutoTable?.finalY + 15 || 220;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Leave Summary:', 14, monthY);

        autoTable(doc, {
          startY: monthY + 5,
          head: [['Month', 'Days Used']],
          body: monthlyEntries.map(([month, days]) => [month, days.toString()]),
          headStyles: { fillColor: [0, 128, 128], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 8 }
        });
      }

      addFooter(doc);
      addHRSignature(doc, (doc as any).lastAutoTable?.finalY || 150);
      const refNumber = generateReferenceNumber("IND-LEV");
      addReferenceNumber(doc, refNumber, 68);
      addDocumentDate(doc, undefined, 68);
      doc.save(`leave_${emp.firstName}_${emp.lastName}.pdf`);
      toast({ title: "PDF Downloaded" });
    } catch (e) { console.error(e); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-leave-report-title">Leave Reports</h1>
            <p className="text-slate-500 font-medium">Comprehensive leave management analysis</p>
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 h-9 font-bold shadow-sm" data-testid="select-period">
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
                <div className="flex gap-2">
                  <Select 
                    value={monthsList[selectedMonth]} 
                    onValueChange={(v) => {
                      const monthIndex = monthsList.indexOf(v);
                      setSelectedMonth(monthIndex);
                    }}
                  >
                    <SelectTrigger className="w-32 h-9 font-bold shadow-sm" data-testid="select-month">
                      <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthsList.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={String(selectedYear)} 
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-24 h-9 font-bold shadow-sm" data-testid="select-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearsList.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 h-9">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2 font-bold" onClick={handleExportPDF} data-testid="button-export-pdf">
                <FileDown className="h-3 w-3" /> PDF
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2 font-bold" onClick={handleExportExcel} data-testid="button-export-excel">
                <FileSpreadsheet className="h-3 w-3" /> Excel
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveStats.map((stat) => (
            <Card key={stat.title} className="hover-elevate">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
                <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-sm text-slate-500 uppercase tracking-wider">{stat.title}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-teal-600" /> Employee Leave Details</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search employees..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredDepartments.map((dept) => {
              const deptEmployees = filteredEmployees.filter(e => e.departmentId === dept.id);
              if (deptEmployees.length === 0) return null;
              return (
                <div key={dept.id} className="border rounded-lg overflow-hidden transition-all hover:border-teal-200">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b flex justify-between items-center">
                    <span className="font-semibold">{dept.name}</span>
                    <Badge variant="secondary">{deptEmployees.length} Employees</Badge>
                  </div>
                  <div className="divide-y">
                    {deptEmployees.map(emp => {
                      const balance = getLeaveBalance(emp.id);
                      const isExpanded = expandedEmployees.has(emp.id);
                      const empIdFormatted = emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`;
                      return (
                        <div key={emp.id}>
                          <button onClick={() => toggleEmployee(emp.id)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all" data-testid={`button-toggle-emp-${emp.id}`}>
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-teal-600" /> : <ChevronRight className="h-4 w-4" />}
                              <div className="text-left"><p className="font-semibold">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-500 uppercase">{empIdFormatted} • {emp.position}</p></div>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline" className="text-teal-600 font-bold">Remaining: {balance.remainingBalance.toFixed(1)}</Badge>
                              <Badge variant="outline" className="text-amber-600 font-bold">Used: {balance.totalTaken}</Badge>
                            </div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 bg-slate-50/40 border-t overflow-hidden">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                                  <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Accrued</p>
                                    <p className="text-xl font-black text-teal-600">{balance.totalAccrued.toFixed(1)} days</p>
                                    <p className="text-xs text-slate-500">@ {balance.accrualRate}</p>
                                  </div>
                                  <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Used</p>
                                    <p className="text-xl font-black text-red-500">{balance.totalTaken} days</p>
                                  </div>
                                  <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pending</p>
                                    <p className="text-xl font-black text-amber-600">{balance.pendingRequests} days</p>
                                  </div>
                                  <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Remaining Balance</p>
                                    <p className="text-xl font-black text-emerald-600">{balance.remainingBalance.toFixed(1)} days</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                                  <div className="p-3 bg-white dark:bg-slate-800 border rounded-lg">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Accrued This Year</p>
                                    <p className="text-lg font-bold">{balance.accruedThisYear.toFixed(1)} days</p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-slate-800 border rounded-lg">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Used This Year</p>
                                    <p className="text-lg font-bold">{balance.takenThisYear} days</p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-slate-800 border rounded-lg">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Next Accrual</p>
                                    <p className="text-lg font-bold">{balance.nextAccrualDate}</p>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold gap-2" onClick={() => handleDownloadIndividualPDF(emp)} data-testid={`button-pdf-emp-${emp.id}`}><FileDown className="h-3.5 w-3.5" /> PDF</Button>
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold" onClick={() => window.location.href=`/employee/${emp.id}?tab=leave`} data-testid={`button-profile-emp-${emp.id}`}>Full Profile</Button>
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
