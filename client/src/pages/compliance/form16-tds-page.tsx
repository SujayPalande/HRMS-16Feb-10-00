import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { exportToExcel, exportToTxt } from "@/lib/export-utils";
import { FileSpreadsheet, FileText, FileDown, FileText as FileIcon, FileText as FileTDS, FileText as Form16Icon, FileText as TDSIcon, Download, Search, Calendar, IndianRupee, CheckCircle, Clock, AlertCircle, Loader2, Plus, FilePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber, COMPANY_NAME, COMPANY_ADDRESS, HR_NAME, HR_DESIGNATION } from "@/lib/pdf-utils";
import { User, Department, Unit } from "@shared/schema";

export default function Form16TdsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [showBasicForm16Dialog, setShowBasicForm16Dialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [statusMap, setStatusMap] = useState<Record<number, string>>({});
  const { toast } = useToast();

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

  const selectedYear = `${startDate.getFullYear()}-${(startDate.getFullYear() + 1).toString().slice(-2)}`;

  const { data: employees = [] } = useQuery<User[]>({ queryKey: ["/api/employees"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: units = [] } = useQuery<Unit[]>({ queryKey: ["/api/masters/units"] });
  const { data: payrollRecords = [] } = useQuery<any[]>({ queryKey: ["/api/payroll"] });

  const employeeTds = useMemo(() => {
    const { startDate, endDate } = getReportPeriod();
    return employees
      .filter(emp => emp.isActive)
      .filter(emp => {
        const dept = departments.find(d => d.id === emp.departmentId);
        const matchesUnit = selectedUnit === 'all' || (dept && dept.unitId === parseInt(selectedUnit));
        const matchesDept = selectedDept === 'all' || emp.departmentId === parseInt(selectedDept);
        
        // Dynamic filtering based on period
        const joinDate = emp.joinDate ? new Date(emp.joinDate) : null;
        const isJoinedBeforeEnd = !joinDate || joinDate <= endDate;
        
        // Filter by participation in selected period if needed
        // For TDS/Form 16, we usually look at the financial year or selected period
        
        return matchesUnit && matchesDept && isJoinedBeforeEnd;
      })
      .map(emp => {
        const { startDate: pStart, endDate: pEnd } = getReportPeriod();
        const records = payrollRecords.filter(r => {
          const rDate = new Date(r.paymentDate || r.createdAt);
          return r.userId === emp.id && rDate >= pStart && rDate <= pEnd;
        });
        
        const totalIncome = records.length > 0 
          ? records.reduce((sum, r) => sum + (r.netSalary || 0), 0)
          : (emp.salary || 0) * (selectedPeriod === 'year' ? 12 : selectedPeriod === 'month' ? 1 : selectedPeriod === 'week' ? 0.25 : 0.033);
        
        const tdsDeducted = records.length > 0
          ? records.reduce((sum, r) => sum + (r.deductions?.tds || 0), 0)
          : Math.round(totalIncome * 0.1);

        const dept = departments.find(d => d.id === emp.departmentId);
        const unit = units.find(u => u.id === dept?.unitId);

        return {
          id: emp.id,
          employee: `${emp.firstName} ${emp.lastName}`,
          pan: emp.panCard || "ABCDE1234F",
          totalIncome,
          tdsDeducted,
          form16: statusMap[emp.id] || "Pending",
          departmentName: dept?.name || "Unassigned",
          unitName: unit?.name || "Unassigned"
        };
      });
  }, [employees, departments, units, payrollRecords, selectedUnit, selectedDept, statusMap, selectedPeriod, selectedDate]);

  const [basicForm16Data, setBasicForm16Data] = useState({
    employeeName: "",
    pan: "",
    address: "",
    assessmentYear: "2024-25",
    employerName: "HRMS Connect Pvt. Ltd.",
    employerTan: "MUMH12345F",
    grossSalary: "",
    basicSalary: "",
    hra: "",
    otherAllowances: "",
    standardDeduction: "50000",
    section80C: "",
    section80D: "",
    otherDeductions: "",
    tdsDeducted: "",
  });

  const resetBasicForm16 = () => {
    setBasicForm16Data({
      employeeName: "",
      pan: "",
      address: "",
      assessmentYear: "2024-25",
      employerName: "HRMS Connect Pvt. Ltd.",
      employerTan: "MUMH12345F",
      grossSalary: "",
      basicSalary: "",
      hra: "",
      otherAllowances: "",
      standardDeduction: "50000",
      section80C: "",
      section80D: "",
      otherDeductions: "",
      tdsDeducted: "",
    });
  };

  const tdsStats = [
    { title: "Total TDS Deducted", value: "Rs.45,67,000", status: "success", icon: <IndianRupee className="h-5 w-5" /> },
    { title: "Form 16 Generated", value: "142", status: "success", icon: <FileText className="h-5 w-5" /> },
    { title: "Pending Generation", value: "14", status: "warning", icon: <Clock className="h-5 w-5" /> },
    { title: "Filed with Dept", value: "128", status: "success", icon: <CheckCircle className="h-5 w-5" /> },
  ];

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employeeTds;
    const query = searchQuery.toLowerCase();
    return employeeTds.filter(
      emp => 
        emp.employee.toLowerCase().includes(query) || 
        emp.pan.toLowerCase().includes(query)
    );
  }, [employeeTds, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Generated": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const generateForm16PDF = (employee: any) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    
    addFooter(doc);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FORM NO. 16", 105, 20, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("[See rule 31(1)(a)]", 105, 27, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Certificate under section 203 of the Income-tax Act, 1961", 105, 35, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`for Tax Deducted at Source on Salary - FY ${selectedYear}`, 105, 42, { align: 'center' });
    
    const refNumber = generateReferenceNumber("F16");
    doc.setFontSize(9);
    doc.text(`Ref No: ${refNumber}`, 14, 50);
    doc.text(`Generated on: ${currentDate}`, 196, 50, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Part A - Details of Employer and Employee", 14, 60);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 63, 196, 63);
    
    autoTable(doc, {
      startY: 67,
      head: [],
      body: [
        ['Name of the Deductor (Employer)', COMPANY_NAME],
        ['TAN of the Deductor', 'PNEC12345F'],
        ['Address of the Deductor', COMPANY_ADDRESS],
        ['Name of the Employee', employee.employee],
        ['PAN of the Employee', employee.pan],
        ['Assessment Year', selectedYear === '2023-24' ? '2024-25' : selectedYear === '2022-23' ? '2023-24' : '2022-23'],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 110 },
      },
    });
    
    const partAEndY = (doc as any).lastAutoTable?.finalY || 120;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Part B - Details of Salary Paid and Tax Deducted", 14, partAEndY + 12);
    doc.setDrawColor(0, 0, 0);
    doc.line(14, partAEndY + 15, 196, partAEndY + 15);
    
    const basicSalary = Math.round(employee.totalIncome * 0.5);
    const hra = Math.round(employee.totalIncome * 0.2);
    const allowances = Math.round(employee.totalIncome * 0.2);
    const bonus = Math.round(employee.totalIncome * 0.1);
    
    autoTable(doc, {
      startY: partAEndY + 19,
      head: [['Particulars', 'Amount (Rs.)']],
      body: [
        ['1. Gross Salary', `Rs.${employee.totalIncome.toLocaleString()}`],
        ['   a) Basic Salary', `Rs.${basicSalary.toLocaleString()}`],
        ['   b) House Rent Allowance', `Rs.${hra.toLocaleString()}`],
        ['   c) Other Allowances', `Rs.${allowances.toLocaleString()}`],
        ['   d) Bonus/Incentive', `Rs.${bonus.toLocaleString()}`],
        ['2. Less: Standard Deduction u/s 16(ia)', 'Rs.50,000'],
        ['3. Net Taxable Income', `Rs.${Math.max(0, employee.totalIncome - 50000).toLocaleString()}`],
        ['4. Tax Payable', `Rs.${employee.tdsDeducted.toLocaleString()}`],
        ['5. Less: Rebate u/s 87A', 'Rs.0'],
        ['6. Tax Deducted at Source', `Rs.${employee.tdsDeducted.toLocaleString()}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [80, 80, 80] },
      styles: { fontSize: 9 },
    });
    
    doc.save(`Form16_${employee.employee.replace(/\s+/g, '_')}_${selectedYear}.pdf`);
  };

  const generateBasicForm16PDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    const grossSalary = parseInt(basicForm16Data.grossSalary) || 0;
    const basicSalary = parseInt(basicForm16Data.basicSalary) || 0;
    const hra = parseInt(basicForm16Data.hra) || 0;
    const otherAllowances = parseInt(basicForm16Data.otherAllowances) || 0;
    const standardDeduction = parseInt(basicForm16Data.standardDeduction) || 50000;
    const section80C = parseInt(basicForm16Data.section80C) || 0;
    const section80D = parseInt(basicForm16Data.section80D) || 0;
    const otherDeductions = parseInt(basicForm16Data.otherDeductions) || 0;
    const tdsDeducted = parseInt(basicForm16Data.tdsDeducted) || 0;

    const totalDeductions = standardDeduction + section80C + section80D + otherDeductions;
    const taxableIncome = Math.max(0, grossSalary - totalDeductions);
    
    addFooter(doc);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("FORM NO. 16", 105, 20, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("[See rule 31(1)(a)]", 105, 27, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Certificate under section 203 of the Income-tax Act, 1961", 105, 35, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`for Tax Deducted at Source on Salary - AY ${basicForm16Data.assessmentYear}`, 105, 42, { align: 'center' });
    
    const refNumber = generateReferenceNumber("F16");
    doc.setFontSize(9);
    doc.text(`Ref No: ${refNumber}`, 14, 50);
    doc.text(`Generated on: ${currentDate}`, 196, 50, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Part A - Details of Employer and Employee", 14, 60);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, 63, 196, 63);
    
    autoTable(doc, {
      startY: 67,
      head: [],
      body: [
        ['Name of the Deductor (Employer)', basicForm16Data.employerName || COMPANY_NAME],
        ['TAN of the Deductor', basicForm16Data.employerTan || 'PNEC12345F'],
        ['Address of the Deductor', COMPANY_ADDRESS],
        ['Name of the Employee', basicForm16Data.employeeName],
        ['PAN of the Employee', basicForm16Data.pan],
        ['Address of the Employee', basicForm16Data.address || 'N/A'],
        ['Assessment Year', basicForm16Data.assessmentYear],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { cellWidth: 110 },
      },
    });
    
    const partAEndY = (doc as any).lastAutoTable?.finalY || 120;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Part B - Details of Salary Paid and Tax Deducted", 14, partAEndY + 12);
    doc.setDrawColor(0, 0, 0);
    doc.line(14, partAEndY + 15, 196, partAEndY + 15);
    
    autoTable(doc, {
      startY: partAEndY + 19,
      head: [['Particulars', 'Amount (Rs.)']],
      body: [
        ['1. Gross Salary', `Rs.${grossSalary.toLocaleString()}`],
        ['   a) Basic Salary', `Rs.${basicSalary.toLocaleString()}`],
        ['   b) House Rent Allowance', `Rs.${hra.toLocaleString()}`],
        ['   c) Other Allowances', `Rs.${otherAllowances.toLocaleString()}`],
        ['2. Less: Standard Deduction u/s 16(ia)', `Rs.${standardDeduction.toLocaleString()}`],
        ['3. Less: Deductions under Chapter VI-A', ''],
        ['   a) Section 80C', `Rs.${section80C.toLocaleString()}`],
        ['   b) Section 80D', `Rs.${section80D.toLocaleString()}`],
        ['   c) Other Deductions', `Rs.${otherDeductions.toLocaleString()}`],
        ['4. Total Deductions', `Rs.${totalDeductions.toLocaleString()}`],
        ['5. Net Taxable Income', `Rs.${taxableIncome.toLocaleString()}`],
        ['6. Tax Deducted at Source', `Rs.${tdsDeducted.toLocaleString()}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [80, 80, 80] },
      styles: { fontSize: 9 },
    });
    
    doc.save(`Form16_${basicForm16Data.employeeName.replace(/\s+/g, '_')}_${basicForm16Data.assessmentYear}.pdf`);
  };

  const handleExportExcel = () => {
    const dataForExport = filteredEmployees.map(emp => ({
      "Employee": emp.employee,
      "PAN": emp.pan,
      "Total Income": emp.totalIncome,
      "TDS Deducted": emp.tdsDeducted,
      "Form 16 Status": emp.form16,
      "Department": emp.departmentName,
      "Unit": emp.unitName
    }));
    exportToExcel(dataForExport, `Form16_TDS_Report_${selectedDate}`);
    toast({ title: "Export Successful", description: "Excel report has been downloaded." });
  };

  const handleExportTxt = () => {
    const dataForExport = filteredEmployees.map(emp => ({
      "Employee": emp.employee,
      "PAN": emp.pan,
      "Total Income": emp.totalIncome,
      "TDS Deducted": emp.tdsDeducted,
      "Form 16 Status": emp.form16,
      "Department": emp.departmentName,
      "Unit": emp.unitName
    }));
    exportToTxt(dataForExport, `Form16_TDS_Report_${selectedDate}`, "Form 16 & TDS Report");
    toast({ title: "Export Successful", description: "Text report has been downloaded." });
  };

  const handleGenerateForm16 = async (index: number) => {
    setGeneratingIndex(index);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const employee = filteredEmployees[index];
    if (employee) {
      generateForm16PDF(employee);
      setStatusMap(prev => ({ ...prev, [employee.id]: "Generated" }));
      toast({
        title: "Form 16 Generated",
        description: `Form 16 for ${employee.employee} has been generated and downloaded.`,
      });
    }
    
    setGeneratingIndex(null);
  };

  const handleDownloadForm16 = (employee: any) => {
    generateForm16PDF(employee);
    toast({
      title: "Form 16 Downloaded",
      description: `Form 16 for ${employee.employee} has been downloaded.`,
    });
  };

  const handleGenerateAllForm16 = async () => {
    const pendingEmployees = filteredEmployees.filter(emp => emp.form16 === "Pending");
    
    if (pendingEmployees.length === 0) {
      toast({
        title: "No Pending Form 16",
        description: "All Form 16 have already been generated.",
      });
      return;
    }

    setGeneratingAll(true);
    
    const newStatusMap = { ...statusMap };
    for (const employee of pendingEmployees) {
      await new Promise(resolve => setTimeout(resolve, 500));
      generateForm16PDF(employee);
      newStatusMap[employee.id] = "Generated";
    }
    
    setStatusMap(newStatusMap);
    
    toast({
      title: "All Form 16 Generated",
      description: `${pendingEmployees.length} Form 16 certificates have been generated and downloaded.`,
    });
    
    setGeneratingAll(false);
  };

  const handleGenerateBasicForm16 = async () => {
    const grossSalaryValue = parseInt(basicForm16Data.grossSalary) || 0;
    
    if (!basicForm16Data.employeeName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter employee name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!basicForm16Data.pan.trim() || basicForm16Data.pan.trim().length !== 10) {
      toast({
        title: "Invalid PAN",
        description: "Please enter a valid 10-character PAN number.",
        variant: "destructive",
      });
      return;
    }
    
    if (grossSalaryValue <= 0) {
      toast({
        title: "Invalid Gross Salary",
        description: "Please enter a valid gross salary amount.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    generateBasicForm16PDF();

    toast({
      title: "Form 16 Generated",
      description: `Basic Form 16 for ${basicForm16Data.employeeName} has been generated and downloaded.`,
    });

    setIsSubmitting(false);
    setShowBasicForm16Dialog(false);
    resetBasicForm16();
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Form 16 & TDS Management</h1>
            <p className="text-slate-500 mt-1">Manage TDS deductions and Form 16 generation</p>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
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
              {selectedPeriod === 'year' ? (
                <Select 
                  value={String(new Date(selectedDate).getFullYear())} 
                  onValueChange={(v) => {
                    const d = new Date(selectedDate);
                    d.setFullYear(parseInt(v));
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                >
                  <SelectTrigger className="h-9 w-40 font-bold shadow-sm">
                    <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 10 + i)
                      .filter(year => year <= new Date().getFullYear())
                      .map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              ) : selectedPeriod === 'month' ? (
                <Input
                  type="month"
                  value={selectedDate.substring(0, 7)}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(`${e.target.value}-01`);
                    }
                  }}
                  max={new Date().toISOString().substring(0, 7)}
                  className="h-9 w-40 font-bold shadow-sm"
                />
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
              ) : (
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-9 w-40 font-bold shadow-sm"
                />
              )}
            </div>
            <div className="w-40">
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger data-testid="select-unit">
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
            <div className="w-40">
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger data-testid="select-dept">
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
            <Button 
              variant="outline"
              className="gap-2" 
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button 
              variant="outline"
              className="gap-2" 
              onClick={handleExportTxt}
            >
              <FileText className="h-4 w-4" /> Text
            </Button>
            <Button 
              variant="outline"
              className="gap-2" 
              onClick={() => { resetBasicForm16(); setShowBasicForm16Dialog(true); }}
              data-testid="button-basic-form16"
            >
              <FilePlus className="h-4 w-4" />
              Basic Form 16
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleGenerateAllForm16}
              disabled={generatingAll}
              data-testid="button-generate-all"
            >
              {generatingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate All Form 16
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tdsStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${stat.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-slate-900">{stat.value}</h3>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Employee TDS Details</CardTitle>
                <CardDescription>TDS deductions and Form 16 status for FY {selectedYear}</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search employee or PAN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">PAN</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Total Income</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">TDS Deducted</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Form 16</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No employees found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((row, index) => (
                      <tr key={row.id} className="border-b hover:bg-slate-50" data-testid={`row-tds-${index}`}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{row.employee}</div>
                          <div className="text-xs text-slate-500">{row.unitName} • {row.departmentName}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 uppercase">{row.pan}</td>
                        <td className="py-3 px-4 text-slate-600">Rs. {row.totalIncome.toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">Rs. {row.tdsDeducted.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(row.form16)}>
                            {row.form16}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {row.form16 === "Generated" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 h-8 gap-1"
                              onClick={() => handleDownloadForm16(row)}
                              data-testid={`button-download-${index}`}
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-teal-600 hover:text-teal-700 h-8 gap-1"
                              onClick={() => handleGenerateForm16(index)}
                              disabled={generatingIndex === index}
                              data-testid={`button-generate-${index}`}
                            >
                              {generatingIndex === index ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              Generate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Basic Form 16 Dialog */}
        <Dialog open={showBasicForm16Dialog} onOpenChange={setShowBasicForm16Dialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Basic Form 16</DialogTitle>
              <DialogDescription>
                Manually enter employee details to generate a simplified Form 16 certificate.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name *</Label>
                <Input 
                  id="employeeName" 
                  value={basicForm16Data.employeeName} 
                  onChange={(e) => setBasicForm16Data({...basicForm16Data, employeeName: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan">Employee PAN *</Label>
                <Input 
                  id="pan" 
                  value={basicForm16Data.pan} 
                  onChange={(e) => setBasicForm16Data({...basicForm16Data, pan: e.target.value.toUpperCase()})}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Employee Address</Label>
                <Input 
                  id="address" 
                  value={basicForm16Data.address} 
                  onChange={(e) => setBasicForm16Data({...basicForm16Data, address: e.target.value})}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assessmentYear">Assessment Year</Label>
                <Select 
                  value={basicForm16Data.assessmentYear} 
                  onValueChange={(val) => setBasicForm16Data({...basicForm16Data, assessmentYear: val})}
                >
                  <SelectTrigger id="assessmentYear">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 4 + i;
                      const ay = `${year}-${(year + 1).toString().slice(-2)}`;
                      return <SelectItem key={ay} value={ay}>{ay}</SelectItem>;
                    }).reverse()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grossSalary">Gross Salary (Annual) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="grossSalary" 
                    type="number"
                    value={basicForm16Data.grossSalary} 
                    onChange={(e) => setBasicForm16Data({...basicForm16Data, grossSalary: e.target.value})}
                    className="pl-9"
                    placeholder="1200000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tdsDeducted">TDS Deducted (Annual) *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="tdsDeducted" 
                    type="number"
                    value={basicForm16Data.tdsDeducted} 
                    onChange={(e) => setBasicForm16Data({...basicForm16Data, tdsDeducted: e.target.value})}
                    className="pl-9"
                    placeholder="120000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="standardDeduction">Standard Deduction</Label>
                <Input 
                  id="standardDeduction" 
                  type="number"
                  value={basicForm16Data.standardDeduction} 
                  onChange={(e) => setBasicForm16Data({...basicForm16Data, standardDeduction: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section80C">Section 80C Deductions</Label>
                <Input 
                  id="section80C" 
                  type="number"
                  value={basicForm16Data.section80C} 
                  onChange={(e) => setBasicForm16Data({...basicForm16Data, section80C: e.target.value})}
                  placeholder="150000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section80D">Section 80D (Health Insurance)</Label>
                <Input 
                  id="section80D" 
                  type="number"
                  value={basicForm16Data.section80D} 
                  onChange={(e) => setBasicForm16Data({...basicForm16Data, section80D: e.target.value})}
                  placeholder="25000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBasicForm16Dialog(false)}>Cancel</Button>
              <Button onClick={handleGenerateBasicForm16} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
                Generate & Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
