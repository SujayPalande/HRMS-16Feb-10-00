import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, FileSpreadsheet, Download, FileText, Upload, Building2, Users, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/app-layout";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Department, Unit } from "@shared/schema";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  position: string;
  departmentId: number;
  joinDate?: string;
  basicSalary?: number;
  salary?: number;
}

interface Leave {
  id: number;
  userId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
}

interface Attendance {
  id: number;
  userId: number;
  date: string;
  status: string;
  hoursWorked?: number;
}

interface PayrollRecord {
  id: number;
  userId: number;
  month: number;
  year: number;
  basicSalary: number;
  netSalary: number;
}

export default function LeaveRegisterPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [factoryName, setFactoryName] = useState("ASN HR Consultancy & Services");

  const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

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

  const { data: leaveRequests = [] } = useQuery<Leave[]>({
    queryKey: ["/api/leave-requests"],
  });

  const { data: attendanceRecords = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: payrollRecords = [] } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/payroll"],
  });

  const getAverageBasicSalary = (employeeId: number): number => {
    const yearRecords = payrollRecords.filter(
      p => p.userId === employeeId && p.year === selectedYear
    );
    if (yearRecords.length > 0) {
      return Math.round(yearRecords.reduce((sum, r) => sum + r.basicSalary, 0) / yearRecords.length);
    }
    return 0;
  };

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 4 + i);

  const calculateLeaveData = (employee: Employee) => {
    // Financial Year 2025-2026: April 1, 2025 to March 31, 2026
    const yearStart = new Date(selectedYear, 3, 1);
    const yearEnd = new Date(selectedYear + 1, 2, 31);

    const yearAttendance = attendanceRecords.filter(a => {
      const date = new Date(a.date);
      return a.userId === employee.id && date >= yearStart && date <= yearEnd;
    });

    const daysWorked = yearAttendance.filter(a => a.status === "present" || a.status === "P").length;
    const layOffDays = yearAttendance.filter(a => a.status === "layoff").length;
    
    const employeeLeaves = leaveRequests.filter(l => {
      const start = new Date(l.startDate);
      return l.userId === employee.id && 
             l.status === "approved" && 
             start >= yearStart && start <= yearEnd;
    });

    const maternityLeave = employeeLeaves
      .filter(l => l.leaveType === "maternity")
      .reduce((sum, l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

    const leaveEnjoyed = employeeLeaves
      .filter(l => l.leaveType !== "maternity")
      .reduce((sum, l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

    const earnedLeave = Math.max(0, Math.floor(daysWorked / 20));
    const previousBalance = 0;
    const totalLeave = earnedLeave + previousBalance;
    const balanceLeave = Math.max(0, totalLeave - leaveEnjoyed);

    const payrollBasic = getAverageBasicSalary(employee.id);
    const basicSalary = payrollBasic || employee.basicSalary || employee.salary || 15000;
    const dailyRate = Math.round(basicSalary / 26);
    const leaveWages = Math.max(0, dailyRate * leaveEnjoyed);

    return {
      daysWorked,
      layOffDays,
      maternityLeave,
      leaveEnjoyed,
      totalDays: daysWorked + layOffDays + maternityLeave + leaveEnjoyed,
      previousBalance,
      earnedLeave,
      totalLeave,
      balanceLeave,
      basicSalary,
      dailyRate,
      leaveWages
    };
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    doc.setFontSize(12);
    doc.text("The Maharashtra Factories Rules", doc.internal.pageSize.width / 2, 12, { align: "center" });
    doc.setFontSize(16);
    doc.text("FORM 20", doc.internal.pageSize.width / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("(See Rules 105 and 106)", doc.internal.pageSize.width / 2, 26, { align: "center" });
    doc.text("Register of leave with wages", doc.internal.pageSize.width / 2, 32, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Factory: ${factoryName}`, 14, 42);
    doc.text(`Part I - Adults`, doc.internal.pageSize.width - 60, 42);
    doc.text(`Financial Year: ${selectedYear}-${selectedYear + 1}`, doc.internal.pageSize.width - 60, 48);

    const tableData = Object.values(hierarchicalData).flatMap(depts => Object.values(depts).flat()).map((emp, index) => {
      const data = calculateLeaveData(emp);
      return [
        index + 1,
        emp.employeeId,
        `${emp.firstName} ${emp.lastName}`,
        emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN') : "-",
        data.daysWorked,
        data.layOffDays,
        data.maternityLeave,
        data.leaveEnjoyed,
        data.totalDays,
        data.previousBalance,
        data.earnedLeave,
        data.balanceLeave,
        data.dailyRate,
        data.leaveWages > 0 ? data.leaveWages : "-"
      ];
    });

    autoTable(doc, {
      startY: 54,
      head: [[
        "Sr.", "Emp ID", "Name", "DOJ", "Days Worked", "Lay-off", "Maternity", 
        "Leave Enjoyed", "Total", "Prev Bal", "Earned", "Balance", "Daily Rate", "Leave Wages"
      ]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [34, 139, 34], textColor: 255, fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 18 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20 }
      }
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;
    doc.setFontSize(8);
    doc.text("Signature of Employer: ________________________", 14, finalY + 15);
    doc.text("Date: ________________________", doc.internal.pageSize.width - 60, finalY + 15);

    doc.save(`Leave_Register_Form_20_${selectedYear}.pdf`);
  };

  const exportToExcel = () => {
    const headerRows = [
      ["The Maharashtra Factories Rules"],
      ["FORM 20"],
      ["(See Rules 105 and 106)"],
      ["Register of leave with wages"],
      [""],
      [`Factory: ${factoryName}`],
      [`Financial Year: ${selectedYear}-${selectedYear + 1}`],
      ["Part I - Adults"],
      [""]
    ];

    const tableHeader = [
      "Sr. No.", "Sr. No. in Register", "Name", "Father's Name", "Date of entry into Service",
      "Calendar year of service", "Number of days of work performed", "Number of days lay-off",
      "Number of days of maternity leave with wages", "Number of leave with wages enjoyed",
      "Total (cols. 5 to 8)", "Balance of leave with wages from preceding year",
      "Leave with wages earned during the year", "Total of cols. 10 & 11",
      "Whether leave with wages refused", "Whether leave not desired during next calendar year",
      "Leave with wages enjoyed From", "Leave with wages enjoyed To", "Balance to credit",
      "Normal rate of wages", "Cash equivalent or advantage", "Rate of wages for leave with wages period",
      "Date of discharge", "Date of amount of payment made in lieu of leave with wages due", "Remarks"
    ];

    const dataRows = Object.values(hierarchicalData).flatMap(depts => Object.values(depts).flat()).map((emp, index) => {
      const data = calculateLeaveData(emp);
      const joinDate = emp.joinDate ? new Date(emp.joinDate) : null;
      const yearsOfService = joinDate ? selectedYear - joinDate.getFullYear() : 0;

      return [
        index + 1,
        emp.employeeId,
        `${emp.firstName} ${emp.lastName}`,
        "-",
        emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN') : "-",
        selectedYear,
        data.daysWorked,
        data.layOffDays,
        data.maternityLeave,
        data.leaveEnjoyed,
        data.daysWorked + data.layOffDays + data.maternityLeave + data.leaveEnjoyed,
        data.previousBalance,
        data.earnedLeave,
        data.totalLeave,
        "No",
        "No",
        "-",
        "-",
        data.balanceLeave,
        data.dailyRate,
        "-",
        data.dailyRate,
        "-",
        data.leaveWages > 0 ? `Rs. ${data.leaveWages.toLocaleString()}` : "-",
        ""
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([...headerRows, tableHeader, ...dataRows]);
    
    ws["!cols"] = [
      { wch: 8 }, { wch: 12 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leave Register Form 20");
    XLSX.writeFile(wb, `Leave_Register_Form_20_${selectedYear}.xlsx`);
  };

  const { toast } = useToast();

  const handlePrint = () => {
    const printContent = document.querySelector('.print\\:shadow-none');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    } else {
      window.print();
    }
  };

  const downloadTemplate = () => {
    const templateHeader = [
      ["The Maharashtra Factories Rules - FORM 20 - IMPORT TEMPLATE"],
      ["Instructions: Fill employee leave data below and import. Dates must be in YYYY-MM-DD format."],
      [""],
      ["Factory:", factoryName],
      ["Financial Year:", `${selectedYear}-${selectedYear + 1}`],
      [""]
    ];

    const tableHeader = [
      "Employee ID", "Full Name", "Leave Type", "Start Date", "End Date", "Reason"
    ];

    const sampleRow = [
      "EMP001", "John Doe", "annual", "2025-05-01", "2025-05-05", "Vacation"
    ];

    const ws = XLSX.utils.aoa_to_sheet([...templateHeader, tableHeader, sampleRow]);
    ws["!cols"] = [
      { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
      { wch: 20 }, { wch: 15 }, { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leave Register Template");
    XLSX.writeFile(wb, "Leave_Register_Form_20_Template.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const response = await apiRequest("POST", "/api/leave-requests/bulk", {
          records: data.map((row: any) => ({
            userId: row["Employee ID"],
            type: row["Leave Type"] || "annual",
            startDate: row["Start Date"],
            endDate: row["End Date"],
            reason: row["Reason"],
            status: "approved",
            year: selectedYear
          }))
        });

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
          toast({
            title: "Import Successful",
            description: `Successfully synced records from ${file.name}`,
          });
        } else {
          throw new Error("Failed to sync data");
        }
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Could not parse or sync the file. Please use the provided template.",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <AppLayout>
      <div className="h-full overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Leave Register - Form 20</h1>
              <p className="text-muted-foreground">Maharashtra Factories Rules - Register of leave with wages</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <input
                  type="file"
                  className="hidden"
                  id="leave-register-import"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                />
                <Button variant="outline" onClick={() => document.getElementById('leave-register-import')?.click()} data-testid="button-import">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
              </div>
              <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button variant="outline" onClick={handlePrint} data-testid="button-print">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={exportToPDF} data-testid="button-export-pdf">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={exportToExcel} data-testid="button-export-excel">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Label>Factory Name</Label>
                <Input 
                  value={factoryName} 
                  onChange={(e) => setFactoryName(e.target.value)}
                  data-testid="input-factory-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Financial Year</Label>
                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger data-testid="select-year" className="h-9 font-bold shadow-sm">
                    <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearsList.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}-{y + 1}</SelectItem>
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
              <p className="text-sm">The Maharashtra Factories Rules</p>
              <p className="text-lg font-bold">FORM 20</p>
              <p className="text-xs text-muted-foreground">(See Rules 105 and 106)</p>
              <p className="text-sm font-medium">Register of leave with wages</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p><strong>Factory:</strong> {factoryName}</p>
              </div>
              <div className="text-right">
                <p><strong>Part I - Adults</strong></p>
                <p><strong>Financial Year:</strong> {selectedYear}-{selectedYear + 1}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="space-y-8">
              {Object.entries(hierarchicalData).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No employees found. Add employees to generate leave register.
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
                        
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <Table className="text-xs">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-center w-10" rowSpan={2}>Sr. No.</TableHead>
                                <TableHead className="text-center w-16" rowSpan={2}>Emp ID</TableHead>
                                <TableHead className="min-w-[150px]" rowSpan={2}>Name</TableHead>
                                <TableHead className="text-center w-20" rowSpan={2}>DOJ</TableHead>
                                <TableHead className="text-center" colSpan={5}>Number of days during calendar year</TableHead>
                                <TableHead className="text-center" colSpan={3}>Leave with wages to credit</TableHead>
                                <TableHead className="text-center w-16" rowSpan={2}>Daily Rate</TableHead>
                                <TableHead className="text-center w-16" rowSpan={2}>Leave Wages</TableHead>
                                <TableHead className="text-center w-20" rowSpan={2}>Remarks</TableHead>
                              </TableRow>
                              <TableRow>
                                <TableHead className="text-center w-14">Days Worked</TableHead>
                                <TableHead className="text-center w-12">Lay-off</TableHead>
                                <TableHead className="text-center w-14">Maternity</TableHead>
                                <TableHead className="text-center w-12">Leave Enjoyed</TableHead>
                                <TableHead className="text-center w-12">Total</TableHead>
                                <TableHead className="text-center w-14">Previous Balance</TableHead>
                                <TableHead className="text-center w-12">Earned</TableHead>
                                <TableHead className="text-center w-12">Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {staff.map((emp, index) => {
                                const data = calculateLeaveData(emp);

                                return (
                                  <TableRow key={emp.id} data-testid={`row-employee-${emp.id}`}>
                                    <TableCell className="text-center">{index + 1}</TableCell>
                                    <TableCell className="text-center">{emp.employeeId}</TableCell>
                                    <TableCell className="font-medium">{emp.firstName} {emp.lastName}</TableCell>
                                    <TableCell className="text-center">
                                      {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">{data.daysWorked}</TableCell>
                                    <TableCell className="text-center">{data.layOffDays}</TableCell>
                                    <TableCell className="text-center">{data.maternityLeave}</TableCell>
                                    <TableCell className="text-center">{data.leaveEnjoyed}</TableCell>
                                    <TableCell className="text-center font-medium">{data.totalDays}</TableCell>
                                    <TableCell className="text-center">{data.previousBalance}</TableCell>
                                    <TableCell className="text-center">{data.earnedLeave}</TableCell>
                                    <TableCell className="text-center font-medium">{data.balanceLeave}</TableCell>
                                    <TableCell className="text-center">{data.dailyRate}</TableCell>
                                    <TableCell className="text-center">{data.leaveWages > 0 ? data.leaveWages : "-"}</TableCell>
                                    <TableCell className="text-center">-</TableCell>
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

        <div className="text-xs text-muted-foreground italic">
            Note: Separate page will be allotted to each worker as per Form 20 requirements. This consolidated view is for overview purposes.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
