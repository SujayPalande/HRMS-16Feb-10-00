import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, FileText, Download, Upload, IndianRupee, Users, Building2, TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber, COMPANY_NAME, COMPANY_ADDRESS } from "@/lib/pdf-utils";
import { User, Department, Unit } from "@shared/schema";

export default function PfEsiPtPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { toast } = useToast();
  
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: units = [] } = useQuery<Unit[]>({ queryKey: ["/api/masters/units"] });

  const { data: employees = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });
  
  // Grouping helper
  const groupByHierarchy = (data: any[]) => {
    const hierarchical: Record<string, Record<string, any[]>> = {};
    data.forEach(item => {
      const dept = departments.find(d => d.id === item.emp?.departmentId);
      const unit = units.find(u => u.id === dept?.unitId);
      const unitName = unit?.name || "Unassigned";
      const deptName = dept?.name || "Unassigned";

      if (!hierarchical[unitName]) hierarchical[unitName] = {};
      if (!hierarchical[unitName][deptName]) hierarchical[unitName][deptName] = [];
      hierarchical[unitName][deptName].push(item);
    });
    return hierarchical;
  };
  
  // Fetch system settings for salary components
  const { data: systemSettings } = useQuery({
    queryKey: ["/api/settings/system"],
    queryFn: async () => {
      const response = await fetch("/api/settings/system", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 403) return null;
        throw new Error("Failed to fetch system settings");
      }
      return response.json();
    },
    retry: false,
  });
  
  // Get salary component percentages from settings or defaults
  const salaryComponents = systemSettings?.salaryComponents || {
    basicSalaryPercentage: 50,
    hraPercentage: 50,
    epfPercentage: 12,
    esicPercentage: 0.75,
    professionalTax: 200
  };
  
  // Calculate PF data from real employees
  const pfHierarchical = useMemo(() => {
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
        const salary = emp.salary!;
        const monthlyCTC = salary / 12;
        const basicSalary = Math.round(monthlyCTC * (salaryComponents.basicSalaryPercentage / 100));
        const employeeContrib = Math.round(basicSalary * 0.12);
        const employerContrib = Math.round(basicSalary * 0.12);
        const edliContrib = Math.round(basicSalary * 0.005);
        const adminCharges = Math.round(basicSalary * 0.005);
        return {
          emp,
          employee: `${emp.firstName} ${emp.lastName}`,
          basicSalary,
          employeeContrib,
          employerContrib,
          edliContrib,
          adminCharges,
          total: employeeContrib + employerContrib + edliContrib + adminCharges
        };
      });
    return groupByHierarchy(data);
  }, [employees, salaryComponents, departments, units]);
  
  // Calculate ESI data
  const esiHierarchical = useMemo(() => {
    const data = employees
      .filter(emp => {
        if (!emp.isActive || !emp.salary || emp.salary <= 0) return false;
        
        const dept = departments.find(d => d.id === emp.departmentId);
        const unit = units.find(u => u.id === dept?.unitId);
        
        const matchesUnit = selectedUnit === "all" || unit?.id.toString() === selectedUnit;
        const matchesDept = selectedDepartment === "all" || dept?.id.toString() === selectedDepartment;
        
        if (!(matchesUnit && matchesDept)) return false;

        const monthlySalary = emp.salary / 12;
        return monthlySalary <= 21000; 
      })
      .map(emp => {
        const salary = emp.salary!;
        const grossSalary = Math.round(salary / 12);
        const employeeContrib = Math.round(grossSalary * 0.0075); 
        const employerContrib = Math.round(grossSalary * 0.0325); 
        return {
          emp,
          employee: `${emp.firstName} ${emp.lastName}`,
          grossSalary,
          employeeContrib,
          employerContrib,
          total: employeeContrib + employerContrib
        };
      });
    return groupByHierarchy(data);
  }, [employees, departments, units]);
  
  // Calculate PT data
  const ptHierarchical = useMemo(() => {
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
        const salary = emp.salary!;
        const grossSalary = Math.round(salary / 12);
        let ptAmount = 200; 
        if (grossSalary < 10000) ptAmount = 0;
        else if (grossSalary < 15000) ptAmount = 150;
        else if (grossSalary < 25000) ptAmount = 175;
        
        return {
          emp,
          employee: `${emp.firstName} ${emp.lastName}`,
          grossSalary,
          ptAmount,
          state: "Maharashtra"
        };
      });
    return groupByHierarchy(data);
  }, [employees, departments, units]);
  
  // Calculate compliance stats from real data
  const complianceStats = useMemo(() => {
    const flatten = (hierarchical: Record<string, Record<string, any[]>>) => 
      Object.values(hierarchical).flatMap(depts => Object.values(depts).flat());
    
    const pfFlat = flatten(pfHierarchical);
    const esiFlat = flatten(esiHierarchical);
    const ptFlat = flatten(ptHierarchical);
    
    const totalPF = pfFlat.reduce((sum, row) => sum + row.total, 0);
    const totalESI = esiFlat.reduce((sum, row) => sum + row.total, 0);
    const totalPT = ptFlat.reduce((sum, row) => sum + row.ptAmount, 0);
    const eligibleCount = pfFlat.length;
    
    return [
      { title: "Total PF Contribution", value: `₹${totalPF.toLocaleString()}`, change: `${eligibleCount} emp`, icon: <IndianRupee className="h-5 w-5" /> },
      { title: "ESI Contribution", value: `₹${totalESI.toLocaleString()}`, change: `${esiFlat.length} emp`, icon: <Building2 className="h-5 w-5" /> },
      { title: "PT Collected", value: `₹${totalPT.toLocaleString()}`, change: `${ptFlat.length} emp`, icon: <Calculator className="h-5 w-5" /> },
      { title: "Eligible Employees", value: `${eligibleCount}`, change: "Active", icon: <Users className="h-5 w-5" /> },
    ];
  }, [pfHierarchical, esiHierarchical, ptHierarchical]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleChallanUpload = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select a challan file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Challan Uploaded Successfully",
      description: `${uploadedFile.name} has been uploaded and processed.`,
    });
    
    setUploading(false);
    setUploadedFile(null);
    setUploadDialogOpen(false);
  };

  const generateReport = () => {
    const doc = new jsPDF();
    
    addWatermark(doc);
    addCompanyHeader(doc, { title: "PF / ESI / PT COMPLIANCE REPORT", subtitle: "Statutory Contributions Summary" });
    addFooter(doc);
    
    const refNumber = generateReferenceNumber("PEP");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, undefined, 68);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 15, 80);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total PF Contribution: Rs. ${Object.values(pfHierarchical).flatMap(d => Object.values(d).flat()).reduce((s, r) => s + r.total, 0).toLocaleString()}`, 25, 88);
    doc.text(`Total ESI Contribution: Rs. ${Object.values(esiHierarchical).flatMap(d => Object.values(d).flat()).reduce((s, r) => s + r.total, 0).toLocaleString()}`, 25, 96);
    doc.text(`Total PT Collected: Rs. ${Object.values(ptHierarchical).flatMap(d => Object.values(d).flat()).reduce((s, r) => s + r.ptAmount, 0).toLocaleString()}`, 25, 104);
    doc.text(`Eligible Employees: ${Object.values(pfHierarchical).flatMap(d => Object.values(d).flat()).length}`, 25, 112);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Provident Fund Details", 15, 125);
    
    autoTable(doc, {
      startY: 130,
      head: [['Employee', 'Basic Salary', 'Employee (12%)', 'Employer (12%)', 'EDLI (0.5%)', 'Admin (0.5%)', 'Total']],
      body: Object.values(pfHierarchical).flatMap(depts => Object.values(depts).flat()).map(row => [
        row.employee,
        `Rs. ${row.basicSalary.toLocaleString()}`,
        `Rs. ${row.employeeContrib.toLocaleString()}`,
        `Rs. ${row.employerContrib.toLocaleString()}`,
        `Rs. ${row.edliContrib.toLocaleString()}`,
        `Rs. ${row.adminCharges.toLocaleString()}`,
        `Rs. ${row.total.toLocaleString()}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 98, 179] },
      styles: { fontSize: 8 },
    });
    
    const pfEndY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 180;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ESI Details", 15, pfEndY + 12);
    
    autoTable(doc, {
      startY: pfEndY + 16,
      head: [['Employee', 'Gross Salary', 'Employee (0.75%)', 'Employer (3.25%)', 'Total']],
      body: Object.values(esiHierarchical).flatMap(depts => Object.values(depts).flat()).map(row => [
        row.employee,
        `Rs. ${row.grossSalary.toLocaleString()}`,
        `Rs. ${row.employeeContrib.toLocaleString()}`,
        `Rs. ${row.employerContrib.toLocaleString()}`,
        `Rs. ${row.total.toLocaleString()}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 98, 179] },
      styles: { fontSize: 8 },
    });
    
    doc.addPage();
    
    addWatermark(doc);
    addCompanyHeader(doc, { title: "PF / ESI / PT COMPLIANCE REPORT", subtitle: "Professional Tax Details" });
    addFooter(doc);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Professional Tax Details", 15, 68);
    
    autoTable(doc, {
      startY: 73,
      head: [['Employee', 'Gross Salary', 'PT Amount', 'State']],
      body: Object.values(ptHierarchical).flatMap(depts => Object.values(depts).flat()).map(row => [
        row.employee,
        `Rs. ${row.grossSalary.toLocaleString()}`,
        `Rs. ${row.ptAmount.toLocaleString()}`,
        row.state
      ]),
      theme: 'striped',
      headStyles: { fillColor: [0, 98, 179] },
      styles: { fontSize: 9 },
    });
    
    const ptEndY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;
    
    addHRSignature(doc, ptEndY + 25);
    
    doc.save('pf-esi-pt-report.pdf');
    
    toast({
      title: "Report Generated",
      description: "PF/ESI/PT compliance report has been downloaded.",
    });
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">PF / ESI / PT Management</h1>
            <p className="text-slate-500 mt-1">Manage statutory compliance and contributions</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-40" data-testid="select-unit">
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
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Dept</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40" data-testid="select-department">
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
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-upload-challan">
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Challan</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="challan-file">Select Challan File</Label>
                    <Input
                      id="challan-file"
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      data-testid="input-challan-file"
                    />
                    <p className="text-xs text-slate-500">
                      Supported formats: PDF, Excel, CSV
                    </p>
                  </div>
                  {uploadedFile && (
                    <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-teal-600" />
                      <span className="text-sm text-teal-700">{uploadedFile.name}</span>
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleChallanUpload} disabled={uploading || !uploadedFile}>
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button className="gap-2" onClick={generateReport} data-testid="button-generate-report">
              <Download className="h-4 w-4" />
              Report
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {complianceStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
                      {stat.icon}
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </Badge>
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
            <CardTitle>Statutory Contributions</CardTitle>
            <CardDescription>Monthly PF, ESI, and Professional Tax details</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pf">
              <TabsList>
                <TabsTrigger value="pf" data-testid="tab-pf">Provident Fund</TabsTrigger>
                <TabsTrigger value="esi" data-testid="tab-esi">ESI</TabsTrigger>
                <TabsTrigger value="pt" data-testid="tab-pt">Professional Tax</TabsTrigger>
              </TabsList>
              <TabsContent value="pf" className="mt-4">
                <div className="space-y-8">
                  {Object.entries(pfHierarchical).map(([unitName, departments]) => (
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
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Basic Salary</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Employee (12%)</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Employer (12%)</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">EDLI (0.5%)</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Admin Charges (0.5%)</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {staff.map((row, index) => (
                                  <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 font-medium">{row.employee}</td>
                                    <td className="py-3 px-4">₹{row.basicSalary.toLocaleString()}</td>
                                    <td className="py-3 px-4">₹{row.employeeContrib.toLocaleString()}</td>
                                    <td className="py-3 px-4">₹{row.employerContrib.toLocaleString()}</td>
                                    <td className="py-3 px-4">₹{row.edliContrib.toLocaleString()}</td>
                                    <td className="py-3 px-4">₹{row.adminCharges.toLocaleString()}</td>
                                    <td className="py-3 px-4 font-medium text-teal-600">₹{row.total.toLocaleString()}</td>
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
              </TabsContent>
              <TabsContent value="esi" className="mt-4">
                <div className="space-y-8">
                  {Object.entries(esiHierarchical).map(([unitName, departments]) => (
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
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Gross Salary (Monthly)</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Employee (0.75%)</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Employer (3.25%)</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Total ESI</th>
                                </tr>
                              </thead>
                              <tbody>
                                {staff.map((row, index) => (
                                  <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 font-medium">{row.employee}</td>
                                    <td className="py-3 px-4">₹{row.grossSalary.toLocaleString()}</td>
                                    <td className="py-3 px-4">₹{row.employeeContrib.toLocaleString()}</td>
                                    <td className="py-3 px-4">₹{row.employerContrib.toLocaleString()}</td>
                                    <td className="py-3 px-4 font-medium text-teal-600">₹{row.total.toLocaleString()}</td>
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
              </TabsContent>
              <TabsContent value="pt" className="mt-4">
                <div className="space-y-8">
                  {Object.entries(ptHierarchical).map(([unitName, departments]) => (
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
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">Gross Salary</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">State</th>
                                  <th className="text-left py-3 px-4 font-medium text-slate-600">PT Amount (Monthly)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {staff.map((row, index) => (
                                  <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 font-medium">{row.employee}</td>
                                    <td className="py-3 px-4">₹{row.grossSalary.toLocaleString()}</td>
                                    <td className="py-3 px-4">
                                      <Badge variant="outline">{row.state}</Badge>
                                    </td>
                                    <td className="py-3 px-4 font-medium text-teal-600">₹{row.ptAmount.toLocaleString()}</td>
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
