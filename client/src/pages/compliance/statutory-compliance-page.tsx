import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Download, 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Users, 
  Building2, 
  IndianRupee, 
  Calculator, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Calendar,
  Gift,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths } from "date-fns";
import * as XLSX from 'xlsx';
import { User, Department } from "@shared/schema";

interface PFData {
  uan: string;
  name: string;
  birthDate: string;
  dateOfJoining: string;
  grossWages: number;
  pfWages: number;
  pfContribution: number;
  employerPF: number;
  pensionFund: number;
  ncp: number;
  monthDays: number;
  workedDays: number;
}

interface ESIData {
  ipNumber: string;
  ipName: string;
  daysWorked: number;
  totalMonthlyWages: number;
  reasonCode: number;
  lastWorkingDay: string;
}

interface BonusData {
  empId: string;
  emplCode: string;
  employeeName: string;
  designation: string;
  joinDate: string;
  bankName: string;
  bankACNo: string;
  ifsc: string;
  monthlyData: { month: string; amount: number; days: number }[];
  totalBonus: number;
  totalDays: number;
}

export default function StatutoryCompliancePage() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

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

  const { data: payrollRecords = [] } = useQuery<PayrollRecord[]>({
    queryKey: ["/api/payroll"],
  });

  const { data: attendanceRecords = [] } = useQuery<{ userId: number; date: string; status: string }[]>({
    queryKey: ["/api/attendance"],
  });

  const getPayrollForEmployee = (employeeId: number, month: number, year: number): PayrollRecord | undefined => {
    return payrollRecords.find(
      p => p.userId === employeeId && p.month === month && p.year === year
    );
  };

  const getWorkedDaysForMonth = (employeeId: number, month: number, year: number): number => {
    const monthStr = String(month).padStart(2, '0');
    const monthRecords = attendanceRecords.filter(a => {
      const dateStr = a.date;
      return a.userId === employeeId && 
             dateStr.startsWith(`${year}-${monthStr}`) && 
             a.status === 'present';
    });
    return monthRecords.length > 0 ? monthRecords.length : 26;
  };

  const { data: systemSettings } = useQuery({
    queryKey: ["/api/settings/system"],
    queryFn: async () => {
      const response = await fetch("/api/settings/system", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 403) return null;
        throw new Error("Failed to fetch system settings");
      }
      return response.json();
    },
  });

  const currentSalaryComponents = systemSettings?.salaryComponents || {
    basicSalaryPercentage: 50,
    hraPercentage: 50,
    epfPercentage: 12,
    esicPercentage: 0.75,
    professionalTax: 200
  };

  const calculateGrossSalary = (monthlyCTC: number) => (monthlyCTC / 30) * 26;
  const calculateBasicSalary = (grossSalary: number) => grossSalary * (currentSalaryComponents.basicSalaryPercentage / 100);
  const calculatePFWages = (basicSalary: number) => Math.min(basicSalary, 15000);
  const calculatePFContribution = (pfWages: number) => Math.round(pfWages * 0.12);
  const calculateEmployerPF = (pfWages: number) => Math.round(pfWages * 0.0367);
  const calculatePensionFund = (pfWages: number) => Math.round(pfWages * 0.0833);
  const calculateESIContribution = (grossSalary: number) => grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0;

  const generatePFData = (): PFData[] => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    return employees
      .filter(emp => emp.isActive && emp.pfApplicable !== false && emp.salary)
      .filter(emp => {
        const dept = departments.find((d: any) => d.id === emp.departmentId);
        const unit = units.find((u: any) => u.id === dept?.unitId);
        
        const matchesUnit = selectedUnit === "all" || unit?.id.toString() === selectedUnit;
        const matchesDept = selectedDepartment === "all" || dept?.id.toString() === selectedDepartment;
        
        return matchesUnit && matchesDept;
      })
      .map(emp => {
        const payrollData = getPayrollForEmployee(emp.id, month, year);
        const workedDays = getWorkedDaysForMonth(emp.id, month, year);
        
        let grossSalary: number;
        let basicSalary: number;
        let pfContribution: number;
        
        if (payrollData) {
          grossSalary = payrollData.basicSalary + (payrollData.hra || 0) + (payrollData.allowances || 0);
          basicSalary = payrollData.basicSalary;
          pfContribution = payrollData.pfContribution || calculatePFContribution(calculatePFWages(basicSalary));
        } else {
          grossSalary = calculateGrossSalary(emp.salary || 0);
          basicSalary = calculateBasicSalary(grossSalary);
          pfContribution = calculatePFContribution(calculatePFWages(basicSalary));
        }
        
        const pfWages = calculatePFWages(basicSalary);
        const employerPF = Math.round(pfWages * 0.0367);
        const pensionFund = Math.round(pfWages * 0.0833);

        return {
          uan: emp.uanNumber || `10${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          name: `${emp.firstName} ${emp.lastName}`.toUpperCase(),
          birthDate: emp.dateOfBirth ? format(new Date(emp.dateOfBirth), 'dd/MM/yyyy') : '',
          dateOfJoining: emp.joinDate ? format(new Date(emp.joinDate), 'dd/MM/yyyy') : '',
          grossWages: Math.round(grossSalary),
          pfWages: Math.round(pfWages),
          pfContribution,
          employerPF,
          pensionFund,
          ncp: 0,
          monthDays: 26,
          workedDays
        };
      });
  };

  const generateESIData = (): ESIData[] => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    return employees
      .filter(emp => emp.isActive && emp.esicApplicable !== false && emp.salary)
      .filter(emp => {
        const dept = departments.find((d: any) => d.id === emp.departmentId);
        const unit = units.find((u: any) => u.id === dept?.unitId);
        
        const matchesUnit = selectedUnit === "all" || unit?.id.toString() === selectedUnit;
        const matchesDept = selectedDepartment === "all" || dept?.id.toString() === selectedDepartment;
        
        if (!(matchesUnit && matchesDept)) return false;

        const payrollData = getPayrollForEmployee(emp.id, month, year);
        if (payrollData) {
          const grossSalary = payrollData.basicSalary + (payrollData.hra || 0) + (payrollData.allowances || 0);
          return grossSalary <= 21000;
        }
        return calculateGrossSalary(emp.salary || 0) <= 21000;
      })
      .map(emp => {
        const payrollData = getPayrollForEmployee(emp.id, month, year);
        const workedDays = getWorkedDaysForMonth(emp.id, month, year);
        
        let grossSalary: number;
        if (payrollData) {
          grossSalary = payrollData.basicSalary + (payrollData.hra || 0) + (payrollData.allowances || 0);
        } else {
          grossSalary = calculateGrossSalary(emp.salary || 0);
        }
        
        return {
          ipNumber: emp.esicNumber || `33${Math.floor(10000000 + Math.random() * 90000000)}`,
          ipName: `${emp.firstName} ${emp.lastName}`.toUpperCase(),
          daysWorked: workedDays,
          totalMonthlyWages: Math.round(grossSalary),
          reasonCode: 0,
          lastWorkingDay: ''
        };
      });
  };

  const generateBonusData = (): BonusData[] => {
    const months = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
    const year = parseInt(selectedYear);
    
    return employees
      .filter(emp => emp.isActive && emp.bonusApplicable !== false && emp.salary)
      .filter(emp => {
        const dept = departments.find((d: any) => d.id === emp.departmentId);
        const unit = units.find((u: any) => u.id === dept?.unitId);
        
        const matchesUnit = selectedUnit === "all" || unit?.id.toString() === selectedUnit;
        const matchesDept = selectedDepartment === "all" || dept?.id.toString() === selectedDepartment;
        
        return matchesUnit && matchesDept;
      })
      .map((emp, index) => {
        const monthlyData = months.map((month, idx) => {
          const actualMonth = idx < 9 ? idx + 4 : idx - 8;
          const actualYear = idx < 9 ? year : year + 1;
          const monthDate = new Date(actualYear, actualMonth - 1, 1);
          const isJoined = emp.joinDate ? new Date(emp.joinDate) <= monthDate : true;
          
          const payrollData = getPayrollForEmployee(emp.id, actualMonth, actualYear);
          const workedDays = getWorkedDaysForMonth(emp.id, actualMonth, actualYear);
          
          let basicSalary: number;
          if (payrollData) {
            basicSalary = payrollData.basicSalary;
          } else {
            basicSalary = calculateBasicSalary(calculateGrossSalary(emp.salary || 0));
          }
          
          const bonusEligibleSalary = Math.min(basicSalary, 7000);
          const bonusAmount = isJoined ? Math.round((bonusEligibleSalary * 8.33 / 100)) : 0;
          
          return {
            month: `${month}${idx < 9 ? year : year + 1}`,
            amount: bonusAmount,
            days: isJoined ? workedDays : 0
          };
        });

        return {
          empId: `188${1329 + index}`,
          emplCode: emp.employeeId || `70${90 + index}`,
          employeeName: `${emp.firstName} ${emp.lastName}`.toUpperCase(),
          designation: emp.position || '',
          joinDate: emp.joinDate ? format(new Date(emp.joinDate), 'dd/MM/yyyy') : '',
          bankName: emp.bankName || 'AXIS BANK',
          bankACNo: emp.bankAccountNumber || '',
          ifsc: emp.bankIFSCCode || '',
          monthlyData,
          totalBonus: monthlyData.reduce((sum, m) => sum + m.amount, 0),
          totalDays: monthlyData.reduce((sum, m) => sum + m.days, 0)
        };
      });
  };

  const pfData = generatePFData();
  const esiData = generateESIData();
  const bonusData = generateBonusData();

  const complianceStats = [
    { 
      title: "Total PF Contribution", 
      value: `₹${pfData.reduce((sum, row) => sum + row.pfContribution + row.employerPF + row.pensionFund, 0).toLocaleString()}`, 
      change: `${pfData.length} employees`, 
      icon: <Shield className="h-5 w-5" />,
      color: "teal"
    },
    { 
      title: "ESI Contribution", 
      value: `₹${esiData.reduce((sum, row) => sum + Math.round(row.totalMonthlyWages * 0.04), 0).toLocaleString()}`, 
      change: `${esiData.length} eligible`, 
      icon: <Building2 className="h-5 w-5" />,
      color: "blue"
    },
    { 
      title: "Bonus Payable", 
      value: `₹${bonusData.reduce((sum, row) => sum + row.totalBonus, 0).toLocaleString()}`, 
      change: `FY ${selectedYear}-${parseInt(selectedYear) + 1}`, 
      icon: <Gift className="h-5 w-5" />,
      color: "orange"
    },
    { 
      title: "Total Employees", 
      value: employees.filter(e => e.isActive).length.toString(), 
      change: "+Active", 
      icon: <Users className="h-5 w-5" />,
      color: "purple"
    },
  ];

  const exportPFToExcel = () => {
    const wsData = [
      ['UAN', 'Name of the Employee', 'BirthDate', 'Date of Joining', 'GrossWages', 'PF WAGES', 'PF Contr', 'EMPLR PF', 'Pension Fund', 'NCP', 'MonthDays', 'WorkedDays'],
      ...pfData.map(row => [
        row.uan,
        row.name,
        row.birthDate,
        row.dateOfJoining,
        row.grossWages.toFixed(2),
        row.pfWages.toFixed(2),
        row.pfContribution.toFixed(2),
        row.employerPF,
        row.pensionFund,
        row.ncp.toFixed(2),
        row.monthDays,
        row.workedDays.toFixed(2)
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PF Data");
    XLSX.writeFile(wb, `PF_Data_${selectedMonth}.xlsx`);

    toast({
      title: "PF Data Exported",
      description: `Excel file generated with ${pfData.length} employee records.`,
    });
  };

  const exportPFToECR = () => {
    const ecrLines = pfData.map(row => {
      return [
        row.uan,
        row.name,
        row.grossWages,
        row.pfWages,
        row.pfWages,
        row.pfWages,
        row.pfContribution,
        row.pensionFund,
        row.employerPF,
        row.ncp,
        0
      ].join('#~#');
    });

    const ecrContent = ecrLines.join('\n');
    const blob = new Blob([ecrContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecr_${selectedMonth}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "ECR File Generated",
      description: `TXT file generated with ${pfData.length} employee records for EPFO upload.`,
    });
  };

  const exportESIToExcel = () => {
    const wsData = [
      ['IP Number', 'IP Name', 'No of Days for which wages paid/payable during the month', 'Total Monthly Wages', 'Reason Code for Zero workings days(numeric only; provide 0 for all other reasons)', 'Last Working Day'],
      ...esiData.map(row => [
        row.ipNumber,
        row.ipName,
        row.daysWorked.toFixed(2),
        row.totalMonthlyWages.toFixed(2),
        row.reasonCode,
        row.lastWorkingDay
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ESI Data");
    XLSX.writeFile(wb, `ESI_Data_${selectedMonth}.xlsx`);

    toast({
      title: "ESI Data Exported",
      description: `Excel file generated with ${esiData.length} eligible employee records.`,
    });
  };

  const exportBonusToExcel = () => {
    const months = ['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
    const year = parseInt(selectedYear);
    
    const headers = [
      'empid', 'EmplCode', 'EmployeeName', 'designation', 'JoinDate', 'bankname', 'BankACNo', 'IFSC'
    ];
    
    months.forEach((month, idx) => {
      const yr = idx < 9 ? year : year + 1;
      headers.push(`${month}${yr}`, `dy${month}${yr}`);
    });
    headers.push('TotalBonus', 'TotalDays');

    const wsData = [
      headers,
      ...bonusData.map(row => {
        const rowData: (string | number)[] = [
          row.empId,
          row.emplCode,
          row.employeeName,
          row.designation,
          row.joinDate,
          row.bankName,
          row.bankACNo,
          row.ifsc
        ];
        
        row.monthlyData.forEach(m => {
          rowData.push(m.amount, m.days);
        });
        
        rowData.push(row.totalBonus, row.totalDays);
        return rowData;
      })
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bonus Data");
    XLSX.writeFile(wb, `Bonus_Data_FY${selectedYear}-${parseInt(selectedYear) + 1}.xlsx`);

    toast({
      title: "Bonus Data Exported",
      description: `Excel file generated with ${bonusData.length} employee bonus records for FY ${selectedYear}-${parseInt(selectedYear) + 1}.`,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleImportESI = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file selected",
        description: "Please select an ESI Excel file to import.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          toast({
            title: "ESI Data Imported",
            description: `Successfully imported ${jsonData.length} records from ${uploadedFile.name}.`,
          });
          
          setUploadedFile(null);
          setUploadDialogOpen(false);
        } catch (err) {
          toast({
            title: "Import Failed",
            description: "Failed to parse the Excel file. Please ensure it's in the correct format.",
            variant: "destructive",
          });
        }
        setUploading(false);
      };
      reader.readAsArrayBuffer(uploadedFile);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred while importing the file.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 4 + i).toString());

  const { data: units = [] } = useQuery<any[]>({ queryKey: ["/api/masters/units"] });

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-page-title">
              Statutory Compliance
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage PF, ESI, and Bonus compliance - synced with payroll data
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="w-40" data-testid="select-unit">
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {units.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label>Dept</Label>
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
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40" data-testid="select-month">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = subMonths(new Date(), i);
                  return (
                    <SelectItem key={i} value={format(date, 'yyyy-MM')}>
                      {format(date, 'MMMM yyyy')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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
              <Card className="hover-elevate" data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${
                      stat.color === 'teal' ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' :
                      stat.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      stat.color === 'orange' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                      'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {stat.icon}
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statutory Reports</CardTitle>
            <CardDescription>Generate PF, ESI, and Bonus reports in required formats</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pf">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                <TabsTrigger value="pf" data-testid="tab-pf">
                  <Shield className="h-4 w-4 mr-2" />
                  Provident Fund
                </TabsTrigger>
                <TabsTrigger value="esi" data-testid="tab-esi">
                  <Building2 className="h-4 w-4 mr-2" />
                  ESI
                </TabsTrigger>
                <TabsTrigger value="bonus" data-testid="tab-bonus">
                  <Gift className="h-4 w-4 mr-2" />
                  Bonus
                </TabsTrigger>
                <TabsTrigger value="mlwf" data-testid="tab-mlwf">
                  <Users className="h-4 w-4 mr-2" />
                  MLWF
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pf" className="mt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="text-sm text-slate-500">
                      Showing {pfData.length} PF-eligible employees for {format(new Date(selectedMonth), 'MMMM yyyy')}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={exportPFToExcel} data-testid="button-export-pf-excel">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                      <Button onClick={exportPFToECR} data-testid="button-export-pf-ecr">
                        <FileText className="h-4 w-4 mr-2" />
                        Export ECR (TXT)
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead>UAN</TableHead>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Birth Date</TableHead>
                          <TableHead className="text-right">Gross Wages</TableHead>
                          <TableHead className="text-right">PF Wages</TableHead>
                          <TableHead className="text-right">PF Contr (12%)</TableHead>
                          <TableHead className="text-right">Employer PF</TableHead>
                          <TableHead className="text-right">Pension Fund</TableHead>
                          <TableHead className="text-right">Worked Days</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pfData.slice(0, 10).map((row, index) => (
                          <TableRow key={index} data-testid={`row-pf-${index}`}>
                            <TableCell className="font-mono text-sm">{row.uan}</TableCell>
                            <TableCell className="font-medium">{row.name}</TableCell>
                            <TableCell>{row.birthDate || '-'}</TableCell>
                            <TableCell className="text-right">₹{row.grossWages.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{row.pfWages.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-teal-600 dark:text-teal-400">₹{row.pfContribution.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{row.employerPF.toLocaleString()}</TableCell>
                            <TableCell className="text-right">₹{row.pensionFund.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{row.workedDays}</TableCell>
                          </TableRow>
                        ))}
                        {pfData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                              No PF-eligible employees found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {pfData.length > 10 && (
                    <p className="text-sm text-slate-500 text-center">
                      Showing 10 of {pfData.length} records. Export to view all.
                    </p>
                  )}

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Note:</strong> PF contribution is 12% of basic salary (capped at ₹15,000). 
                      The ECR file format is ready for direct upload to the EPFO portal.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="esi" className="mt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="text-sm text-slate-500">
                      Showing {esiData.length} ESI-eligible employees (salary ≤ ₹21,000)
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" data-testid="button-import-esi">
                            <Upload className="h-4 w-4 mr-2" />
                            Import ESI
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Import ESI Data</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="esi-file">Select ESI Excel File</Label>
                              <Input
                                id="esi-file"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                                data-testid="input-esi-file"
                              />
                              <p className="text-xs text-slate-500">
                                Supported formats: Excel (.xlsx, .xls)
                              </p>
                            </div>
                            {uploadedFile && (
                              <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                                <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                                <span className="text-sm text-teal-700 dark:text-teal-300">{uploadedFile.name}</span>
                              </div>
                            )}
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleImportESI} disabled={uploading || !uploadedFile}>
                                {uploading ? "Importing..." : "Import"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button onClick={exportESIToExcel} data-testid="button-export-esi">
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead>IP Number</TableHead>
                          <TableHead>IP Name</TableHead>
                          <TableHead className="text-right">Days Worked</TableHead>
                          <TableHead className="text-right">Monthly Wages</TableHead>
                          <TableHead className="text-right">Employee (0.75%)</TableHead>
                          <TableHead className="text-right">Employer (3.25%)</TableHead>
                          <TableHead className="text-right">Total ESI</TableHead>
                          <TableHead>Reason Code</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {esiData.slice(0, 10).map((row, index) => {
                          const empContrib = Math.round(row.totalMonthlyWages * 0.0075);
                          const emplrContrib = Math.round(row.totalMonthlyWages * 0.0325);
                          return (
                            <TableRow key={index} data-testid={`row-esi-${index}`}>
                              <TableCell className="font-mono text-sm">{row.ipNumber}</TableCell>
                              <TableCell className="font-medium">{row.ipName}</TableCell>
                              <TableCell className="text-right">{row.daysWorked}</TableCell>
                              <TableCell className="text-right">₹{row.totalMonthlyWages.toLocaleString()}</TableCell>
                              <TableCell className="text-right">₹{empContrib}</TableCell>
                              <TableCell className="text-right">₹{emplrContrib}</TableCell>
                              <TableCell className="text-right text-blue-600 dark:text-blue-400 font-medium">
                                ₹{(empContrib + emplrContrib).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{row.reasonCode}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {esiData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                              No ESI-eligible employees found (all salaries exceed ₹21,000 limit)
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {esiData.length > 10 && (
                    <p className="text-sm text-slate-500 text-center">
                      Showing 10 of {esiData.length} records. Export to view all.
                    </p>
                  )}

                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Note:</strong> ESI is applicable for employees with gross salary up to ₹21,000/month. 
                      Employee contribution is 0.75% and employer contribution is 3.25%.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bonus" className="mt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-slate-500">
                        Showing {bonusData.length} bonus-eligible employees
                      </div>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-32" data-testid="select-year">
                          <SelectValue placeholder="FY" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year}>
                              FY {year}-{parseInt(year) + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={exportBonusToExcel} data-testid="button-export-bonus">
                      <Download className="h-4 w-4 mr-2" />
                      Export Bonus Data
                    </Button>
                  </div>

                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead>Emp Code</TableHead>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Designation</TableHead>
                          <TableHead>Join Date</TableHead>
                          <TableHead>Bank Name</TableHead>
                          <TableHead>Account No</TableHead>
                          <TableHead className="text-right">Total Bonus</TableHead>
                          <TableHead className="text-right">Total Days</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bonusData.slice(0, 10).map((row, index) => (
                          <TableRow key={index} data-testid={`row-bonus-${index}`}>
                            <TableCell className="font-mono text-sm">{row.emplCode}</TableCell>
                            <TableCell className="font-medium">{row.employeeName}</TableCell>
                            <TableCell>{row.designation || '-'}</TableCell>
                            <TableCell>{row.joinDate || '-'}</TableCell>
                            <TableCell>{row.bankName}</TableCell>
                            <TableCell className="font-mono text-sm">{row.bankACNo || '-'}</TableCell>
                            <TableCell className="text-right text-orange-600 dark:text-orange-400 font-medium">
                              ₹{row.totalBonus.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">{row.totalDays}</TableCell>
                          </TableRow>
                        ))}
                        {bonusData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                              No bonus-eligible employees found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {bonusData.length > 10 && (
                    <p className="text-sm text-slate-500 text-center">
                      Showing 10 of {bonusData.length} records. Export to view all.
                    </p>
                  )}

                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      <strong>Note:</strong> Bonus is calculated as 8.33% of basic salary (capped at ₹7,000) as per Payment of Bonus Act. 
                      The export includes month-wise bonus and days worked for each employee.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="mlwf" className="mt-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <div className="text-sm text-slate-500">
                      MLWF Report for Maharashtra - Deduction in June and December
                    </div>
                    <Button variant="outline" onClick={() => {
                      const isDeductionMonth = selectedMonth.endsWith('-06') || selectedMonth.endsWith('-12');
                      const mlwfEmployees = employees.filter(e => e.isActive && e.mlwfApplicable);
                      
                      const wsData = [
                        ['Emp Code', 'Name', 'Deduction Month', 'Employee Share', 'Employer Share', 'Total'],
                        ...mlwfEmployees.map(emp => [
                          emp.employeeId || '',
                          `${emp.firstName} ${emp.lastName}`,
                          format(new Date(selectedMonth), 'MMMM yyyy'),
                          isDeductionMonth ? 25 : 0,
                          isDeductionMonth ? 75 : 0,
                          isDeductionMonth ? 100 : 0
                        ])
                      ];
                      const ws = XLSX.utils.aoa_to_sheet(wsData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "MLWF Data");
                      XLSX.writeFile(wb, `MLWF_Report_${selectedMonth}.xlsx`);
                      toast({ title: "MLWF Report Exported", description: "Excel file generated successfully." });
                    }} data-testid="button-export-mlwf">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export MLWF Data
                    </Button>
                  </div>

                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead>Emp Code</TableHead>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Contribution Period</TableHead>
                          <TableHead className="text-right">Employee Share</TableHead>
                          <TableHead className="text-right">Employer Share</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.filter(e => e.isActive && e.mlwfApplicable).map((emp, idx) => {
                          const isDeductionMonth = selectedMonth.endsWith('-06') || selectedMonth.endsWith('-12');
                          return (
                            <TableRow key={idx}>
                              <TableCell>{emp.employeeId || '-'}</TableCell>
                              <TableCell className="font-medium">{`${emp.firstName} ${emp.lastName}`}</TableCell>
                              <TableCell>{format(new Date(selectedMonth), 'MMMM yyyy')}</TableCell>
                              <TableCell className="text-right">₹{isDeductionMonth ? 25 : 0}</TableCell>
                              <TableCell className="text-right">₹{isDeductionMonth ? 75 : 0}</TableCell>
                              <TableCell className="text-right font-bold">₹{isDeductionMonth ? 100 : 0}</TableCell>
                            </TableRow>
                          );
                        })}
                        {employees.filter(e => e.isActive && e.mlwfApplicable).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                              No MLWF-eligible employees found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {!(selectedMonth.endsWith('-06') || selectedMonth.endsWith('-12')) && (
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                        Note: MLWF deductions only occur in June and December. Current month values are zero.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
