import * as XLSX from "xlsx";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToExcel, exportToTxt } from "@/lib/export-utils";
import { FileSpreadsheet, FileText, Download, Upload, Shield, Building2, Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber } from "@/lib/pdf-utils";
import { User, Department, Unit } from "@shared/schema";

export default function MlwfPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { toast } = useToast();

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const yearsList = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

  const getReportPeriod = () => {
    let startDate, endDate;
    if (selectedPeriod === "day") {
      const date = new Date(selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear() ? new Date().toISOString().split('T')[0] : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`);
      startDate = new Date(date.setHours(0, 0, 0, 0));
      endDate = new Date(date.setHours(23, 59, 59, 999));
    } else if (selectedPeriod === "week") {
      const date = new Date(selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear() ? new Date().toISOString().split('T')[0] : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`);
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
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    }
    return { startDate, endDate };
  };

  const { startDate, endDate } = getReportPeriod();
  
  const { data: employees = [] } = useQuery<User[]>({ queryKey: ["/api/employees"] });
  
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: units = [] } = useQuery<Unit[]>({ queryKey: ["/api/masters/units"] });
  
  const hierarchicalData = useMemo(() => {
    const { startDate, endDate } = getReportPeriod();
    const data = employees
      .filter(emp => emp.isActive && emp.salary && emp.salary > 0)
      .filter(emp => {
        const dept = departments.find(d => d.id === emp.departmentId);
        const unit = units.find(u => u.id === dept?.unitId);
        
        const matchesUnit = selectedUnit === "all" || unit?.id.toString() === selectedUnit;
        const matchesDept = selectedDepartment === "all" || dept?.id.toString() === selectedDepartment;
        
        const joinDate = emp.joinDate ? new Date(emp.joinDate) : null;
        const isJoinedBeforeEnd = !joinDate || joinDate <= endDate;
        
        return matchesUnit && matchesDept && isJoinedBeforeEnd;
      })
      .map(emp => {
        const monthlyCTC = emp.salary!;
        const totalDaysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysToConsider = Math.min(30, totalDaysInPeriod);
        
        const grossSalary = Math.round((monthlyCTC / 30) * daysToConsider);
        // Force display 25/75 as requested by user ("In reports also should be visible for all specific reports")
        // The confusion was due to 0 being shown when it's not June/December.
        const employeeContrib = 25; 
        const employerContrib = 75;
        
        const dept = departments.find(d => d.id === emp.departmentId);
        const unit = units.find(u => u.id === dept?.unitId);

        return {
          employee: `${emp.firstName} ${emp.lastName}`,
          grossSalary,
          employeeContrib,
          employerContrib,
          total: employeeContrib + employerContrib,
          departmentName: dept?.name || "Unassigned",
          unitName: unit?.name || "Unassigned"
        };
      });

    const hierarchical: Record<string, Record<string, typeof data>> = {};
    data.forEach(item => {
      if (!hierarchical[item.unitName]) hierarchical[item.unitName] = {};
      if (!hierarchical[item.unitName][item.departmentName]) hierarchical[item.unitName][item.departmentName] = [];
      hierarchical[item.unitName][item.departmentName].push(item);
    });
    return hierarchical;
  }, [employees, departments, units, selectedUnit, selectedDepartment, selectedPeriod, selectedMonth, selectedYear]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleChallanUpload = async () => {
    if (!uploadedFile) return;
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "Challan Uploaded Successfully", description: `${uploadedFile.name} processed.` });
    setUploading(false);
    setUploadedFile(null);
    setUploadDialogOpen(false);
  };

  const generateReport = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    addWatermark(doc);
    addCompanyHeader(doc, { 
      title: "L.W.F. SUMMARY STATEMENT FOR THE MONTH OF", 
      subtitle: `${monthsList[selectedMonth]} ${selectedYear}` 
    });
    addFooter(doc);
    const refNumber = generateReferenceNumber("MLWF");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, undefined, 68);
    
    const flatData = Object.values(hierarchicalData).flatMap(depts => Object.values(depts).flat());
    
    autoTable(doc, {
      startY: 80,
      head: [['Sr.No.', 'Employee Name', 'Gross Wages', 'L.W.F. DEDUCTED', "Employer'sContr."]],
      body: flatData.map((row, idx) => [
        idx + 1,
        row.employee,
        row.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        row.employeeContrib.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        row.employerContrib.toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]),
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      foot: [[
        { content: 'TOTALS', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
        flatData.reduce((sum, r) => sum + r.grossSalary, 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        flatData.reduce((sum, r) => sum + r.employeeContrib, 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        flatData.reduce((sum, r) => sum + r.employerContrib, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    const totalLWF = flatData.reduce((sum, r) => sum + r.total, 0);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total LWF (Employee's + Employer's) :`, 100, finalY + 15);
    doc.text(totalLWF.toLocaleString(undefined, { minimumFractionDigits: 2 }), 160, finalY + 15);
    
    addHRSignature(doc, finalY + 30);
    doc.save(`MLWF-Statement-${monthsList[selectedMonth]}-${selectedYear}.pdf`);
  };

  const handleExportExcel = () => {
    const flatData = Object.values(hierarchicalData).flatMap(depts => Object.values(depts).flat());
    exportToExcel(flatData, `MLWF_Report_${monthsList[selectedMonth]}_${selectedYear}`);
    toast({ title: "Export Successful", description: "Excel report has been downloaded." });
  };

  const handleExportTxt = () => {
    const flatData = Object.values(hierarchicalData).flatMap(depts => Object.values(depts).flat());
    exportToTxt(flatData, `MLWF_Report_${monthsList[selectedMonth]}_${selectedYear}`, "MLWF Report");
    toast({ title: "Export Successful", description: "Text report has been downloaded." });
  };

  const downloadTemplate = () => {
    const templateHeader = [
      ["Employee ID", "Full Name", "Gross Salary", "Employee Contrib", "Employer Contrib"],
      ["EMP001", "John Doe", "20000", "25", "75"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateHeader);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MLWF Template");
    XLSX.writeFile(wb, "MLWF_Import_Template.xlsx");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Maharashtra Labour Welfare Fund</h1>
            <p className="text-slate-500 mt-1">Manage Maharashtra Labour Welfare Fund contributions and reports</p>
          </div>
          <div className="flex gap-2 items-end flex-wrap">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> Template
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportTxt}>
              <FileText className="h-4 w-4" /> Text
            </Button>
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
                  value={String(selectedYear)} 
                  onValueChange={(v) => setSelectedYear(parseInt(v))}
                >
                  <SelectTrigger className="h-9 w-32 font-bold shadow-sm">
                    <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsList.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : selectedPeriod === 'month' ? (
                <div className="flex gap-2">
                  <Select 
                    value={String(selectedMonth)} 
                    onValueChange={(v) => setSelectedMonth(parseInt(v))}
                  >
                    <SelectTrigger className="h-9 w-32 font-bold shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthsList.map((month, idx) => (
                        <SelectItem key={idx} value={String(idx)}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={String(selectedYear)} 
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="h-9 w-24 font-bold shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearsList.map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : selectedPeriod === 'week' ? (
                <Input
                  type="week"
                  value={`${selectedYear}-W01`}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [year, week] = e.target.value.split('-W');
                    setSelectedYear(parseInt(year));
                  }}
                  className="h-9 w-40 font-bold shadow-sm"
                />
              ) : (
                <Input
                  type="date"
                  value={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
                  onChange={(e) => {
                    const d = new Date(e.target.value);
                    setSelectedMonth(d.getMonth());
                    setSelectedYear(d.getFullYear());
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-9 w-40 font-bold shadow-sm"
                />
              )}
            </div>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" />Upload Challan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Upload MLWF Challan</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="challan-file">Select Challan File</Label>
                    <Input id="challan-file" type="file" onChange={handleFileUpload} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleChallanUpload} disabled={uploading || !uploadedFile}>
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="gap-2" onClick={generateReport}><Download className="h-4 w-4" />Generate Report</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filter Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue placeholder="All Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments
                      .filter(d => selectedUnit === "all" || d.unitId?.toString() === selectedUnit)
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MLWF Contributions</CardTitle>
            <CardDescription>Monthly statutory welfare fund details by Unit and Department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.entries(hierarchicalData).map(([unitName, departments]) => (
                <div key={unitName} className="space-y-4">
                  <h2 className="text-xl font-bold text-teal-700 border-b-2 border-teal-100 pb-2 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Unit: {unitName}
                  </h2>
                  
                  {Object.entries(departments).map(([deptName, staff]) => (
                    <div key={deptName} className="pl-4 space-y-2">
                      <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Department: {deptName}
                      </h3>
                      
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 border-b">
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Employee</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Gross Salary</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Employee Contrib</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Employer Contrib</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staff.map((row, index) => (
                              <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-medium text-slate-900">{row.employee}</td>
                                <td className="py-3 px-4 text-slate-600">₹{row.grossSalary.toLocaleString()}</td>
                                <td className="py-3 px-4 text-slate-600">₹{row.employeeContrib}</td>
                                <td className="py-3 px-4 text-slate-600">₹{row.employerContrib}</td>
                                <td className="py-3 px-4 font-bold text-teal-600">₹{row.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}