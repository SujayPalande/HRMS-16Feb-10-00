import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  IndianRupee, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Wallet, 
  Search, 
  Building2, 
  ChevronRight, 
  ChevronDown, 
  User as UserIcon, 
  Mail,
  FileSpreadsheet,
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

export default function PayrollReportPage() {
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
  const { data: paymentRecords = [] } = useQuery<any[]>({ queryKey: ["/api/payroll/payments"] });
  const { data: attendanceRecords = [] } = useQuery<any[]>({ queryKey: ["/api/attendance"] });

  const calculateGrossSalary = (monthlyCTC: number, daysWorked: number = 25, totalDaysInMonth: number = 30) =>
    (monthlyCTC / totalDaysInMonth) * daysWorked;

  const calculateBasicSalary = (grossSalary: number) => (grossSalary || 0) * 0.5;

  const calculateEPF = (basicSalary: number) => Math.min(basicSalary || 0, 15000) * 0.12;
  const calculateESIC = (grossSalary: number) => (grossSalary || 0) <= 21000 ? Math.round((grossSalary || 0) * 0.0075) : 0;
  const calculateProfessionalTax = () => 200;

  const mlwfMonthNum = new Date().getMonth() + 1;
  const isMlwfMonth = mlwfMonthNum === 6 || mlwfMonthNum === 12;
  const calculateMLWFEmployee = () => isMlwfMonth ? 25 : 0;

  const getSalaryBreakdown = (monthlyCTC: number, daysWorked: number = 25, totalDaysInMonth: number = 30) => {
    const grossSalary = calculateGrossSalary(monthlyCTC, daysWorked, totalDaysInMonth);
    const basicSalary = calculateBasicSalary(grossSalary);
    const epf = calculateEPF(basicSalary);
    const esic = calculateESIC(grossSalary);
    const professionalTax = calculateProfessionalTax();
    const mlwf = calculateMLWFEmployee();
    const totalDeductions = epf + esic + professionalTax + mlwf;
    const netSalary = grossSalary - totalDeductions;
    return { grossSalary, totalDeductions, netSalary, epf, esic, professionalTax, mlwf, daysWorked, totalDaysInMonth };
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
      const matchesSearch = searchQuery === "" || 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employeeId || "").toLowerCase().includes(searchQuery.toLowerCase());
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

  const getPresentDays = (userId: number) => {
    const empAttendance = attendanceRecords.filter((a: any) => {
      if (a.userId !== userId) return false;
      const aDate = new Date(a.date);
      return aDate >= startDate && aDate <= endDate;
    });
    const presentDays = empAttendance.filter((a: any) =>
      a.status === 'present' || a.status === 'P'
    ).length;
    const halfDays = empAttendance.filter((a: any) =>
      a.status === 'half-day' || a.status === 'HD'
    ).length;
    return presentDays + (halfDays * 0.5);
  };

  const getDaysInPeriod = () => {
    if (selectedPeriod === "month") {
      return new Date(selectedYear, selectedMonth + 1, 0).getDate();
    }
    return 30;
  };

  const getDetailedPayroll = (userId: number) => {
    const records = paymentRecords.filter((r: any) => {
      const paymentDate = new Date(r.paymentDate);
      return r.employeeId === userId && paymentDate >= startDate && paymentDate <= endDate;
    });
    const emp = employees.find(e => e.id === userId);
    const baseAmount = emp?.salary || 0;
    const presentDays = getPresentDays(userId);
    const totalDaysInMonth = getDaysInPeriod();
    const effectiveDays = presentDays > 0 ? presentDays : 25;

    if (records.length > 0) {
      const totalAmount = records.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
      const lastPayment = records.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
      const breakdown = getSalaryBreakdown(totalAmount, effectiveDays, totalDaysInMonth);
      return { 
        totalAmount, 
        count: records.length,
        lastPaymentDate: lastPayment?.paymentDate,
        lastPaymentMode: lastPayment?.paymentMode,
        lastRefNo: lastPayment?.referenceNo,
        isSynced: true,
        presentDays: effectiveDays,
        ...breakdown
      };
    }

    const breakdown = getSalaryBreakdown(baseAmount, effectiveDays, totalDaysInMonth);
    return {
      totalAmount: baseAmount,
      count: 0,
      lastPaymentDate: null,
      lastPaymentMode: null,
      lastRefNo: null,
      isSynced: false,
      presentDays: effectiveDays,
      ...breakdown
    };
  };

  const getBankDetails = (emp: User) => {
    const parts = [];
    if (emp.bankName) parts.push(emp.bankName);
    if (emp.bankAccountNumber) parts.push(`A/C: ${emp.bankAccountNumber}`);
    if (emp.bankIFSCCode) parts.push(`IFSC: ${emp.bankIFSCCode}`);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const totalMonthlyPayroll = filteredEmployees.reduce((sum: number, emp: User) => sum + getDetailedPayroll(emp.id).totalAmount, 0);
  const employeesPaidCount = filteredEmployees.filter((emp: User) => getDetailedPayroll(emp.id).count > 0).length;

  const payrollStats = [
    { title: "Total Payroll", value: `₹${totalMonthlyPayroll.toLocaleString()}`, icon: <IndianRupee className="h-6 w-6" />, color: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
    { title: "Units", value: units.length.toString(), icon: <Building2 className="h-6 w-6" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "Departments", value: departments.length.toString(), icon: <Wallet className="h-6 w-6" />, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
    { title: "Employees Paid", value: employeesPaidCount.toString(), icon: <Users className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ];

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' }) as any;
      addWatermark(doc);
      addCompanyHeader(doc, { 
        title: "PAYROLL REPORT", 
        subtitle: `Period: ${selectedPeriod.toUpperCase()} (${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')})` 
      });
      const tableData = filteredEmployees.map(emp => {
        const payroll = getDetailedPayroll(emp.id);
        const deptName = departments.find(d => d.id === emp.departmentId)?.name || '-';
        return [
          emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`,
          `${emp.firstName} ${emp.lastName}`,
          deptName,
          getBankDetails(emp),
          `${payroll.presentDays}/${payroll.totalDaysInMonth}`,
          Math.round(payroll.grossSalary).toLocaleString(),
          Math.round(payroll.totalDeductions).toLocaleString(),
          Math.round(payroll.netSalary).toLocaleString()
        ];
      });

      const totalGross = filteredEmployees.reduce((s, e) => s + getDetailedPayroll(e.id).grossSalary, 0);
      const totalDed = filteredEmployees.reduce((s, e) => s + getDetailedPayroll(e.id).totalDeductions, 0);
      const totalNet = filteredEmployees.reduce((s, e) => s + getDetailedPayroll(e.id).netSalary, 0);

      tableData.push([
        '', 'TOTAL', '', '', '',
        Math.round(totalGross).toLocaleString(),
        Math.round(totalDed).toLocaleString(),
        Math.round(totalNet).toLocaleString()
      ]);

      autoTable(doc, { 
        head: [['Emp ID', 'Emp Name', 'Department', 'Bank Details', 'Present Days', 'Gross Salary', 'Deductions', 'Net Salary']], 
        body: tableData, 
        startY: 70,
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, lineWidth: 0.1, lineColor: [0, 0, 0] },
        styles: { fontSize: 7, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30 },
          3: { cellWidth: 55 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 28, halign: 'right' },
          6: { cellWidth: 28, halign: 'right' },
          7: { cellWidth: 28, halign: 'right' }
        },
        foot: [],
        didParseCell: function(data: any) {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      });
      addFooter(doc);
      const refNumber = generateReferenceNumber("PAY");
      addReferenceNumber(doc, refNumber, 68);
      addDocumentDate(doc, undefined, 68);
      doc.save(`payroll_report_${monthsList[selectedMonth]}_${selectedYear}.pdf`);
      toast({ title: "PDF Exported Successfully" });
    } catch (e) { 
      console.error(e);
      toast({ title: "Export Failed", variant: "destructive" }); 
    }
  };

  const handleExportExcel = () => {
    const data = filteredEmployees.map(emp => {
      const payroll = getDetailedPayroll(emp.id);
      const deptName = departments.find(d => d.id === emp.departmentId)?.name || '-';
      return { 
        'Emp ID': emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`,
        'Emp Name': `${emp.firstName} ${emp.lastName}`,
        'Department': deptName,
        'Bank Name': emp.bankName || 'N/A',
        'Account Number': emp.bankAccountNumber || 'N/A',
        'IFSC Code': emp.bankIFSCCode || 'N/A',
        'Present Days': payroll.presentDays,
        'Total Days in Month': payroll.totalDaysInMonth,
        'Gross Salary (₹)': Math.round(payroll.grossSalary),
        'EPF (₹)': Math.round(payroll.epf),
        'ESIC (₹)': Math.round(payroll.esic),
        'Prof. Tax (₹)': Math.round(payroll.professionalTax),
        'MLWF (₹)': Math.round(payroll.mlwf),
        'Total Deductions (₹)': Math.round(payroll.totalDeductions),
        'Net Salary (₹)': Math.round(payroll.netSalary)
      };
    });

    const totalRow = {
      'Emp ID': '',
      'Emp Name': 'TOTAL',
      'Department': '',
      'Bank Name': '',
      'Account Number': '',
      'IFSC Code': '',
      'Present Days': '',
      'Total Days in Month': '',
      'Gross Salary (₹)': Math.round(data.reduce((s, r) => s + (r['Gross Salary (₹)'] || 0), 0)),
      'EPF (₹)': Math.round(data.reduce((s, r) => s + (r['EPF (₹)'] || 0), 0)),
      'ESIC (₹)': Math.round(data.reduce((s, r) => s + (r['ESIC (₹)'] || 0), 0)),
      'Prof. Tax (₹)': Math.round(data.reduce((s, r) => s + (r['Prof. Tax (₹)'] || 0), 0)),
      'MLWF (₹)': Math.round(data.reduce((s, r) => s + (r['MLWF (₹)'] || 0), 0)),
      'Total Deductions (₹)': Math.round(data.reduce((s, r) => s + (r['Total Deductions (₹)'] || 0), 0)),
      'Net Salary (₹)': Math.round(data.reduce((s, r) => s + (r['Net Salary (₹)'] || 0), 0))
    };
    data.push(totalRow as any);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = [12, 25, 20, 20, 20, 15, 12, 12, 15, 12, 12, 12, 10, 15, 15];
    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Report");
    XLSX.writeFile(workbook, `payroll_report_${monthsList[selectedMonth]}_${selectedYear}.xlsx`);
    toast({ title: "Excel Exported Successfully" });
  };

  const handleDownloadIndividualPDF = (emp: User) => {
    try {
      const doc = new jsPDF() as any;
      addWatermark(doc);
      addCompanyHeader(doc, { title: "INDIVIDUAL PAYROLL STATEMENT", subtitle: `${emp.firstName} ${emp.lastName}` });
      const payroll = getDetailedPayroll(emp.id);
      autoTable(doc, { 
        startY: 70, 
        head: [['Detail', 'Value']], 
        body: [
          ['Employee ID', emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`],
          ['Department', departments.find(d => d.id === emp.departmentId)?.name || '-'],
          ['Bank Details', getBankDetails(emp)],
          ['Present Days', `${payroll.presentDays} / ${payroll.totalDaysInMonth}`],
          ['Gross Salary', Math.round(payroll.grossSalary).toLocaleString()],
          ['EPF', Math.round(payroll.epf).toLocaleString()],
          ['ESIC', Math.round(payroll.esic).toLocaleString()],
          ['Professional Tax', Math.round(payroll.professionalTax).toLocaleString()],
          ['MLWF', Math.round(payroll.mlwf).toLocaleString()],
          ['Total Deductions', Math.round(payroll.totalDeductions).toLocaleString()],
          ['Net Salary', Math.round(payroll.netSalary).toLocaleString()],
          ['Status', payroll.count > 0 ? 'Paid' : 'Pending']
        ],
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
        styles: { fontSize: 9 }
      });
      addFooter(doc);
      doc.save(`payroll_${emp.firstName}_${emp.lastName}.pdf`);
      toast({ title: "PDF Downloaded" });
    } catch (e) { console.error(e); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-payroll-report-title">Payroll Reports</h1>
            <p className="text-slate-500">Comprehensive payroll analysis with salary breakdown</p>
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 h-9" data-testid="select-period">
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
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 h-9">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2" onClick={handleExportPDF} data-testid="button-export-pdf"><FileDown className="h-3 w-3" /> PDF</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2" onClick={handleExportExcel} data-testid="button-export-excel"><FileSpreadsheet className="h-3 w-3" /> Excel</Button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="w-64">
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger><SelectValue placeholder="All Units" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {units.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.filter(d => selectedUnit === 'all' || d.unitId === parseInt(selectedUnit)).map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {payrollStats.map((stat, index) => (
            <Card key={stat.title} className="hover-elevate"><CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-sm text-slate-500 uppercase tracking-wider">{stat.title}</p></div>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-teal-600" /> Employee Payroll Details</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" data-testid="input-search" />
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
                      const payroll = getDetailedPayroll(emp.id);
                      const isExpanded = expandedEmployees.has(emp.id);
                      return (
                        <div key={emp.id}>
                          <button onClick={() => toggleEmployee(emp.id)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all" data-testid={`button-toggle-emp-${emp.id}`}>
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-teal-600" /> : <ChevronRight className="h-4 w-4" />}
                              <div className="text-left"><p className="font-semibold">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-500 uppercase">{emp.employeeId || `EMP${String(emp.id).padStart(3, '0')}`} • {emp.position}</p></div>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Badge variant="outline" className="text-xs">Days: {payroll.presentDays}/{payroll.totalDaysInMonth}</Badge>
                              <Badge variant="outline" className="text-teal-600 font-black">Net: ₹{Math.round(payroll.netSalary).toLocaleString()}</Badge>
                            </div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 bg-slate-50/40 border-t overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                                  <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bank Details</p>
                                    <p className="text-sm font-semibold mt-1">{emp.bankName || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{emp.bankAccountNumber || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{emp.bankIFSCCode || 'N/A'}</p>
                                  </div>
                                  <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gross Salary</p>
                                    <p className="text-xl font-black text-teal-600">₹{Math.round(payroll.grossSalary).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{payroll.presentDays} days payable</p>
                                  </div>
                                  <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Deductions</p>
                                    <p className="text-xl font-black text-red-500">₹{Math.round(payroll.totalDeductions).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">EPF + ESIC + PT + MLWF</p>
                                  </div>
                                  <div className="p-4 bg-white dark:bg-slate-800 border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Net Salary</p>
                                    <p className="text-xl font-black text-emerald-600">₹{Math.round(payroll.netSalary).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{payroll.count > 0 ? 'Disbursed' : 'In Progress'}</p>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-3 flex-wrap">
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold gap-2 hover-elevate" onClick={() => handleDownloadIndividualPDF(emp)} data-testid={`button-pdf-emp-${emp.id}`}><FileDown className="h-3.5 w-3.5" /> PDF</Button>
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold hover-elevate" onClick={() => window.location.href=`/employee/${emp.id}?tab=payroll`} data-testid={`button-profile-emp-${emp.id}`}>Full Profile</Button>
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
