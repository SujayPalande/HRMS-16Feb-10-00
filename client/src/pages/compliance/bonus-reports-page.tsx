import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportToExcel, exportToTxt } from "@/lib/export-utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber } from "@/lib/pdf-utils";
import { Download, Gift, FileSpreadsheet, FileText, FileDown, Building2, Search, Calendar, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { User, Department, Unit } from "@shared/schema";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

export default function BonusReportsPage() {
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
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
      const date = new Date(selectedYear, selectedMonth, 1);
      startDate = new Date(date.setHours(0, 0, 0, 0));
      endDate = new Date(date.setHours(23, 59, 59, 999));
    } else if (selectedPeriod === "week") {
      const date = new Date(selectedYear, selectedMonth, 1);
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

  const { data: units = [] } = useQuery<Unit[]>({ queryKey: ["/api/masters/units"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: employees = [] } = useQuery<User[]>({ queryKey: ["/api/employees"] });

  const filteredEmployees = employees.filter(emp => {
    const dept = departments.find(d => d.id === emp.departmentId);
    const matchesUnit = selectedUnit === 'all' || (dept && dept.unitId === parseInt(selectedUnit));
    const matchesDept = selectedDept === 'all' || emp.departmentId === parseInt(selectedDept);
    const matchesSearch = searchQuery === "" || 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.employeeId || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUnit && matchesDept && matchesSearch;
  });

  const hierarchicalBonusData = useMemo(() => {
    const { startDate, endDate } = getReportPeriod();
    const data = filteredEmployees
      .filter(emp => emp.isActive && emp.salary && emp.salary > 0)
      .filter(emp => {
        const joinDate = emp.joinDate ? new Date(emp.joinDate) : null;
        return !joinDate || joinDate <= endDate;
      })
      .map(emp => {
        const monthlyCTC = emp.salary!;
        const totalDaysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysToConsider = Math.min(30, totalDaysInPeriod);
        
        const grossSalary = Math.round((monthlyCTC / 30) * daysToConsider);
        const basicSalary = Math.round(grossSalary * 0.5);
        const bonusEligibleSalary = Math.min(basicSalary, 7000);
        const bonusAmount = Math.round((bonusEligibleSalary * 8.33 / 100));
        
        const dept = departments.find(d => d.id === emp.departmentId);
        const unit = units.find(u => u.id === dept?.unitId);
        
        return {
          employeeId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          designation: emp.position,
          annualBonus: bonusAmount,
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
  }, [filteredEmployees, departments, units, selectedPeriod, selectedMonth, selectedYear]);

  const totalBonus = Object.values(hierarchicalBonusData)
    .flatMap(depts => Object.values(depts).flat())
    .reduce((sum, item) => sum + item.annualBonus, 0);

  const bonusStats = [
    { title: "Total Bonus", value: `₹${totalBonus.toLocaleString()}`, icon: <Gift className="h-6 w-6" />, color: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" },
    { title: "Eligible Employees", value: Object.values(hierarchicalBonusData).flatMap(depts => Object.values(depts).flat()).length.toString(), icon: <Users className="h-6 w-6" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "Avg Bonus", value: `₹${totalBonus ? Math.round(totalBonus / Object.values(hierarchicalBonusData).flatMap(depts => Object.values(depts).flat()).length).toLocaleString() : 0}`, icon: <TrendingUp className="h-6 w-6" />, color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    { title: "Units", value: units.length.toString(), icon: <Building2 className="h-6 w-6" />, color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" },
  ];

  const exportToExcel = () => {
    const flatData = Object.values(hierarchicalBonusData).flatMap(depts => Object.values(depts).flat());
    const dataForExport = flatData.map(item => ({
      "Emp ID": item.employeeId,
      "Name": item.name,
      "Designation": item.designation,
      "Annual Bonus": item.annualBonus,
      "Department": item.departmentName,
      "Unit": item.unitName
    }));
    XLSX.utils.json_to_sheet(dataForExport); // Keep for original functionality if needed
    
    // Using helper
    import("@/lib/export-utils").then(module => {
      module.exportToExcel(dataForExport, `Bonus_Report_${monthsList[selectedMonth]}_${selectedYear}`);
    });
    toast({ title: "Bonus Report Exported", description: "Excel file generated." });
  };

  const handleExportTxt = () => {
    const flatData = Object.values(hierarchicalBonusData).flatMap(depts => Object.values(depts).flat());
    const dataForExport = flatData.map(item => ({
      "Emp ID": item.employeeId,
      "Name": item.name,
      "Designation": item.designation,
      "Annual Bonus": item.annualBonus,
      "Department": item.departmentName,
      "Unit": item.unitName
    }));
    exportToTxt(dataForExport, `Bonus_Report_${monthsList[selectedMonth]}_${selectedYear}`, "Bonus Report");
    toast({ title: "Export Successful", description: "Text report has been downloaded." });
  };

  const generateReport = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    addWatermark(doc);
    addCompanyHeader(doc, { 
      title: "BONUS SUMMARY STATEMENT FOR THE YEAR", 
      subtitle: `${selectedYear}` 
    });
    addFooter(doc);
    const refNumber = generateReferenceNumber("BON");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, undefined, 68);
    
    const flatData = Object.values(hierarchicalBonusData).flatMap(depts => 
      Object.values(depts).flat()
    );

    autoTable(doc, {
      startY: 80,
      head: [['Sr.No.', 'Employee ID', 'Employee Name', 'Designation', 'Annual Wages', 'Bonus Amount (8.33%)']],
      body: flatData.map((row, idx) => [
        idx + 1,
        row.employeeId,
        row.name,
        row.designation,
        "N/A", // placeholder for annual wages
        row.annualBonus.toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]),
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      foot: [[
        { content: 'TOTALS', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } },
        flatData.reduce((sum, r) => sum + r.annualBonus, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    
    addHRSignature(doc, (doc as any).lastAutoTable.finalY + 20);
    doc.save(`Bonus-Report-${selectedYear}.pdf`);
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-page-title">Bonus Reports</h1>
            <p className="text-slate-500 mt-1">Generate and view employee bonus details</p>
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
            <Button variant="outline" className="gap-2" onClick={exportToExcel} data-testid="button-export-excel">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExportTxt} data-testid="button-export-txt">
              <FileText className="h-4 w-4" /> Text
            </Button>
            <Button className="gap-2" onClick={generateReport} data-testid="button-generate-report">
              <FileDown className="h-4 w-4" /> PDF
            </Button>
          </div>
        </motion.div>

        <div className="flex gap-4 mb-6">
          <div className="w-64">
            <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Unit</label>
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
          <div className="w-64">
            <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Department</label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger data-testid="select-department">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {units.find(u => u.id.toString() === selectedUnit) ? 
                  departments.filter(d => d.unitId === parseInt(selectedUnit)).map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  )) : 
                  departments.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bonusStats.map((stat, index) => (
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
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-teal-600" />
                  Bonus Calculations
                </CardTitle>
                <CardDescription>Annual statutory bonus summary</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {Object.entries(hierarchicalBonusData).map(([unitName, departments]) => (
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
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Emp ID</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Employee Name</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Designation</th>
                              <th className="text-left py-3 px-4 text-slate-600 font-semibold">Annual Bonus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staff.map((row, index) => (
                              <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 text-slate-600">{row.employeeId}</td>
                                <td className="py-3 px-4 font-medium text-slate-900">{row.name}</td>
                                <td className="py-3 px-4 text-slate-600">{row.designation}</td>
                                <td className="py-3 px-4 font-bold text-teal-600">₹{row.annualBonus.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {Object.keys(hierarchicalBonusData).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">No employees found matching the current filters.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}