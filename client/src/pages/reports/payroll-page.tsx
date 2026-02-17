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
  const { data: paymentRecords = [] } = useQuery<any[]>({ queryKey: ["/api/payroll/payments"] });

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

  const getDetailedPayroll = (userId: number) => {
    const records = paymentRecords.filter(r => {
      const paymentDate = new Date(r.paymentDate);
      return r.employeeId === userId && paymentDate >= startDate && paymentDate <= endDate;
    });
    const emp = employees.find(e => e.id === userId);
    const baseAmount = emp?.salary || 0;
    
    if (records.length > 0) {
      const totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);
      const lastPayment = records.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
      return { 
        totalAmount, 
        count: records.length,
        lastPaymentDate: lastPayment?.paymentDate,
        lastPaymentMode: lastPayment?.paymentMode,
        lastRefNo: lastPayment?.referenceNo,
        isSynced: true
      };
    }

    return {
      totalAmount: baseAmount,
      count: 0,
      lastPaymentDate: null,
      lastPaymentMode: null,
      lastRefNo: null,
      isSynced: false
    };
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
        title: "UNIT-WISE PAYROLL REPORT", 
        subtitle: `Period: ${selectedPeriod.toUpperCase()} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})` 
      });
      const tableData = filteredEmployees.map(emp => {
        const payroll = getDetailedPayroll(emp.id);
        return [emp.employeeId || '-', `${emp.firstName} ${emp.lastName}`, departments.find(d => d.id === emp.departmentId)?.name || '-', `₹${payroll.totalAmount.toLocaleString()}`];
      });
      autoTable(doc, { head: [['Emp ID', 'Name', 'Department', 'Amount']], body: tableData, startY: 70 });
      addFooter(doc);
      doc.save(`payroll_report_${selectedMonth}.pdf`);
      toast({ title: "PDF Exported Successfully" });
    } catch (e) { toast({ title: "Export Failed", variant: "destructive" }); }
  };

  const handleExportExcel = () => {
    const data = filteredEmployees.map(emp => {
      const payroll = getDetailedPayroll(emp.id);
      return { 'Emp ID': emp.employeeId, 'Name': `${emp.firstName} ${emp.lastName}`, 'Amount': payroll.totalAmount };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
    XLSX.writeFile(workbook, `payroll_report_${selectedMonth}.xlsx`);
  };

  const handleExportText = () => {
    const data = filteredEmployees.map(emp => {
      const payroll = getDetailedPayroll(emp.id);
      return `${emp.employeeId}\t${emp.firstName} ${emp.lastName}\t${payroll.totalAmount}\n`;
    });
    const blob = new Blob([data.join("")], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_report_${selectedMonth}.txt`;
    a.click();
  };

  const handleDownloadIndividualPDF = (emp: User) => {
    try {
      const doc = new jsPDF() as any;
      addWatermark(doc);
      addCompanyHeader(doc, { title: "INDIVIDUAL PAYROLL STATEMENT", subtitle: `${emp.firstName} ${emp.lastName}` });
      const payroll = getDetailedPayroll(emp.id);
      autoTable(doc, { startY: 70, head: [['Detail', 'Value']], body: [['Amount', `₹${payroll.totalAmount.toLocaleString()}`], ['Status', payroll.count > 0 ? 'Paid' : 'Pending']] });
      addFooter(doc);
      doc.save(`payroll_${emp.firstName}.pdf`);
    } catch (e) {}
  };

  const handleExportIndividualText = (emp: User) => {
    const payroll = getDetailedPayroll(emp.id);
    const text = `PAYROLL STATEMENT - ${selectedMonth}\nEmployee: ${emp.firstName} ${emp.lastName}\nAmount: ₹${payroll.totalAmount.toLocaleString()}\nStatus: ${payroll.count > 0 ? 'Paid' : 'Pending'}\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${emp.firstName}.txt`;
    a.click();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Unit-wise Payroll Reports</h1>
            <p className="text-slate-500">Hierarchical payroll analysis</p>
          </div>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32 h-9">
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
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2" onClick={handleExportPDF}><FileDown className="h-3 w-3" /> PDF</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2" onClick={handleExportExcel}><FileSpreadsheet className="h-3 w-3" /> Excel</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2" onClick={handleExportText}><FileText className="h-3 w-3" /> Text</Button>
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
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-teal-600" /> Unit Hierarchy</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
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
                          <button onClick={() => toggleEmployee(emp.id)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                            <div className="flex items-center gap-3">
                              {isExpanded ? <ChevronDown className="h-4 w-4 text-teal-600" /> : <ChevronRight className="h-4 w-4" />}
                              <div className="text-left"><p className="font-semibold">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-500 uppercase">{emp.employeeId} • {emp.position}</p></div>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-teal-600 font-black">₹{payroll.totalAmount.toLocaleString()}</Badge>
                            </div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-5 bg-slate-50/40 border-t overflow-hidden">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                  <div className="p-4 bg-white border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Base Salary</p>
                                    <p className="text-xl font-black">₹{(emp.salary || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="p-4 bg-white border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                                    <p className="text-xl font-black text-teal-600">{payroll.count > 0 ? 'Disbursed' : 'In Progress'}</p>
                                  </div>
                                  <div className="p-4 bg-white border rounded-xl shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ref No</p>
                                    <p className="text-xl font-black">{payroll.lastRefNo || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-3 flex-wrap">
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold gap-2 hover-elevate" onClick={() => handleDownloadIndividualPDF(emp)}><FileDown className="h-3.5 w-3.5" /> PDF</Button>
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold gap-2 hover-elevate" onClick={() => handleExportIndividualText(emp)}><FileText className="h-3.5 w-3.5" /> Text</Button>
                                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold hover-elevate" onClick={() => window.location.href=`/employee/${emp.id}?tab=payroll`}>Full Profile</Button>
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
