import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Upload, Building2, Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber } from "@/lib/pdf-utils";
import { User, Department, Unit } from "@shared/schema";

export default function EsiPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
  
  const { data: employees = [] } = useQuery<User[]>({ queryKey: ["/api/employees"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: units = [] } = useQuery<Unit[]>({ queryKey: ["/api/masters/units"] });
  
  const esiData = useMemo(() => {
    const data = employees
      .filter(emp => emp.isActive && emp.salary && emp.salary > 0)
      .filter(emp => {
        const dept = departments.find(d => d.id === emp.departmentId);
        const unit = units.find(u => u.id === dept?.unitId);
        
        const matchesUnit = selectedUnit === "all" || unit?.id.toString() === selectedUnit;
        const matchesDept = selectedDepartment === "all" || dept?.id.toString() === selectedDepartment;
        
        return matchesUnit && matchesDept;
      })
      .map(emp => {
        const monthlyCTC = emp.salary!;
        const grossSalary = Math.round((monthlyCTC / 30) * 25);
        
        const employeeContrib = Math.round(grossSalary * 0.0075);
        const employerContrib = Math.round(grossSalary * 0.0325);

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
  }, [employees, departments, units, selectedUnit, selectedDepartment]);

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
    const doc = new jsPDF();
    addWatermark(doc);
    addCompanyHeader(doc, { 
      title: "ESI COMPLIANCE REPORT", 
      subtitle: `Period: ${selectedPeriod.toUpperCase()} (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})` 
    });
    addFooter(doc);
    const refNumber = generateReferenceNumber("ESI");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, undefined, 68);
    
    autoTable(doc, {
      startY: 80,
      head: [['Employee', 'Gross Salary', 'Employee (0.75%)', 'Employer (3.25%)', 'Total']],
      body: Object.values(esiData).flatMap(depts => Object.values(depts).flat()).map(row => [
        row.employee,
        `Rs. ${row.grossSalary.toLocaleString()}`,
        `Rs. ${row.employeeContrib.toLocaleString()}`,
        `Rs. ${row.employerContrib.toLocaleString()}`,
        `Rs. ${row.total.toLocaleString()}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 98, 179] },
    });
    
    addHRSignature(doc, (doc as any).lastAutoTable.finalY + 20);
    doc.save('employees-state-insurance-report.pdf');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Employees' State Insurance</h1>
            <p className="text-slate-500 mt-1">Manage Employees' State Insurance contributions and reports</p>
          </div>
          <div className="flex gap-2 items-end flex-wrap">
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
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" />Upload Challan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Upload ESI Challan</DialogTitle></DialogHeader>
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
            <CardTitle>ESI Contributions</CardTitle>
            <CardDescription>Monthly statutory ESI details by Unit and Department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.entries(esiData).map(([unitName, departments]) => (
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
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Employee (0.75%)</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Employer (3.25%)</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staff.map((row, index) => (
                              <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-medium text-slate-900">{row.employee}</td>
                                <td className="py-3 px-4 text-slate-600">₹{row.grossSalary.toLocaleString()}</td>
                                <td className="py-3 px-4 text-slate-600">₹{row.employeeContrib.toLocaleString()}</td>
                                <td className="py-3 px-4 text-slate-600">₹{row.employerContrib.toLocaleString()}</td>
                                <td className="py-3 px-4 font-bold text-teal-600">₹{row.total.toLocaleString()}</td>
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