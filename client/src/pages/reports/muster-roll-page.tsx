import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, FileSpreadsheet, FileText, Upload, Building2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/app-layout";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Department, Unit, User } from "@shared/schema";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  position: string;
  departmentId: number;
  dateOfBirth?: string;
  gender?: string;
  joinDate?: string;
  basicSalary?: number;
  hra?: number;
  salary?: number;
}

interface Attendance {
  id: number;
  userId: number;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  hoursWorked?: number;
}

interface PayrollRecord {
  id: number;
  userId: number;
  month: number;
  year: number;
  basicSalary: number;
  hra?: number;
  allowances?: number;
  deductions?: number;
  pfContribution?: number;
  esiContribution?: number;
  netSalary: number;
  status: string;
}

export default function MusterRollPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [establishmentName, setEstablishmentName] = useState("ASN HR Consultancy & Services");
  const [employerName, setEmployerName] = useState("ASN HR Consultancy");
  const [viewType, setViewType] = useState<"muster" | "wage">("muster");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: units = [] } = useQuery<Unit[]>({ queryKey: ["/api/masters/units"] });

  const hierarchicalData = useMemo(() => {
    const data = employees.filter(emp => {
      const dept = departments.find(d => d.id === emp.departmentId);
      const unit = units.find(u => u.id === dept?.unitId);
      
      const matchesUnit = selectedUnit === "all" || unit?.id.toString() === selectedUnit;
      const matchesDept = selectedDepartment === "all" || dept?.id.toString() === selectedDepartment;
      
      return matchesUnit && matchesDept;
    }).map(emp => {
      const dept = departments.find(d => d.id === emp.departmentId);
      const unit = units.find(u => u.id === dept?.unitId);
      return {
        ...emp,
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
  }, [employees, departments, units]);

  const { data: attendanceRecords = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: payrollRecords = [] } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/payroll"],
  });

  const getPayrollForEmployee = (employeeId: number): PayrollRecord | undefined => {
    return payrollRecords.find(
      p => p.userId === employeeId && p.month === selectedMonth && p.year === selectedYear
    );
  };

  const months = [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 4 + i);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  const getAttendanceForDay = (employeeId: number, day: number): string => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendanceRecords.find(
      (a) => {
        const recordDate = new Date(a.date);
        const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
        return a.userId === employeeId && recordDateStr === dateStr;
      }
    );
    if (!record) return "-";
    switch (record.status) {
      case "present": return "P";
      case "absent": return "A";
      case "half-day": return "H";
      case "leave": return "L";
      case "holiday": return "HO";
      case "weekly-off": return "WO";
      default: return "-";
    }
  };

  const getHoursWorkedForDay = (employeeId: number, day: number): number => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendanceRecords.find(
      (a) => {
        const recordDate = new Date(a.date);
        const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
        return a.userId === employeeId && recordDateStr === dateStr;
      }
    );
    return record?.hoursWorked || 0;
  };

  const calculateEmployeeData = (employee: Employee) => {
    let totalDaysWorked_raw = 0;
    let totalHoursWorked_raw = 0;
    let overtimeHours_raw = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const status = getAttendanceForDay(employee.id, day);
      if (status === "P") {
        totalDaysWorked_raw++;
        const hours = getHoursWorkedForDay(employee.id, day);
        totalHoursWorked_raw += hours;
        if (hours > 8) overtimeHours_raw += hours - 8;
      } else if (status === "H") {
        totalDaysWorked_raw += 0.5;
        totalHoursWorked_raw += 4;
      }
    }

    const payrollData = getPayrollForEmployee(employee.id);
    const totalDaysInMonth = daysInMonth;
    const totalDaysWorked = Number(totalDaysWorked_raw.toFixed(1));
    const totalHoursWorked = totalHoursWorked_raw;
    const overtimeHours = overtimeHours_raw;

    const basicSalary = employee.basicSalary || 0;
    const hra = employee.hra || 0;
    const proRatedBasic = Math.round((basicSalary / totalDaysInMonth) * totalDaysWorked);
    const proRatedHra = Math.round((hra / totalDaysInMonth) * totalDaysWorked);
    
    const dailyRate = basicSalary / 26;
    const hourlyRate = dailyRate / 8;
    const normalWages = proRatedBasic;
    const hraPayable = proRatedHra;
    const overtimePayable = Math.round(totalHoursWorked > 0 ? (overtimeHours * hourlyRate * 2) : 0);
    const allowances = payrollData?.allowances || 0;
    const grossWages = normalWages + hraPayable + overtimePayable + allowances;
    const pfDeduction = payrollData?.pfContribution || Math.round(proRatedBasic * 0.12);
    const esiDeduction = payrollData?.esiContribution || (grossWages <= 21000 ? Math.round(grossWages * 0.0075) : 0);
    const otherDeductions = payrollData?.deductions || 0;
    const totalDeductions = pfDeduction + esiDeduction + otherDeductions;
    const netWages = Math.max(0, payrollData?.netSalary || (grossWages - totalDeductions));

    return {
      totalDaysWorked,
      totalHoursWorked,
      overtimeHours,
      dailyRate: Math.round(dailyRate),
      basicSalary: proRatedBasic,
      normalWages,
      hraPayable,
      overtimePayable,
      allowances,
      grossWages,
      pfDeduction,
      esiDeduction,
      otherDeductions,
      totalDeductions,
      netWages
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const monthName = months.find(m => m.value === selectedMonth)?.label || "";
    
    doc.setFontSize(16);
    doc.text(viewType === "muster" ? "FORM II - MUSTER ROLL" : "FORM II - WAGE REGISTER", doc.internal.pageSize.width / 2, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(`[See Rule 27(1)]`, doc.internal.pageSize.width / 2, 22, { align: "center" });
    
    doc.text(`Establishment: ${establishmentName}`, 14, 32);
    doc.text(`Employer: ${employerName}`, 14, 38);
    doc.text(`Month: ${monthName} ${selectedYear}`, doc.internal.pageSize.width - 60, 32);

    const body = Object.values(hierarchicalData).flatMap(depts => Object.values(depts).flat()).map((emp, index) => {
      const data = calculateEmployeeData(emp);
      const row = [
        index + 1,
        `${emp.firstName} ${emp.lastName}`,
        emp.position || "Worker",
        data.totalDaysWorked,
      ];
      
      if (viewType === "wage") {
        row.push(
          `Rs. ${data.basicSalary.toLocaleString()}`,
          `Rs. ${data.hraPayable.toLocaleString()}`,
          `Rs. ${data.pfDeduction.toLocaleString()}`,
          `Rs. ${data.esiDeduction.toLocaleString()}`,
          `Rs. ${data.grossWages.toLocaleString()}`,
          `Rs. ${data.netWages.toLocaleString()}`
        );
      }
      return row;
    });

    autoTable(doc, {
      startY: 45,
      head: [viewType === "muster" 
        ? ["Sl No", "Employee Name", "Designation", "Days Worked"]
        : ["Sl No", "Employee Name", "Designation", "Days", "Basic", "HRA", "PF", "ESI", "Gross", "Net"]
      ],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [0, 121, 107] },
      styles: { fontSize: 8 }
    });

    doc.save(`${viewType}_report_${monthName}_${selectedYear}.pdf`);
  };

  const exportToExcel = () => {
    const flatData = Object.values(hierarchicalData).flatMap(depts => Object.values(depts).flat()).map((emp, index) => {
      const data = calculateEmployeeData(emp);
      return {
        "Sl No": index + 1,
        "Employee Name": `${emp.firstName} ${emp.lastName}`,
        "Designation": emp.position || "Worker",
        "Days Worked": data.totalDaysWorked,
        "Basic Salary": data.basicSalary,
        "HRA": data.hraPayable,
        "PF": data.pfDeduction,
        "ESI": data.esiDeduction,
        "Gross Wages": data.grossWages,
        "Net Wages": data.netWages
      };
    });
    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Muster Roll");
    XLSX.writeFile(wb, `Muster_Roll_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white" data-testid="text-page-title">Muster Roll & Wage Register</h1>
              <p className="text-slate-500 font-medium">Maharashtra Factories Rules • Form II Compliance</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="hover-elevate font-bold shadow-sm" onClick={handlePrint} data-testid="button-print">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" className="hover-elevate font-bold shadow-sm text-teal-600 border-teal-200" onClick={exportToPDF} data-testid="button-export-pdf">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button className="hover-elevate font-bold shadow-md bg-teal-600 hover:bg-teal-700" onClick={exportToExcel} data-testid="button-export-excel">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </motion.div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report Settings</CardTitle>
                <Tabs value={viewType} onValueChange={(v) => setViewType(v as "muster" | "wage")} className="w-auto">
                  <TabsList className="grid w-64 grid-cols-2">
                    <TabsTrigger value="muster">Muster Roll</TabsTrigger>
                    <TabsTrigger value="wage">Wage Register</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <div className="space-y-2">
                  <Label>Establishment Name</Label>
                  <Input 
                    value={establishmentName} 
                    onChange={(e) => setEstablishmentName(e.target.value)}
                    data-testid="input-establishment-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employer Name</Label>
                  <Input 
                    value={employerName} 
                    onChange={(e) => setEmployerName(e.target.value)}
                    data-testid="input-employer-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                    <SelectTrigger data-testid="select-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                    <SelectTrigger data-testid="select-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="print:shadow-none">
            <CardHeader className="print:pb-2">
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">{viewType === "muster" ? "Form II - Muster Roll" : "Form II - Wage Register"}</p>
                <p className="text-xs text-muted-foreground">[See Rule 27(1)]</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p><strong>Name of the Establishment:</strong> {establishmentName}</p>
                  <p><strong>Name of the Employer:</strong> {employerName}</p>
                </div>
                <div className="text-right">
                  <p><strong>For the month of:</strong> {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="space-y-8">
                {Object.entries(hierarchicalData).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No employees found. Add employees to generate report.
                  </div>
                ) : (
                  Object.entries(hierarchicalData).map(([unitName, departments]) => (
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
                          
                          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white dark:bg-slate-950">
                            <Table className="text-xs">
                              <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                  <TableHead className="text-center w-10 border-r" rowSpan={2}>Sl No</TableHead>
                                  <TableHead className="min-w-[180px] border-r" rowSpan={2}>Full name of employee</TableHead>
                                  <TableHead className="text-center w-16 border-r" rowSpan={2}>Age/Sex</TableHead>
                                  <TableHead className="min-w-[120px] border-r" rowSpan={2}>Designation</TableHead>
                                  <TableHead className="text-center border-b" colSpan={daysInMonth}>Attendance Details</TableHead>
                                  <TableHead className="text-center w-12 border-l" rowSpan={2}>{viewType === "muster" ? "Total Days" : "Days"}</TableHead>
                                  {viewType === "wage" && (
                                    <>
                                      <TableHead className="text-center w-24 border-l" rowSpan={2}>Basic Wages</TableHead>
                                      <TableHead className="text-center w-20 border-l" rowSpan={2}>HRA</TableHead>
                                      <TableHead className="text-center w-20 border-l" rowSpan={2}>PF</TableHead>
                                      <TableHead className="text-center w-20 border-l" rowSpan={2}>ESI</TableHead>
                                      <TableHead className="text-center w-24 border-l" rowSpan={2}>Gross</TableHead>
                                      <TableHead className="text-center w-20 border-l" rowSpan={2}>Ded.</TableHead>
                                      <TableHead className="text-center w-28 border-l bg-teal-50 dark:bg-teal-900/20" rowSpan={2}>Net Amount</TableHead>
                                    </>
                                  )}
                                </TableRow>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                                  {Array.from({ length: daysInMonth }, (_, i) => (
                                    <TableHead key={i} className="text-center w-8 p-1 border-r text-[10px] font-bold">{i + 1}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {staff.map((emp, index) => {
                                  const data = calculateEmployeeData(emp);
                                  const dob = emp.dateOfBirth ? new Date(emp.dateOfBirth) : null;
                                  const age = dob ? Math.floor((new Date().getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : "-";

                                  return (
                                    <TableRow key={emp.id} data-testid={`row-employee-${emp.id}`} className="hover:bg-slate-50/50 transition-colors">
                                      <TableCell className="text-center border-r font-medium text-slate-500">{index + 1}</TableCell>
                                      <TableCell className="font-semibold border-r text-slate-900 dark:text-slate-100 min-w-[180px]">{emp.firstName} {emp.lastName}</TableCell>
                                      <TableCell className="text-center border-r text-slate-600 font-medium whitespace-nowrap">{age}/{emp.gender?.[0] || "M"}</TableCell>
                                      <TableCell className="border-r text-slate-600 font-medium">{emp.position || "Worker"}</TableCell>
                                      {Array.from({ length: daysInMonth }, (_, i) => (
                                        <TableCell key={i} className={cn(
                                          "text-center p-1 border-r text-[10px] font-black",
                                          getAttendanceForDay(emp.id, i + 1) === 'P' ? "text-emerald-600 bg-emerald-50/20" : 
                                          getAttendanceForDay(emp.id, i + 1) === 'A' ? "text-rose-600 bg-rose-50/20" : 
                                          getAttendanceForDay(emp.id, i + 1) === 'L' ? "text-amber-600 bg-amber-50/20" :
                                          "text-slate-400"
                                        )}>
                                          {getAttendanceForDay(emp.id, i + 1)}
                                        </TableCell>
                                      ))}
                                      <TableCell className="text-center font-black border-l bg-slate-50/50 text-slate-900">{data.totalDaysWorked}</TableCell>
                                      {viewType === "wage" && (
                                        <>
                                          <TableCell className="text-right border-l font-bold text-slate-700">₹{data.basicSalary.toLocaleString()}</TableCell>
                                          <TableCell className="text-right border-l font-bold text-slate-700">₹{data.hraPayable.toLocaleString()}</TableCell>
                                          <TableCell className="text-right border-l font-bold text-amber-600 bg-amber-50/10">₹{data.pfDeduction.toLocaleString()}</TableCell>
                                          <TableCell className="text-right border-l font-bold text-amber-600 bg-amber-50/10">₹{data.esiDeduction.toLocaleString()}</TableCell>
                                          <TableCell className="text-right border-l font-black text-slate-900 dark:text-slate-100 bg-slate-50/30">₹{data.grossWages.toLocaleString()}</TableCell>
                                          <TableCell className="text-right border-l font-bold text-rose-600 bg-rose-50/10">₹{data.totalDeductions.toLocaleString()}</TableCell>
                                          <TableCell className="text-right border-l font-black text-teal-700 bg-teal-50/50 dark:bg-teal-900/20 shadow-inner">{data.netWages.toLocaleString()}</TableCell>
                                        </>
                                      )}
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
