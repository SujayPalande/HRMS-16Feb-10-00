import JSZip from "jszip";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, FileSpreadsheet, Upload, FileText, ClipboardList, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface Leave {
  id: number;
  userId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
}

type FormType = "form-ii" | "form-20";

export default function MusterRollCombinedPage() {
  const currentDate = new Date();
  const { toast } = useToast();
  const [activeForm, setActiveForm] = useState<FormType>("form-ii");
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [establishmentName, setEstablishmentName] = useState("ASN HR Consultancy & Services");
  const [employerName, setEmployerName] = useState("ASN HR Consultancy");
  const [factoryName, setFactoryName] = useState("ASN HR Consultancy & Services");
  const [departmentName, setDepartmentName] = useState("All Departments");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: attendanceRecords = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: leaveRequests = [] } = useQuery<Leave[]>({
    queryKey: ["/api/leave-requests"],
  });

  const { data: units = [] } = useQuery<any[]>({
    queryKey: ["/api/masters/units"],
  });

  const [selectedUnit, setSelectedUnit] = useState("all");

  const filteredEmployees = employees.filter(emp => {
    if (selectedUnit === "all") return true;
    // Assuming employee has department which has unitId. 
    // We might need to fetch departments to map correctly.
    return true; // Simplified for now, or we can add department check if data available
  });

  const months = [
    { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
    { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
    { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 4 + i);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  const handleBulkDownload = async () => {
    try {
      // Generate reports for all months in the current year
      const zip = new JSZip();
      
      for (const m of months) {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
        // ... generate doc for month m.value ...
        const pdfBlob = doc.output('blob');
        zip.file(`Muster_Roll_${m.label}_${selectedYear}.pdf`, pdfBlob);
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Bulk_Reports_${selectedYear}.zip`;
      link.click();
      toast({ title: "Bulk Download Started", description: "All monthly reports are being zipped." });
    } catch (error) {
      console.error("Bulk download failed:", error);
      toast({ 
        title: "Bulk Download Failed", 
        description: "An error occurred while generating bulk reports.",
        variant: "destructive"
      });
    }
  };

  const sideNavItems = [
    { id: "form-ii" as FormType, label: "Muster Roll - Form II", icon: <ClipboardList className="h-4 w-4" /> },
    { id: "form-20" as FormType, label: "Leave Register - Form 20", icon: <BookOpen className="h-4 w-4" /> }
  ];

  const getAttendanceForDay = (employeeId: number, day: number): string => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = attendanceRecords.find(
      (a) => a.userId === employeeId && a.date === dateStr
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
      (a) => a.userId === employeeId && a.date === dateStr
    );
    return record?.hoursWorked || 0;
  };

  const calculateEmployeeData = (employee: Employee) => {
    let totalDaysWorked = 0;
    let totalHoursWorked = 0;
    let overtimeHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const status = getAttendanceForDay(employee.id, day);
      if (status === "P") {
        totalDaysWorked++;
        const hours = getHoursWorkedForDay(employee.id, day);
        totalHoursWorked += hours;
        if (hours > 8) overtimeHours += hours - 8;
      } else if (status === "H") {
        totalDaysWorked += 0.5;
        totalHoursWorked += 4;
      }
    }

    const basicSalary = employee.basicSalary || employee.salary || 15000;
    const hra = employee.hra || Math.round(basicSalary * 0.4);
    
    // Pro-rate basic and hra based on actual days worked vs total days in month
    const totalDaysInMonth = daysInMonth;
    const proRatedBasic = Math.round((basicSalary / totalDaysInMonth) * totalDaysWorked);
    const proRatedHra = Math.round((hra / totalDaysInMonth) * totalDaysWorked);
    
    const dailyRate = basicSalary / 26;
    const hourlyRate = dailyRate / 8;
    const overtimePayable = Math.round(overtimeHours * hourlyRate * 2);
    const grossWages = proRatedBasic + proRatedHra + overtimePayable;
    const deductions = 0;
    const netWages = grossWages - deductions;

    return {
      totalDaysWorked,
      totalHoursWorked,
      overtimeHours,
      dailyRate: Math.round(dailyRate),
      normalWages: proRatedBasic,
      hraPayable: proRatedHra,
      overtimePayable,
      grossWages,
      deductions,
      netWages
    };
  };

  const calculateLeaveData = (employee: Employee) => {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);

    const yearAttendance = attendanceRecords.filter(a => {
      const date = new Date(a.date);
      return a.userId === employee.id && date >= yearStart && date <= yearEnd;
    });

    const daysWorked = yearAttendance.filter(a => a.status === "present").length;
    const layOffDays = yearAttendance.filter(a => a.status === "layoff").length;
    
    const employeeLeaves = leaveRequests.filter(l => {
      const start = new Date(l.startDate);
      return l.userId === employee.id && 
             l.status === "approved" && 
             start.getFullYear() === selectedYear;
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

    const earnedLeave = Math.floor(daysWorked / 20);
    const previousBalance = 0;
    const totalLeave = earnedLeave + previousBalance;
    const balanceLeave = totalLeave - leaveEnjoyed;

    const basicSalary = employee.basicSalary || employee.salary || 15000;
    const dailyRate = Math.round(basicSalary / 26);
    const leaveWages = dailyRate * leaveEnjoyed;

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
      dailyRate,
      leaveWages
    };
  };

  const exportFormIIToExcel = () => {
    const headerRows = [
      ["Form II - Muster Roll cum Wage Register"],
      ["[See Rule 27(1)]"],
      [""],
      [`Name of the Establishment: ${establishmentName}`],
      [`Name of the Employer: ${employerName}`],
      [`For the month of: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`],
      [""]
    ];

    const dayColumns = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const tableHeader = [
      "Sl No", "Full name of the employee", "Age and sex", "Nature of work and designation",
      "Date of entry into service", "Working hours From", "Working hours To", "Intervals From", "Intervals To",
      ...dayColumns,
      "Total days worked", "Minimum rates of wages payable", "Actual rates of wages payable",
      "Overtime hours worked", "Normal wages", "HRA", "Overtime Payable", "Gross wages payable",
      "Deduction - Advances", "Deduction - Fines", "Deduction - Damages", "Net wages paid",
      "Leave Earned Previous Balance", "Leave Availed during the month", "Leave Balance at the end of the month",
      "Date of payment of wages", "Signature/thumb impression of the employee"
    ];

    const dataRows = employees.map((emp, index) => {
      const data = calculateEmployeeData(emp);
      const dob = emp.dateOfBirth ? new Date(emp.dateOfBirth) : null;
      const age = dob ? Math.floor((new Date().getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : "-";
      const attendanceMarks = dayColumns.map(day => getAttendanceForDay(emp.id, day));

      return [
        index + 1,
        `${emp.firstName} ${emp.lastName}`,
        `${age}/${emp.gender || "M"}`,
        emp.position || "Worker",
        emp.joinDate || "-",
        "09:00",
        "18:00",
        "13:00",
        "14:00",
        ...attendanceMarks,
        data.totalDaysWorked,
        data.dailyRate,
        data.dailyRate,
        data.overtimeHours,
        data.normalWages,
        data.hraPayable,
        data.overtimePayable,
        data.grossWages,
        0,
        0,
        0,
        data.netWages,
        0,
        0,
        0,
        `${daysInMonth}/${selectedMonth}/${selectedYear}`,
        ""
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([...headerRows, tableHeader, ...dataRows]);
    
    ws["!cols"] = [
      { wch: 6 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 12 },
      { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      ...Array(daysInMonth).fill({ wch: 4 }),
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Muster Roll Form II");
    XLSX.writeFile(wb, `Muster_Roll_Form_II_${months.find(m => m.value === selectedMonth)?.label}_${selectedYear}.xlsx`);
  };

  const exportFormIIToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Form II - Muster Roll cum Wage Register", doc.internal.pageSize.width / 2, 15, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("[See Rule 27(1)]", doc.internal.pageSize.width / 2, 22, { align: "center" });
    
    doc.setFontSize(9);
    doc.text(`Name of the Establishment: ${establishmentName}`, 14, 32);
    doc.text(`Name of the Employer: ${employerName}`, 14, 38);
    doc.text(`For the month of: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, 14, 44);

    const dayColumns = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
    const headers = [
      "Sl No", "Full name of employee", "Age/Sex", "Designation", "DOJ",
      "From", "To", "Int From", "Int To",
      ...dayColumns,
      "Total Days", "Daily Rate", "OT Hrs", "Normal Wages", "HRA", "OT Pay", "Gross", "Deductions", "Net Wages"
    ];

    const tableData = employees.map((emp, index) => {
      const data = calculateEmployeeData(emp);
      const dob = emp.dateOfBirth ? new Date(emp.dateOfBirth) : null;
      const age = dob ? Math.floor((new Date().getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : "-";
      const attendanceMarks = dayColumns.map((_, i) => getAttendanceForDay(emp.id, i + 1));

      return [
        String(index + 1),
        `${emp.firstName} ${emp.lastName}`,
        `${age}/${emp.gender?.[0] || "M"}`,
        emp.position || "-",
        emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : "-",
        "09:00",
        "18:00",
        "13:00",
        "14:00",
        ...attendanceMarks,
        String(data.totalDaysWorked),
        String(data.dailyRate),
        String(data.overtimeHours),
        String(data.normalWages),
        String(data.hraPayable),
        String(data.overtimePayable),
        String(data.grossWages),
        String(data.deductions),
        String(data.netWages)
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 50,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [0, 128, 128], textColor: 255, fontSize: 5 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 28 },
        2: { cellWidth: 10 },
        3: { cellWidth: 18 },
        4: { cellWidth: 12 },
        5: { cellWidth: 8 },
        6: { cellWidth: 8 },
        7: { cellWidth: 8 },
        8: { cellWidth: 8 }
      },
      margin: { left: 5, right: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text("Signature of the Authorised Representative:", 14, finalY);
    doc.text("Principal Employer (In the case of Contract Labour):", 14, finalY + 6);
    doc.text("Signature of the Employer or the person authorised", doc.internal.pageSize.width - 100, finalY);
    doc.text("by him to authenticate the above entries with the company seal", doc.internal.pageSize.width - 100, finalY + 6);

    doc.save(`Muster_Roll_Form_II_${months.find(m => m.value === selectedMonth)?.label}_${selectedYear}.pdf`);
  };

  const exportForm20ToExcel = () => {
    const headerRows = [
      ["The Maharashtra Factories Rules"],
      ["FORM 20"],
      ["(See Rules 105 and 106)"],
      ["Register of leave with wages"],
      [""],
      [`Factory: ${factoryName}`],
      [`Department: ${departmentName}`],
      [`Calendar Year: ${selectedYear}`],
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

    const dataRows = employees.map((emp, index) => {
      const data = calculateLeaveData(emp);
      const joinDate = emp.joinDate ? new Date(emp.joinDate) : null;
      const yearsOfService = joinDate ? selectedYear - joinDate.getFullYear() : 0;

      return [
        index + 1,
        emp.employeeId,
        `${emp.firstName} ${emp.lastName}`,
        "-",
        emp.joinDate || "-",
        yearsOfService,
        data.daysWorked,
        data.layOffDays,
        data.maternityLeave,
        data.leaveEnjoyed,
        data.totalDays,
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
        data.leaveWages > 0 ? data.leaveWages : "-",
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

  const exportForm20ToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("The Maharashtra Factories Rules", doc.internal.pageSize.width / 2, 15, { align: "center" });
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("FORM 20", doc.internal.pageSize.width / 2, 24, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("(See Rules 105 and 106)", doc.internal.pageSize.width / 2, 31, { align: "center" });
    doc.text("Register of leave with wages", doc.internal.pageSize.width / 2, 38, { align: "center" });
    
    doc.setFontSize(9);
    doc.text(`Factory: ${factoryName}`, 14, 48);
    doc.text(`Department: ${departmentName}`, 14, 54);
    doc.text(`Part I - Adults`, doc.internal.pageSize.width - 60, 48);
    doc.text(`Calendar Year: ${selectedYear}`, doc.internal.pageSize.width - 60, 54);

    const headers = [
      "Sr. No.", "Emp ID", "Name", "DOJ", "Days Worked", "Lay-off", "Maternity",
      "Leave Enjoyed", "Total", "Prev. Balance", "Earned", "Total Leave", "Balance",
      "Daily Rate", "Leave Wages", "Remarks"
    ];

    const tableData = employees.map((emp, index) => {
      const data = calculateLeaveData(emp);

      return [
        String(index + 1),
        emp.employeeId || "-",
        `${emp.firstName} ${emp.lastName}`,
        emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : "-",
        String(data.daysWorked),
        String(data.layOffDays),
        String(data.maternityLeave),
        String(data.leaveEnjoyed),
        String(data.totalDays),
        String(data.previousBalance),
        String(data.earnedLeave),
        String(data.totalLeave),
        String(data.balanceLeave),
        String(data.dailyRate),
        data.leaveWages > 0 ? String(data.leaveWages) : "-",
        "-"
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 62,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 128, 128], textColor: 255, fontSize: 7 },
      margin: { left: 10, right: 10 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Note: Separate page will be allotted to each worker as per Form 20 requirements.", 14, finalY);

    doc.save(`Leave_Register_Form_20_${selectedYear}.pdf`);
  };

  const downloadTemplate = () => {
    if (activeForm === "form-ii") {
      const dayColumns = Array.from({ length: 31 }, (_, i) => i + 1);
      const templateHeader = [
        ["Form II - Muster Roll cum Wage Register - IMPORT TEMPLATE"],
        ["Instructions: Fill the data below and import. Attendance codes: P=Present, A=Absent, L=Leave, H=Half-day, WO=Weekly Off, HO=Holiday"],
        [""],
        ["Name of the Establishment:", ""],
        ["Name of the Employer:", ""],
        ["For the month of:", ""],
        [""]
      ];

      const tableHeader = [
        "Employee ID", "Full Name", "Age", "Gender (M/F)", "Designation", "Date of Joining (DD/MM/YYYY)",
        "Working Hours From", "Working Hours To", "Interval From", "Interval To",
        ...dayColumns.map(d => `Day ${d}`),
        "Basic Salary", "HRA", "Overtime Hours", "Advances", "Fines", "Damages"
      ];

      const sampleRow = [
        "EMP001", "John Doe", "30", "M", "Worker", "01/01/2024",
        "09:00", "18:00", "13:00", "14:00",
        ...Array(31).fill("P"),
        "15000", "5000", "0", "0", "0", "0"
      ];

      const ws = XLSX.utils.aoa_to_sheet([...templateHeader, tableHeader, sampleRow, []]);
      ws["!cols"] = [
        { wch: 12 }, { wch: 20 }, { wch: 6 }, { wch: 10 }, { wch: 15 }, { wch: 18 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        ...Array(31).fill({ wch: 5 }),
        { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 10 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Muster Roll Template");
      XLSX.writeFile(wb, "Muster_Roll_Form_II_Template.xlsx");
    } else {
      const templateHeader = [
        ["The Maharashtra Factories Rules - FORM 20 - IMPORT TEMPLATE"],
        ["Instructions: Fill employee leave data below and import"],
        [""],
        ["Factory:", ""],
        ["Department:", ""],
        ["Calendar Year:", ""],
        [""]
      ];

      const tableHeader = [
        "Employee ID", "Full Name", "Father's Name", "Date of Joining (DD/MM/YYYY)",
        "Days of Work Performed", "Days of Lay-off", "Days of Maternity Leave",
        "Leave with Wages Enjoyed", "Balance from Preceding Year",
        "Normal Rate of Wages", "Remarks"
      ];

      const sampleRow = [
        "EMP001", "John Doe", "Father Name", "01/01/2024",
        "240", "0", "0", "12", "5", "577", ""
      ];

      const ws = XLSX.utils.aoa_to_sheet([...templateHeader, tableHeader, sampleRow, []]);
      ws["!cols"] = [
        { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
        { wch: 20 }, { wch: 15 }, { wch: 20 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leave Register Template");
      XLSX.writeFile(wb, "Leave_Register_Form_20_Template.xlsx");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    if (activeForm === "form-ii") {
      const monthName = months.find(m => m.value === selectedMonth)?.label || "";
      const html = `
        <html>
          <head>
            <title>Form II - Muster Roll - ${monthName} ${selectedYear}</title>
            <style>
              @page { size: A3 landscape; margin: 10mm; }
              body { font-family: sans-serif; font-size: 10px; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #999; padding: 4px; text-align: center; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .header { text-align: center; margin-bottom: 20px; }
              .info-grid { display: grid; grid-template-cols: 1fr 1fr; margin-bottom: 10px; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">Form II - Muster Roll cum Wage Register</h1>
              <p style="margin: 2px;">[See Rule 27(1)]</p>
            </div>
            <div class="info-grid">
              <div class="text-left">
                <p><strong>Name of the Establishment:</strong> ${establishmentName}</p>
                <p><strong>Name of the Employer:</strong> ${employerName}</p>
              </div>
              <div class="text-right">
                <p><strong>For the month of:</strong> ${monthName} ${selectedYear}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th rowspan="2">Sl No</th>
                  <th rowspan="2">Full name of employee</th>
                  <th rowspan="2">Age/Sex</th>
                  <th rowspan="2">Designation</th>
                  <th colspan="${daysInMonth}">Attendance</th>
                  <th rowspan="2">Total Days</th>
                  <th rowspan="2">Basic Wages</th>
                  <th rowspan="2">HRA</th>
                  <th rowspan="2">OT Pay</th>
                  <th rowspan="2">Gross</th>
                  <th rowspan="2">Net</th>
                </tr>
                <tr>
                  ${Array.from({ length: daysInMonth }, (_, i) => `<th>${i + 1}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${filteredEmployees.map((emp, index) => {
                  const data = calculateEmployeeData(emp);
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td class="text-left">${emp.firstName} ${emp.lastName}</td>
                      <td>${calculateEmployeeData(emp).totalDaysWorked ? '30/M' : '-'}</td>
                      <td>${emp.position || '-'}</td>
                      ${Array.from({ length: daysInMonth }, (_, i) => `<td>${getAttendanceForDay(emp.id, i + 1)}</td>`).join('')}
                      <td>${data.totalDaysWorked}</td>
                      <td>${data.normalWages}</td>
                      <td>${data.hraPayable}</td>
                      <td>${data.overtimePayable}</td>
                      <td>${data.grossWages}</td>
                      <td>${data.netWages}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      const html = `
        <html>
          <head>
            <title>FORM 20 - Register of leave with wages - ${selectedYear}</title>
            <style>
              @page { size: A3 landscape; margin: 10mm; }
              body { font-family: sans-serif; font-size: 10px; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #999; padding: 4px; text-align: center; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .header { text-align: center; margin-bottom: 20px; }
              .info-grid { display: grid; grid-template-cols: 1fr 1fr; margin-bottom: 10px; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <div class="header">
              <p style="margin: 0;">The Maharashtra Factories Rules</p>
              <h1 style="margin: 0;">FORM 20</h1>
              <p style="margin: 2px;">(See Rules 105 and 106)</p>
              <p style="margin: 0;">Register of leave with wages</p>
            </div>
            <div class="info-grid">
              <div class="text-left">
                <p><strong>Factory:</strong> ${factoryName}</p>
                <p><strong>Department:</strong> ${departmentName}</p>
              </div>
              <div class="text-right">
                <p><strong>Part I - Adults</strong></p>
                <p><strong>Financial Year:</strong> ${selectedYear}-${selectedYear + 1}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th rowspan="2">Sr. No.</th>
                  <th rowspan="2">Emp ID</th>
                  <th rowspan="2">Name</th>
                  <th rowspan="2">DOJ</th>
                  <th colspan="4">Number of days during calendar year</th>
                  <th rowspan="2">Total</th>
                  <th colspan="3">Leave with wages to credit</th>
                  <th rowspan="2">Daily Rate</th>
                  <th rowspan="2">Leave Wages</th>
                  <th rowspan="2">Remarks</th>
                </tr>
                <tr>
                  <th>Days Worked</th>
                  <th>Lay-off</th>
                  <th>Maternity</th>
                  <th>Leave Enjoyed</th>
                  <th>Previous Balance</th>
                  <th>Earned</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEmployees.map((emp, index) => {
                  const data = calculateLeaveData(emp);
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${emp.employeeId || '-'}</td>
                      <td class="text-left">${emp.firstName} ${emp.lastName}</td>
                      <td>${emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : '-'}</td>
                      <td>${data.daysWorked}</td>
                      <td>${data.layOffDays}</td>
                      <td>${data.maternityLeave}</td>
                      <td>${data.leaveEnjoyed}</td>
                      <td>${data.totalDays}</td>
                      <td>${data.previousBalance}</td>
                      <td>${data.earnedLeave}</td>
                      <td>${data.balanceLeave}</td>
                      <td>${data.dailyRate}</td>
                      <td>${data.leaveWages}</td>
                      <td>-</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <AppLayout>
      <div className="h-full overflow-auto">
        <div className="flex h-full">
          <aside className="w-56 border-r border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex-shrink-0">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Muster Roll Reports</h2>
              <nav className="space-y-1">
                {sideNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveForm(item.id)}
                    data-testid={`nav-${item.id}`}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left",
                      activeForm === item.id
                        ? "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

        <main className="flex-1 p-6 overflow-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">
                  {activeForm === "form-ii" ? "Muster Roll - Form II" : "Leave Register - Form 20"}
                </h1>
                <p className="text-muted-foreground">
                  {activeForm === "form-ii" 
                    ? "Maharashtra Factories Rules - Muster Roll cum Wage Register" 
                    : "Maharashtra Factories Rules - Register of leave with wages"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  type="file"
                  id="import-file"
                  className="hidden"
                  accept=".xlsx, .xls, .csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      try {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        const data = XLSX.utils.sheet_to_json(ws);

                        const endpoint = activeForm === "form-ii" 
                          ? "/api/attendance/bulk" 
                          : "/api/leave-requests/bulk";

                        const res = await apiRequest("POST", endpoint, { records: data });
                        const result = await res.json();
                        
                        toast({ 
                          title: "Import Successful", 
                          description: `Processed ${result.results.success} records successfully.` 
                        });
                        queryClient.invalidateQueries({ queryKey: [activeForm === "form-ii" ? "/api/attendance" : "/api/leave-requests"] });
                      } catch (error) {
                        console.error("Import failed:", error);
                        toast({ 
                          title: "Import Failed", 
                          description: "Check file format and try again.",
                          variant: "destructive"
                        });
                      }
                    };
                    reader.readAsBinaryString(file);
                  }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('import-file')?.click()}
                  data-testid="button-import-data"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                <Button variant="outline" onClick={handlePrint} data-testid="button-print">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={activeForm === "form-ii" ? exportFormIIToPDF : exportForm20ToPDF} data-testid="button-export-pdf">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={activeForm === "form-ii" ? exportFormIIToExcel : exportForm20ToExcel} data-testid="button-export-excel">
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
                {activeForm === "form-ii" ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Factory Name</Label>
                      <Input 
                        value={factoryName} 
                        onChange={(e) => setFactoryName(e.target.value)}
                        data-testid="input-factory-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input 
                        value={departmentName} 
                        onChange={(e) => setDepartmentName(e.target.value)}
                        data-testid="input-department-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Calendar Year</Label>
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
                )}
              </CardContent>
            </Card>

            {activeForm === "form-ii" ? (
              <Card className="print:shadow-none">
                <CardHeader className="print:pb-2">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">Form II - Muster Roll cum Wage Register</p>
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
                          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white dark:bg-slate-950">
                            <Table className="text-xs">
                              <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                  <TableHead className="text-center w-10 border-r" rowSpan={2}>Sl No</TableHead>
                                  <TableHead className="min-w-[150px] border-r" rowSpan={2}>Full name of employee</TableHead>
                                  <TableHead className="text-center w-16 border-r" rowSpan={2}>Age/Sex</TableHead>
                                  <TableHead className="min-w-[100px] border-r" rowSpan={2}>Designation</TableHead>
                                  <TableHead className="text-center w-20 border-r" rowSpan={2}>DOJ</TableHead>
                                  <TableHead className="text-center border-b" colSpan={daysInMonth}>Hours worked on</TableHead>
                                  <TableHead className="text-center w-12 border-l" rowSpan={2}>Total Days</TableHead>
                                  <TableHead className="text-center w-16 border-l" rowSpan={2}>Daily Rate</TableHead>
                                  <TableHead className="text-center w-12 border-l" rowSpan={2}>OT Hrs</TableHead>
                                  <TableHead className="text-center w-16 border-l" rowSpan={2}>Normal Wages</TableHead>
                                  <TableHead className="text-center w-14 border-l" rowSpan={2}>HRA</TableHead>
                                  <TableHead className="text-center w-14 border-l" rowSpan={2}>OT Pay</TableHead>
                                  <TableHead className="text-center w-16 border-l" rowSpan={2}>Gross</TableHead>
                                  <TableHead className="text-center w-14 border-l" rowSpan={2}>Deductions</TableHead>
                                  <TableHead className="text-center w-16 border-l bg-teal-50 dark:bg-teal-900/20" rowSpan={2}>Net Wages</TableHead>
                                </TableRow>
                                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                                  {Array.from({ length: daysInMonth }, (_, i) => (
                                    <TableHead key={i} className="text-center w-8 p-1 border-r text-[10px] font-bold">{i + 1}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {employees.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={15 + daysInMonth} className="text-center py-8 text-muted-foreground">
                                      No employees found. Add employees to generate muster roll.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  employees.map((emp, index) => {
                                    const data = calculateEmployeeData(emp);
                                    const dob = emp.dateOfBirth ? new Date(emp.dateOfBirth) : null;
                                    const age = dob ? Math.floor((new Date().getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : "-";

                                    return (
                                      <TableRow key={emp.id} data-testid={`row-employee-${emp.id}`} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="text-center border-r font-medium text-slate-500">{index + 1}</TableCell>
                                        <TableCell className="font-semibold border-r text-slate-900 dark:text-slate-100 min-w-[180px]">{emp.firstName} {emp.lastName}</TableCell>
                                        <TableCell className="text-center border-r text-slate-600 font-medium whitespace-nowrap">{age}/{emp.gender?.[0] || "M"}</TableCell>
                                        <TableCell className="border-r text-slate-600 font-medium">{emp.position || "-"}</TableCell>
                                        <TableCell className="text-center border-r text-slate-600 font-medium">{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : "-"}</TableCell>
                                        {Array.from({ length: daysInMonth }, (_, i) => {
                                          const status = getAttendanceForDay(emp.id, i + 1);
                                          return (
                                            <TableCell key={i} className={cn(
                                              "text-center p-1 border-r text-[10px] font-black",
                                              status === 'P' ? "text-emerald-600 bg-emerald-50/20" : 
                                              status === 'A' ? "text-rose-600 bg-rose-50/20" : "text-slate-400"
                                            )}>
                                              {status}
                                            </TableCell>
                                          );
                                        })}
                                        <TableCell className="text-center font-black border-l bg-slate-50/50 text-slate-900">
                                          {Number(data.totalDaysWorked).toFixed(1)}
                                        </TableCell>
                                        <TableCell className="text-right border-l font-bold text-slate-700 whitespace-nowrap">₹{data.dailyRate.toLocaleString()}</TableCell>
                                        <TableCell className="text-center border-l font-bold text-slate-700">{data.overtimeHours}</TableCell>
                                        <TableCell className="text-right border-l font-bold text-slate-700 whitespace-nowrap">₹{data.normalWages.toLocaleString()}</TableCell>
                                        <TableCell className="text-right border-l font-bold text-slate-700 whitespace-nowrap">₹{data.hraPayable.toLocaleString()}</TableCell>
                                        <TableCell className="text-right border-l font-bold text-slate-700 whitespace-nowrap">₹{data.overtimePayable.toLocaleString()}</TableCell>
                                        <TableCell className="text-right border-l font-black text-slate-900 dark:text-slate-100 bg-slate-50/30 whitespace-nowrap">₹{data.grossWages.toLocaleString()}</TableCell>
                                        <TableCell className="text-right border-l font-bold text-rose-600 bg-rose-50/10 whitespace-nowrap">₹{data.deductions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right border-l font-black text-teal-700 bg-teal-50/50 dark:bg-teal-900/20 shadow-inner whitespace-nowrap">₹{data.netWages.toLocaleString()}</TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
              </Card>
            ) : (
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
                      <p><strong>Department:</strong> {departmentName}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Part I - Adults</strong></p>
                      <p><strong>Calendar Year:</strong> {selectedYear}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white dark:bg-slate-950">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900">
                          <TableHead className="text-center w-10 border-r" rowSpan={2}>Sr. No.</TableHead>
                          <TableHead className="text-center w-16 border-r" rowSpan={2}>Emp ID</TableHead>
                          <TableHead className="min-w-[150px] border-r" rowSpan={2}>Name</TableHead>
                          <TableHead className="text-center w-20 border-r" rowSpan={2}>DOJ</TableHead>
                          <TableHead className="text-center border-b" colSpan={5}>Number of days during calendar year</TableHead>
                          <TableHead className="text-center border-b" colSpan={3}>Leave with wages to credit</TableHead>
                          <TableHead className="text-center w-16 border-l" rowSpan={2}>Daily Rate</TableHead>
                          <TableHead className="text-center w-16 border-l" rowSpan={2}>Leave Wages</TableHead>
                          <TableHead className="text-center w-20 border-l" rowSpan={2}>Remarks</TableHead>
                        </TableRow>
                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                          <TableHead className="text-center w-14 border-r">Days Worked</TableHead>
                          <TableHead className="text-center w-12 border-r">Lay-off</TableHead>
                          <TableHead className="text-center w-14 border-r">Maternity</TableHead>
                          <TableHead className="text-center w-12 border-r">Leave Enjoyed</TableHead>
                          <TableHead className="text-center w-12 border-r">Total</TableHead>
                          <TableHead className="text-center w-14 border-r">Previous Balance</TableHead>
                          <TableHead className="text-center w-12 border-r">Earned</TableHead>
                          <TableHead className="text-center w-12">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                              No employees found. Add employees to generate leave register.
                            </TableCell>
                          </TableRow>
                        ) : (
                          employees.map((emp, index) => {
                            const data = calculateLeaveData(emp);

                            return (
                              <TableRow key={emp.id} data-testid={`row-employee-${emp.id}`} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="text-center border-r font-medium text-slate-500">{index + 1}</TableCell>
                                <TableCell className="text-center border-r font-medium text-slate-600">{emp.employeeId}</TableCell>
                                <TableCell className="font-semibold border-r text-slate-900 dark:text-slate-100">{emp.firstName} {emp.lastName}</TableCell>
                                <TableCell className="text-center border-r text-slate-600">
                                  {emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : "-"}
                                </TableCell>
                                <TableCell className="text-center border-r font-medium">{data.daysWorked}</TableCell>
                                <TableCell className="text-center border-r font-medium">{data.layOffDays}</TableCell>
                                <TableCell className="text-center border-r font-medium">{data.maternityLeave}</TableCell>
                                <TableCell className="text-center border-r font-medium">{data.leaveEnjoyed}</TableCell>
                                <TableCell className="text-center border-r font-black text-slate-900">{data.totalDays}</TableCell>
                                <TableCell className="text-center border-r font-medium text-amber-600">{data.previousBalance}</TableCell>
                                <TableCell className="text-center border-r font-medium text-emerald-600">{data.earnedLeave}</TableCell>
                                <TableCell className="text-center font-black text-teal-700 bg-teal-50/30">{data.balanceLeave}</TableCell>
                                <TableCell className="text-right border-l font-bold text-slate-700">₹{data.dailyRate.toLocaleString()}</TableCell>
                                <TableCell className="text-right border-l font-black text-teal-700 bg-teal-50/50">₹{(data.leaveWages > 0 ? data.leaveWages : 0).toLocaleString()}</TableCell>
                                <TableCell className="text-center border-l text-slate-400">-</TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="print:block hidden text-sm mt-8">
              {activeForm === "form-ii" ? (
                <div className="flex justify-between">
                  <div>
                    <p>Signature of the Authorised Representative:</p>
                    <p>Principal Employer (In the case of Contract Labour):</p>
                  </div>
                  <div className="text-right">
                    <p>Signature of the Employer or the person authorised</p>
                    <p>by him to authenticate the above entries with the company seal</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Note: Separate page will be allotted to each worker as per Form 20 requirements.
                </p>
              )}
            </div>
          </div>
        </main>
        </div>
      </div>
    </AppLayout>
  );
}
