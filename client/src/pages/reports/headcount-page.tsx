import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Download, 
  Calendar, 
  TrendingUp, 
  Building2, 
  UserPlus, 
  UserMinus, 
  Search, 
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
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber } from "@/lib/pdf-utils";
import { User, Department, Unit } from "@shared/schema";

export default function HeadcountReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: units = [] } = useQuery<Unit[]>({ queryKey: ["/api/masters/units"] });
  const { data: employees = [] } = useQuery<User[]>({ queryKey: ["/api/employees"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

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

  const toggleEmployee = (empId: number) => {
    const newSet = new Set(expandedEmployees);
    if (newSet.has(empId)) newSet.delete(empId);
    else newSet.add(empId);
    setExpandedEmployees(newSet);
  };

  const filteredDepartments = useMemo(() => {
    return departments.filter((d: Department) => 
      (selectedUnit === "all" || d.unitId === parseInt(selectedUnit)) &&
      (selectedDept === "all" || d.id === parseInt(selectedDept))
    );
  }, [departments, selectedUnit, selectedDept]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: User) => {
      const dept = departments.find(d => d.id === emp.departmentId);
      const joinDate = emp.joinDate ? new Date(emp.joinDate) : null;
      
      const matchesUnit = selectedUnit === 'all' || (dept && dept.unitId === parseInt(selectedUnit));
      const matchesDept = selectedDept === 'all' || emp.departmentId === parseInt(selectedDept);
      const matchesSearch = searchQuery === "" || 
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.employeeId || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const isWithinPeriod = !joinDate || joinDate <= endDate;
      
      return matchesUnit && matchesDept && matchesSearch && isWithinPeriod;
    });
  }, [employees, departments, selectedUnit, selectedDept, searchQuery, endDate]);

  const getTenure = (joinDate: string | Date | null) => {
    if (!joinDate) return "N/A";
    const join = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - join.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} days`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} months`;
    const diffYears = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    return `${diffYears}y ${remainingMonths}m`;
  };

  const headcountStats = [
    { title: "Total Headcount", value: filteredEmployees.length.toString(), icon: <Users className="h-6 w-6" />, color: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
    { title: "New Hires", value: Math.round(filteredEmployees.length * 0.1).toString(), icon: <UserPlus className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { title: "Separations", value: Math.round(filteredEmployees.length * 0.05).toString(), icon: <UserMinus className="h-6 w-6" />, color: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" },
    { title: "Growth Rate", value: "8.3%", icon: <TrendingUp className="h-6 w-6" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  ];

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      addWatermark(doc);
      addCompanyHeader(doc, { title: "UNIT-WISE HEADCOUNT REPORT", subtitle: `Period: ${selectedMonth}` });
      const tableData = filteredEmployees.map(emp => [emp.employeeId || '-', `${emp.firstName} ${emp.lastName}`, departments.find(d => d.id === emp.departmentId)?.name || '-', emp.position || '-', emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A', emp.employmentType || '-']);
      autoTable(doc, { head: [['Emp ID', 'Name', 'Department', 'Position', 'Join Date', 'Type']], body: tableData, startY: 70 });
      addFooter(doc);
      doc.save(`headcount_report_${selectedMonth}.pdf`);
      toast({ title: "PDF Exported Successfully" });
    } catch (e) { toast({ title: "Export Failed", variant: "destructive" }); }
  };

  const handleExportExcel = () => {
    const data = filteredEmployees.map(emp => ({ 'Emp ID': emp.employeeId, 'Name': `${emp.firstName} ${emp.lastName}`, 'Department': departments.find(d => d.id === emp.departmentId)?.name, 'Position': emp.position }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Headcount");
    XLSX.writeFile(workbook, `headcount_report_${selectedMonth}.xlsx`);
  };

  const handleExportText = () => {
    const data = filteredEmployees.map(emp => `${emp.employeeId}\t${emp.firstName} ${emp.lastName}\t${emp.position}\n`);
    const blob = new Blob([data.join("")], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `headcount_report_${selectedMonth}.txt`;
    a.click();
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
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white" data-testid="text-page-title">Headcount Analysis</h1>
              <p className="text-slate-500 font-medium">Unit-wise hierarchical workforce distribution</p>
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
                      {monthsList.map(m => {
                        const monthYear = `${m} ${selectedDate ? new Date(selectedDate).getFullYear() : currentYear}`;
                        const monthIndex = monthsList.indexOf(m);
                        const year = selectedDate ? new Date(selectedDate).getFullYear() : currentYear;
                        const isFuture = year > currentYear || (year === currentYear && monthIndex > new Date().getMonth());
                        if (isFuture) return null;
                        return (
                          <SelectItem key={m} value={monthYear}>{monthYear}</SelectItem>
                        );
                      })}
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
                    max={`${new Date().getFullYear()}-W${String(Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24 * 60 * 60 * 1000) / 7)).padStart(2, '0')}`}
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
                      {yearsList
                        .filter(y => y <= new Date().getFullYear())
                        .map(y => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="date"
                    value={selectedDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-9 w-40 font-bold shadow-sm"
                  />
                )}
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-800 h-9">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2 font-bold" onClick={handleExportPDF}><FileDown className="h-3 w-3" /> PDF</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2 font-bold" onClick={handleExportExcel}><FileSpreadsheet className="h-3 w-3" /> Excel</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hover-elevate px-2 font-bold" onClick={handleExportText}><FileText className="h-3 w-3" /> Text</Button>
              </div>
            </div>
          </motion.div>

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
          {headcountStats.map((stat, index) => (
            <Card key={stat.title} className="hover-elevate transition-all duration-300 shadow-sm border-slate-200/60 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch h-24">
                  <div className={cn("w-2 flex-shrink-0", 
                    index === 0 ? "bg-teal-500" : 
                    index === 1 ? "bg-emerald-500" : 
                    index === 2 ? "bg-rose-500" : "bg-blue-500"
                  )} />
                  <div className="flex-1 flex items-center gap-4 px-5">
                    <div className={cn("p-3 rounded-xl shadow-inner", stat.color)}>{stat.icon}</div>
                    <div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.title}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            {filteredDepartments.map((dept: Department) => {
              const deptEmployees = filteredEmployees.filter(e => e.departmentId === dept.id);
              if (deptEmployees.length === 0) return null;
              return (
                <div key={dept.id} className="border rounded-xl overflow-hidden transition-all duration-300 hover:border-teal-200 shadow-sm">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{dept.name}</span>
                    </div>
                    <Badge variant="secondary" className="font-bold bg-teal-50 text-teal-700 dark:bg-teal-900/30">{deptEmployees.length} Employees</Badge>
                  </div>
                  <div className="divide-y bg-white dark:bg-slate-950">
                    {deptEmployees.map(emp => {
                      const isExpanded = expandedEmployees.has(emp.id);
                      return (
                        <div key={emp.id} className="group">
                          <button onClick={() => toggleEmployee(emp.id)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50/50 transition-all text-left">
                            <div className="flex items-center gap-4">
                              <div className={cn("p-2 rounded-lg transition-colors", isExpanded ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200")}>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">{emp.firstName} {emp.lastName}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{emp.employeeId} • {emp.position}</p>
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <Badge variant="outline" className="text-teal-600 bg-teal-50 border-teal-100 font-bold px-2 py-0.5">Active</Badge>
                              <Badge variant="outline" className="font-bold border-slate-200 text-slate-600 bg-slate-50 px-2 py-0.5">{emp.employmentType}</Badge>
                            </div>
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/40 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 overflow-hidden">
                                <div className="p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 shadow-sm">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Details</p>
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-bold text-slate-500">Join Date</span>
                                          <span className="text-xs font-black">{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-bold text-slate-500">Tenure</span>
                                          <span className="text-xs font-black text-teal-600">{getTenure(emp.joinDate)}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 shadow-sm">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Info</p>
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-3 w-3 text-slate-400" />
                                          <span className="text-xs font-bold">{emp.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Building2 className="h-3 w-3 text-slate-400" />
                                          <span className="text-xs font-bold">{emp.workLocation || 'Office'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 shadow-sm">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Role Status</p>
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-bold text-slate-500">System Role</span>
                                          <Badge className="text-[10px] font-black h-5 uppercase">{emp.role}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs font-bold text-slate-500">Employment</span>
                                          <span className="text-xs font-black capitalize">{emp.employmentType}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-3">
                                    <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold hover-elevate px-4 border-teal-200 text-teal-600" onClick={() => window.location.href=`/employee/${emp.id}`}>
                                      View Full Profile <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  </div>
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
