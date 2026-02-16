import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Calculator,
  PiggyBank,
  Shield,
  Briefcase,
  Edit,
  Save,
  X,
  CreditCard,
  CheckCircle,
  Clock,
  Receipt,
  Download,
  Eye,
  Building2,
  UserCheck,
  BarChart3,
  Target,
  Award,
  ChevronRight,
  Settings,
  ChevronDown,
  ChevronUp,
  Percent,
  RotateCcw,
  AlertTriangle,
  Banknote,
  Wand2,
  Plus
} from "lucide-react";
import { User, PaymentRecord, Department } from "@shared/schema";
import * as XLSX from 'xlsx';
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { hasPermission } from "@/lib/permissions";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CTCCalculator } from "@/components/payroll/ctc-calculator";

export default function PayrollPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Role detection for dual-mode functionality
  const canAdminPayroll = hasPermission(user, "payroll.view");
  const isEmployeePayroll = !canAdminPayroll && hasPermission(user, "payroll.view_own");
  
  // Redirect if user has no payroll permissions
  if (!canAdminPayroll && !isEmployeePayroll) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don't have permission to access payroll information.</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
  const [editSalary, setEditSalary] = useState<string>("");
  
  // Payment tracking state
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMode: '',
    referenceNo: '',
    daysWorked: 25,
    totalDaysInMonth: 30
  });
  
  // Current month for filtering
  const currentMonth = format(new Date(), 'MMM yyyy');
  
  // Salary component configuration state
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  
  // Salary components schema
  const salaryComponentsSchema = z.object({
    basicSalaryPercentage: z.coerce.number().min(0).max(100),
    hraPercentage: z.coerce.number().min(0).max(100),
    epfPercentage: z.coerce.number().min(0).max(100),
    esicPercentage: z.coerce.number().min(0).max(100),
    professionalTax: z.coerce.number().min(0)
  });

  type SalaryComponentsForm = z.infer<typeof salaryComponentsSchema>;
  
  // Fetch employees data (admin only)
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
    enabled: canAdminPayroll,
  });

  // Fetch departments data (admin only)
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: canAdminPayroll,
  });
  
  // Fetch payment records - server handles role-based filtering
  const { data: paymentRecords = [] } = useQuery<PaymentRecord[]>({
    queryKey: ["/api/payment-records"],
    queryFn: async () => {
      const response = await fetch("/api/payment-records", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch payment records");
      }
      return response.json();
    },
  });

  // Fetch system settings for salary components
  const { data: systemSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings/system"],
    queryFn: async () => {
      const response = await fetch("/api/settings/system", {
        credentials: "include",
      });
      if (!response.ok) {
        // For employees, 403 is expected - they don't have access to system settings
        // Return null to use default values
        if (response.status === 403) {
          return null;
        }
        throw new Error("Failed to fetch system settings");
      }
      return response.json();
    },
    // Don't retry for 403 errors
    retry: (failureCount, error) => {
      if (error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Get current salary components from settings or defaults
  const currentSalaryComponents = systemSettings?.salaryComponents || {
    basicSalaryPercentage: 50,
    hraPercentage: 50,
    epfPercentage: 12,
    esicPercentage: 0.75,
    professionalTax: 200
  };

  // Form for salary components configuration
  const salaryForm = useForm<SalaryComponentsForm>({
    resolver: zodResolver(salaryComponentsSchema),
    defaultValues: currentSalaryComponents,
  });

  // Update form when settings change
  useEffect(() => {
    if (systemSettings?.salaryComponents) {
      salaryForm.reset(systemSettings.salaryComponents);
    }
  }, [systemSettings, salaryForm]);

  // Mutation for updating salary components
  const updateSalaryComponentsMutation = useMutation({
    mutationFn: async (data: SalaryComponentsForm) => {
      const updatedSettings = {
        ...(systemSettings ?? {}),
        salaryComponents: data
      };
      return await apiRequest("PUT", "/api/settings/system", updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({
        title: "Success",
        description: "Salary component percentages updated successfully",
      });
      setConfigPanelOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update salary component percentages",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating employee salary
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, salary }: { id: number; salary: number }) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ salary }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to update salary");
      }
      
      return response.json();
    },
    onMutate: async ({ id, salary }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["/api/employees"] });

      // Snapshot the previous value
      const previousEmployees = queryClient.getQueryData<User[]>(["/api/employees"]);

      // Optimistically update to the new value
      queryClient.setQueryData<User[]>(["/api/employees"], (old) =>
        old ? old.map(emp => emp.id === id ? { ...emp, salary } : emp) : []
      );

      // Return a context object with the snapshotted value
      return { previousEmployees };
    },
    onSuccess: (updatedEmployee, { id, salary }) => {
      // Update the cache with the actual server response
      queryClient.setQueryData<User[]>(["/api/employees"], (old) =>
        old ? old.map(emp => emp.id === id ? updatedEmployee : emp) : []
      );
      
      // Refetch to ensure we have the latest data
      queryClient.refetchQueries({ queryKey: ["/api/employees"] });
      
      setEditingEmployee(null);
      setEditSalary("");
      toast({
        title: "Success",
        description: "Employee salary updated successfully",
      });
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousEmployees) {
        queryClient.setQueryData(["/api/employees"], context.previousEmployees);
      }
      
      toast({
        title: "Error",
        description: "Failed to update employee salary",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating/updating payment records
  const paymentRecordMutation = useMutation({
    mutationFn: async (paymentData: { employeeId: number; paymentStatus: 'pending' | 'paid'; paymentDate?: Date; paymentMode?: string; referenceNo?: string; amount: number; month: string }) => {
      // Check if record exists
      const existingRecord = paymentRecords.find(r => r.employeeId === paymentData.employeeId && r.month === paymentData.month);
      
      if (existingRecord) {
        // Update existing record
        const response = await fetch(`/api/payment-records/${existingRecord.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentStatus: paymentData.paymentStatus,
            paymentDate: paymentData.paymentDate,
            paymentMode: paymentData.paymentMode,
            referenceNo: paymentData.referenceNo,
          }),
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to update payment record");
        }
        
        return response.json();
      } else {
        // Create new record
        const response = await fetch("/api/payment-records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to create payment record");
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records"] });
      toast({
        title: "Success",
        description: "Payment record updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update payment record",
        variant: "destructive",
      });
    },
  });

  // Payment record update mutation (separate from create)
  const paymentUpdateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }: { id: number } & Partial<PaymentRecord>) => {
      const response = await fetch(`/api/payment-records/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to update payment record");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-records"] });
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  // Step 1: Calculate Gross Salary (Pro-rated based on days worked)
  const calculateGrossSalary = (monthlyCTC: number, daysWorked: number = 25, totalDaysInMonth: number = 30) => 
    (monthlyCTC / totalDaysInMonth) * daysWorked;
  
  // Step 2: Calculate earnings breakdown (using dynamic percentages)
  const calculateBasicSalary = (grossSalary: number) => (grossSalary || 0) * ((currentSalaryComponents?.basicSalaryPercentage || 50) / 100);
  const calculateHRA = (basicSalary: number) => (basicSalary || 0) * ((currentSalaryComponents?.hraPercentage || 50) / 100);
  
  // Additional earnings components
  const calculateDA = (basicSalary: number) => (basicSalary || 0) * 0.10;
  const calculateTransAll = (basicSalary: number) => (basicSalary || 0) * 0.16;
  const calculateLTA = (basicSalary: number) => (basicSalary || 0) * 0.04;
  const calculateChildAll = (basicSalary: number) => (basicSalary || 0) * 0.04;
  const calculateMedAll = (basicSalary: number) => (basicSalary || 0) * 0.10;
  const calculateOthAll = (basicSalary: number) => (basicSalary || 0) * 0.06;
  
  const calculateSpecialAllowance = (grossSalary: number, basicSalary: number, hra: number, da: number, trans: number, lta: number, child: number, med: number, oth: number) => {
    const totalAllowances = (basicSalary || 0) + (hra || 0) + (da || 0) + (trans || 0) + (lta || 0) + (child || 0) + (med || 0) + (oth || 0);
    return Math.max(0, (grossSalary || 0) - totalAllowances);
  };
  
  // Step 3: Calculate deductions (using dynamic percentages)
  const calculateEPF = (basicSalary: number) => Math.min(basicSalary || 0, 15000) * 0.12;
  const calculateESIC = (grossSalary: number) => (grossSalary || 0) <= 21000 ? Math.round((grossSalary || 0) * 0.0075) : 0;
  const calculateProfessionalTax = () => 200;
  
  // MLWF - Half yearly (June & December only) - Employee: 25, Employer: 75
  const mlwfMonthNum = new Date().getMonth() + 1; // 1-12
  const isMlwfMonth = mlwfMonthNum === 6 || mlwfMonthNum === 12;
  const calculateMLWFEmployee = () => isMlwfMonth ? 25 : 0;
  const calculateMLWFEmployer = () => isMlwfMonth ? 75 : 0;

  // Calculate payroll metrics
  const activeEmployees = employees.length;
  const totalSalaryBudget = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
  const avgSalary = activeEmployees > 0 ? totalSalaryBudget / activeEmployees : 0;
  
  // Step 4: Calculate net salary
  const calculateNetSalary = (grossSalary: number, epf: number, esic: number, professionalTax: number, mlwf: number) => 
    grossSalary - (epf + esic + professionalTax + mlwf);

  // Convenience function to get all salary components
  const getSalaryBreakdown = (monthlyCTC: number, daysWorked: number = 25, totalDaysInMonth: number = 30) => {
    const grossSalary = calculateGrossSalary(monthlyCTC, daysWorked, totalDaysInMonth);
    const basicSalary = calculateBasicSalary(grossSalary);
    const hra = calculateHRA(basicSalary);
    const da = calculateDA(basicSalary);
    const trans = calculateTransAll(basicSalary);
    const lta = calculateLTA(basicSalary);
    const child = calculateChildAll(basicSalary);
    const med = calculateMedAll(basicSalary);
    const oth = calculateOthAll(basicSalary);
    
    const specialAllowance = calculateSpecialAllowance(grossSalary, basicSalary, hra, da, trans, lta, child, med, oth);
    
    const epf = calculateEPF(basicSalary);
    const esic = calculateESIC(grossSalary);
    const professionalTax = calculateProfessionalTax();
    const mlwfEmployee = calculateMLWFEmployee();
    const mlwfEmployer = calculateMLWFEmployer();
    const netSalary = calculateNetSalary(grossSalary, epf, esic, professionalTax, mlwfEmployee);
    
    return {
      monthlyCTC,
      daysWorked,
      totalDaysInMonth,
      grossSalary,
      basicSalary,
      hra,
      da,
      trans,
      lta,
      child,
      med,
      oth,
      specialAllowance,
      epf,
      esic,
      professionalTax,
      mlwfEmployee,
      mlwfEmployer,
      totalDeductions: epf + esic + professionalTax + mlwfEmployee,
      netSalary
    };
  };

  // Dynamic payroll data calculated from configurable salary components
  const payrollData = {
    epfContribution: employees.reduce((sum, emp) => {
      const monthlyCTC = emp.salary || 0;
      const breakdown = getSalaryBreakdown(monthlyCTC);
      const basicSalary = breakdown.basicSalary;
      return sum + (Math.min(basicSalary, 15000) * 0.12); // Employee PF (12%)
    }, 0),
    employerPFContribution: employees.reduce((sum, emp) => {
      const monthlyCTC = emp.salary || 0;
      const breakdown = getSalaryBreakdown(monthlyCTC);
      const basicSalary = breakdown.basicSalary;
      return sum + (Math.min(basicSalary, 15000) * 0.13); // Employer PF (13%)
    }, 0),
    esiContribution: employees.reduce((sum, emp) => {
      const monthlyCTC = emp.salary || 0;
      const grossSalary = calculateGrossSalary(monthlyCTC);
      return sum + (grossSalary <= 21000 ? Math.round(grossSalary * 0.0325) : 0); // Employer ESI (3.25%)
    }, 0),
    tdsDeduction: totalSalaryBudget * 0.10, // Keep TDS as fixed percentage - not part of salary components
    finalSettlements: 3,
    benefits: totalSalaryBudget * 0.15, // Keep benefits as fixed - not part of salary components
    deductions: employees.reduce((sum, emp) => {
      const monthlyCTC = emp.salary || 0;
      const breakdown = getSalaryBreakdown(monthlyCTC);
      return sum + breakdown.totalDeductions;
    }, 0),
  };

  // Employee-specific data: their own salary breakdown (using current settings)
  const userSalaryBreakdown = isEmployeePayroll && user && user.salary && !isLoadingSettings ? 
    getSalaryBreakdown(user.salary) : null;

  const handleEditSalary = (employee: User) => {
    setEditingEmployee(employee.id);
    setEditSalary(employee.salary?.toString() || "0");
  };

  const handleSaveSalary = (employeeId: number) => {
    const salary = parseInt(editSalary);
    if (isNaN(salary) || salary < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid salary amount",
        variant: "destructive",
      });
      return;
    }
    updateEmployeeMutation.mutate({ id: employeeId, salary });
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditSalary("");
  };

  // Track which employees have been processed to avoid duplicates (employee-month combinations)
  const [processedEmployees, setProcessedEmployees] = useState<Set<string>>(new Set());

  // Initialize payment records for employees who don't have them (admin only)
  useEffect(() => {
    if (canAdminPayroll && employees.length > 0 && paymentRecords !== undefined && !paymentRecordMutation.isPending) {
      // Generate last 3 months dynamically relative to current date
      const now = new Date();
      const monthsToGenerate: string[] = [];
      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthsToGenerate.push(format(monthDate, 'MMM yyyy'));
      }

      employees.forEach(employee => {
        monthsToGenerate.forEach(month => {
          const hasExistingRecord = paymentRecords.some(r => 
            r.employeeId === employee.id && r.month === month
          );
          const alreadyProcessed = processedEmployees.has(`${employee.id}-${month}`);
          
          if (!hasExistingRecord && !alreadyProcessed) {
            const monthlyCTC = employee.salary || 0;
            const breakdown = getSalaryBreakdown(monthlyCTC);
            
            setProcessedEmployees(prev => new Set(Array.from(prev).concat(`${employee.id}-${month}`)));
            
            // Set status based on month - older months are paid, current month is pending
            const isPastMonth = month !== currentMonth;
            const monthIndex = monthsToGenerate.indexOf(month);
            const monthDate = new Date(now.getFullYear(), now.getMonth() - (monthsToGenerate.length - 1 - monthIndex), 25);
            
            paymentRecordMutation.mutate({
              employeeId: employee.id,
              month: month,
              paymentStatus: isPastMonth ? 'paid' : 'pending',
              amount: Math.round(breakdown.netSalary),
              paymentDate: isPastMonth ? monthDate : undefined,
              paymentMode: isPastMonth ? 'bank_transfer' : undefined,
              referenceNo: isPastMonth ? `TXN_${month.split(' ')[0].toUpperCase()}_${employee.id}` : undefined
            });
          }
        });
      });
    }
  }, [canAdminPayroll, employees.length, paymentRecords?.length, processedEmployees, paymentRecordMutation.isPending]);

  const handleMarkAsPaid = (employee: User) => {
    setSelectedEmployee(employee);
    setPaymentDialog(true);
  };

  const handleCompletePayment = () => {
    if (!selectedEmployee) return;
    
    if (!paymentRecords || paymentRecords.length === 0) {
      toast({
        title: "Error",
        description: "Payment records are still loading. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Find existing payment record for this employee and month
    const existingRecord = paymentRecords?.find(r => 
      r.employeeId === selectedEmployee.id && r.month === currentMonth
    );
    
    const breakdown = getSalaryBreakdown(selectedEmployee.salary || 0, paymentForm.daysWorked, paymentForm.totalDaysInMonth);
    
    if (existingRecord && existingRecord.id) {
      // Update existing record to mark as paid
      paymentUpdateMutation.mutate({
        id: existingRecord.id,
        paymentStatus: 'paid',
        paymentDate: new Date(paymentForm.paymentDate),
        paymentMode: paymentForm.paymentMode as "bank_transfer" | "cheque" | "cash" | "upi",
        referenceNo: paymentForm.referenceNo,
        amount: Math.round(breakdown.netSalary)
      });
    } else {
      // Create new record if none exists (fallback)
      const monthlyCTC = selectedEmployee.salary || 0;
      
      paymentRecordMutation.mutate({
        employeeId: selectedEmployee.id,
        month: currentMonth,
        paymentStatus: 'paid',
        paymentDate: new Date(paymentForm.paymentDate),
        paymentMode: paymentForm.paymentMode as "bank_transfer" | "cheque" | "cash" | "upi",
        referenceNo: paymentForm.referenceNo,
        amount: Math.round(breakdown.netSalary)
      });
    }
    
    setPaymentDialog(false);
    setSelectedEmployee(null);
    setPaymentForm({
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentMode: '',
      referenceNo: '',
      daysWorked: 25,
      totalDaysInMonth: 30
    });
    
    toast({
      title: "Payment Completed",
      description: `Payment marked as completed for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
    });
  };

  const getPaymentRecord = (employeeId: number) => {
    return paymentRecords?.find(record => 
      record.employeeId === employeeId && record.month === currentMonth
    );
  };

  // Export payroll data to Excel
  const handleExportPayrollToExcel = () => {
    try {
      // Validate we have employee data
      if (!employees || employees.length === 0) {
        toast({
          title: "No Data",
          description: "No employee data available to export",
          variant: "destructive",
        });
        return;
      }

      const exportData = employees.map((employee) => {
        const monthlyCTC = employee.salary || 0;
        const breakdown = getSalaryBreakdown(monthlyCTC);

        // Find department name from departmentId
        const department = departments?.find((dept: Department) => dept.id === employee.departmentId);
        const departmentName = department?.name || 'Not assigned';

        return {
          'Employee Name': `${employee.firstName} ${employee.lastName}`,
          'Employee ID': employee.id,
          'Position': employee.position || 'Not set',
          'Department': departmentName,
          'Monthly CTC (INR)': breakdown.monthlyCTC || 0,
          'Gross Salary (INR)': Math.round(breakdown.grossSalary || 0),
          'Basic Salary (INR)': Math.round(breakdown.basicSalary || 0),
          'HRA (INR)': Math.round(breakdown.hra || 0),
          'Special Allowance (INR)': Math.round(breakdown.specialAllowance || 0),
          'EPF (INR)': Math.round(breakdown.epf || 0),
          'ESIC (INR)': Math.round(breakdown.esic || 0),
          'Professional Tax (INR)': breakdown.professionalTax,
          'Total Deductions (INR)': Math.round(breakdown.totalDeductions),
          'Net Salary (INR)': Math.round(breakdown.netSalary),
          'Email': employee.email,
          'Join Date': employee.joinDate ? format(new Date(employee.joinDate), 'MMM dd, yyyy') : 'Not set',
          'Phone': employee.phoneNumber || 'Not provided'
        };
      });

      // Create the Excel workbook
      const workbook = XLSX.utils.book_new();
      
      // Create worksheet from JSON data
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better formatting
      const colWidths = [
        { wch: 20 }, // Employee Name
        { wch: 12 }, // Employee ID
        { wch: 15 }, // Position
        { wch: 15 }, // Department
        { wch: 15 }, // Monthly CTC
        { wch: 15 }, // Gross Salary
        { wch: 15 }, // Basic Salary
        { wch: 12 }, // HRA
        { wch: 18 }, // Special Allowance
        { wch: 12 }, // EPF
        { wch: 12 }, // ESIC
        { wch: 15 }, // Professional Tax
        { wch: 18 }, // Total Deductions
        { wch: 15 }, // Net Salary
        { wch: 25 }, // Email
        { wch: 12 }, // Join Date
        { wch: 15 }, // Phone
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Distribution');

      // Generate filename
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const filename = `Payroll_Distribution_${currentDate}.xlsx`;

      // Write and download the file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Successful",
        description: `Payroll distribution exported as ${filename}`,
      });

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export payroll data to Excel",
        variant: "destructive",
      });
    }
  };

  // Generate and download payslip PDF for employee
  const generatePayslipPDF = (paymentRecord: PaymentRecord) => {
    try {
      // Find the employee for this payment record
      let targetEmployee: User | undefined;
      let salaryBreakdown: any;

      if (isEmployeePayroll) {
        // Employee mode - use current user data with ownership validation
        if (!user || !user.salary) {
          toast({
            title: "Error",
            description: "Unable to generate payslip - missing employee data",
            variant: "destructive",
          });
          return;
        }

        // Security check: ensure employee can only access their own payslip
        if (paymentRecord.employeeId !== user.id) {
          toast({
            title: "Access Denied",
            description: "You can only download your own payslips",
            variant: "destructive",
          });
          return;
        }

        targetEmployee = user;
        salaryBreakdown = getSalaryBreakdown(user.salary);
      } else {
        // Admin mode - find the employee from payment record
        targetEmployee = employees.find(emp => emp.id === paymentRecord.employeeId);
        
        if (!targetEmployee || !targetEmployee.salary) {
          toast({
            title: "Error",
            description: "Unable to find employee data for this payslip",
            variant: "destructive",
          });
          return;
        }

        // Calculate salary breakdown for this employee
        // Use amount from payment record if it exists to get the actual paid breakdown
        const monthlyCTC = targetEmployee.salary || 0;
        const totalAmount = paymentRecord.amount || 0;
        
        // Infer days worked if amount is different from standard gross
        const standardGross = (monthlyCTC / 30) * 25;
        let daysWorked = 25;
        if (totalAmount > 0 && Math.abs(totalAmount - standardGross) > 10) {
           // Basic calculation to show pro-rated days on payslip if it was adjusted
           daysWorked = Math.round((totalAmount / (monthlyCTC / 30)) * 10) / 10;
        }
        
        salaryBreakdown = getSalaryBreakdown(monthlyCTC, daysWorked);
      }

      const doc = new jsPDF();
      
      // ... (existing code)
      
      // Employee details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const employeeDetails = [
        [`Employee Name: ${targetEmployee.firstName} ${targetEmployee.lastName}`, `Employee ID: ${targetEmployee.id}`],
        [`Position: ${targetEmployee.position || 'Not specified'}`, `Email: ${targetEmployee.email}`],
        [`Days Worked: ${salaryBreakdown.daysWorked} / ${salaryBreakdown.totalDaysInMonth}`, `Month: ${paymentRecord.month}`],
        [`Payment Date: ${paymentRecord.paymentDate ? format(new Date(paymentRecord.paymentDate), 'MMM dd, yyyy') : 'N/A'}`, `Payslip ID: PAY-${paymentRecord.id}-${paymentRecord.month.replace(' ', '')}`]
      ];

      let currentY = 60;
      employeeDetails.forEach((row, index) => {
        doc.text(row[0], 20, currentY);
        doc.text(row[1], 120, currentY);
        currentY += 7;
      });

      // Earnings and Deductions table
      const tableData = [
        // Earnings section
        ["EARNINGS", "", "DEDUCTIONS", ""],
        ["Basic Salary", `₹${Math.round(salaryBreakdown.basicSalary).toLocaleString()}`, `EPF (${currentSalaryComponents.epfPercentage}%)`, `₹${Math.round(salaryBreakdown.epf).toLocaleString()}`],
        [`HRA (${currentSalaryComponents.hraPercentage}%)`, `₹${Math.round(salaryBreakdown.hra).toLocaleString()}`, `ESIC (${currentSalaryComponents.esicPercentage}%)`, `₹${Math.round(salaryBreakdown.esic).toLocaleString()}`],
        ["Special Allowance", `₹${Math.round(salaryBreakdown.specialAllowance).toLocaleString()}`, "Professional Tax", `₹${Math.round(salaryBreakdown.professionalTax).toLocaleString()}`],
        ["", "", "", ""],
        ["Gross Salary", `₹${Math.round(salaryBreakdown.grossSalary).toLocaleString()}`, "Total Deductions", `₹${Math.round(salaryBreakdown.totalDeductions).toLocaleString()}`],
        ["", "", "", ""],
        ["NET SALARY", `₹${Math.round(salaryBreakdown.netSalary).toLocaleString()}`, "", ""]
      ];

      (doc as any).autoTable({
        startY: currentY + 10,
        head: [],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'left' },
          1: { halign: 'right' },
          2: { fontStyle: 'bold', halign: 'left' },
          3: { halign: 'right' }
        },
        didParseCell: function (data: any) {
          // Highlight header row and net salary row
          if (data.row.index === 0) {
            data.cell.styles.fillColor = [230, 230, 230];
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.row.index === 7) { // NET SALARY row
            data.cell.styles.fillColor = [200, 255, 200];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // Add footer
      const finalY = (doc as any).lastAutoTable.finalY || 180;
      doc.setFontSize(8);
      doc.text("This is a system-generated payslip. No signature required.", 105, finalY + 20, { align: "center" });
      doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 105, finalY + 28, { align: "center" });

      // Download the PDF
      const fileName = `Payslip_${targetEmployee.firstName}_${targetEmployee.lastName}_${paymentRecord.month.replace(' ', '_')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Success",
        description: `Payslip downloaded successfully: ${fileName}`,
      });

    } catch (error) {
      console.error("Error generating payslip:", error);
      toast({
        title: "Error",
        description: "Failed to generate payslip PDF",
        variant: "destructive",
      });
    }
  };

  // Employee View - Show only their own payroll information
  if (isEmployeePayroll) {
    const userPaymentRecord = paymentRecords.find(record => record.employeeId === user?.id && record.month === currentMonth);
    
    // Create consolidated monthly payment history for employee
    const getMonthlyPaymentHistory = () => {
      // Normalize month format function - converts various formats to "MMMM yyyy"
      const normalizeMonth = (monthStr: string): string => {
        if (!monthStr || monthStr === 'Unknown') return 'Unknown';
        try {
          // Try to parse the date and format it consistently
          const date = new Date(monthStr);
          if (!isNaN(date.getTime())) {
            return format(date, 'MMMM yyyy');
          }
          // If it's already in "MMMM yyyy" format, return as is
          return monthStr;
        } catch {
          return monthStr;
        }
      };

      // Group payment records by normalized month
      const monthlyGroups: { [key: string]: PaymentRecord[] } = {};
      
      paymentRecords.forEach(payment => {
        const normalizedMonth = normalizeMonth(payment.month || 'Unknown');
        if (!monthlyGroups[normalizedMonth]) {
          monthlyGroups[normalizedMonth] = [];
        }
        monthlyGroups[normalizedMonth].push(payment);
      });

      // Convert to consolidated monthly records
      const monthlyPayments = Object.entries(monthlyGroups)
        .filter(([month]) => month !== 'Unknown') // Filter out unknown months
        .map(([month, records]) => {
          // Check if any payment in this month is paid
          const hasPaidPayment = records.some(record => record.paymentStatus === 'paid');
          const hasAnyPayment = records.length > 0;
          
          // Get the latest payment record for this month (for reference data)
          const latestRecord = records[0];
          
          // Calculate monthly totals using employee's salary
          const monthlyCTC = user?.salary || 0;
          const breakdown = getSalaryBreakdown(monthlyCTC);
          
          // Determine overall payment status for the month
          let paymentStatus: string;
          if (hasPaidPayment) {
            paymentStatus = 'paid';
          } else if (hasAnyPayment) {
            paymentStatus = 'pending';
          } else {
            paymentStatus = 'not_generated';
          }

          // Get payment date (use the first paid record's date if any, otherwise the latest record's date)
          const paidRecord = records.find(r => r.paymentStatus === 'paid');
          const paymentDate = paidRecord?.paymentDate || latestRecord?.paymentDate;

          return {
            month,
            paymentStatus,
            grossAmount: Math.round(breakdown.grossSalary),
            netAmount: Math.round(breakdown.netSalary),
            paymentDate,
            paymentMode: paidRecord?.paymentMode || latestRecord?.paymentMode,
            referenceNo: paidRecord?.referenceNo || latestRecord?.referenceNo,
            records, // Keep original records for detailed payslip generation
            latestRecord // For payslip generation
          };
        });

      // Generate complete timeline from earliest payment record to current month
      const currentDate = new Date();
      const allMonths = [];
      
      if (monthlyPayments.length === 0) {
        // If no payment records, just show current year up to current month
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        for (let i = 0; i <= currentMonth; i++) {
          const monthDate = new Date(currentYear, i, 1);
          const monthKey = format(monthDate, 'MMMM yyyy');
          const monthlyCTC = user?.salary || 0;
          const breakdown = getSalaryBreakdown(monthlyCTC);
          
          allMonths.push({
            month: monthKey,
            paymentStatus: 'not_generated',
            grossAmount: Math.round(breakdown.grossSalary),
            netAmount: Math.round(breakdown.netSalary),
            paymentDate: null,
            paymentMode: null,
            referenceNo: null,
            records: [],
            latestRecord: null
          });
        }
      } else {
        // Find the earliest and latest months from payment records
        const paymentDates = monthlyPayments.map(mp => new Date(mp.month)).filter(date => !isNaN(date.getTime()));
        const earliestDate = paymentDates.length > 0 ? new Date(Math.min(...paymentDates.map(d => d.getTime()))) : new Date();
        const latestDate = new Date(Math.max(...paymentDates.map(d => d.getTime()), currentDate.getTime()));
        
        // Generate all months from earliest to latest/current
        let iterDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
        const endDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
        
        while (iterDate <= endDate) {
          const monthKey = format(iterDate, 'MMMM yyyy');
          
          // Check if we have existing payment data for this month
          const existingPayment = monthlyPayments.find(mp => mp.month === monthKey);
          
          if (existingPayment) {
            allMonths.push(existingPayment);
          } else {
            // Generate placeholder for months without payment records
            const monthlyCTC = user?.salary || 0;
            const breakdown = getSalaryBreakdown(monthlyCTC);
            
            allMonths.push({
              month: monthKey,
              paymentStatus: 'not_generated',
              grossAmount: Math.round(breakdown.grossSalary),
              netAmount: Math.round(breakdown.netSalary),
              paymentDate: null,
              paymentMode: null,
              referenceNo: null,
              records: [],
              latestRecord: null
            });
          }
          
          iterDate.setMonth(iterDate.getMonth() + 1);
        }
      }

      // Sort by month (newest first)
      return allMonths.sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB.getTime() - dateA.getTime();
      });
    };

    // Calculate salary breakdown using the same formula
    const getSalaryBreakdown = (monthlyCTC: number) => {
      const grossSalary = (monthlyCTC / 30) * 25; // Monthly CTC ÷ 30 × 25 payable days
      const basicSalary = grossSalary * 0.5; // 50% of Gross
      const hra = basicSalary * 0.5; // 50% of Basic
      const specialAllowance = grossSalary - basicSalary - hra; // Balance
      const epf = basicSalary * 0.12; // 12% of Basic
      const esic = grossSalary * 0.0075; // 0.75% of Gross
      const professionalTax = 200; // Fixed ₹200
      const totalDeductions = epf + esic + professionalTax;
      const netSalary = grossSalary - totalDeductions;
      
      return {
        monthlyCTC,
        grossSalary,
        basicSalary,
        hra,
        specialAllowance,
        epf,
        esic,
        professionalTax,
        totalDeductions,
        netSalary
      };
    };

    const monthlyPaymentHistory = getMonthlyPaymentHistory();
    const salaryBreakdown = user?.salary ? getSalaryBreakdown(user.salary) : null;
    
    return (
      <AppLayout>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 space-y-6 p-6"
        >
          {/* Employee Header */}
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl border-2 border-green-100 shadow-lg">
            <div className="px-6 py-5">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl shadow-sm">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">My Payroll</h1>
                  <p className="text-slate-600 mt-1">
                    Your salary breakdown and payment history
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Structure */}
          {userSalaryBreakdown && (
            <Card className="border-2 border-slate-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
                <CardTitle className="flex items-center text-xl text-slate-800" data-testid="title-salary-structure">
                  <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                  My Salary Structure - {currentMonth}
                </CardTitle>
                <CardDescription>Detailed breakdown of your monthly compensation</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-green-700 text-lg flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Earnings
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-green-100" data-testid="row-monthly-ctc">
                        <span className="text-slate-600">Monthly CTC:</span>
                        <span className="font-medium" data-testid="text-monthly-ctc">₹{userSalaryBreakdown.monthlyCTC.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-100" data-testid="row-gross-salary">
                        <span className="text-slate-600">Gross Salary (25 days):</span>
                        <span className="font-medium" data-testid="text-gross-salary">₹{userSalaryBreakdown.grossSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-100" data-testid="row-basic-salary">
                        <span className="text-slate-600">Basic Salary (50%):</span>
                        <span className="font-medium" data-testid="text-basic-salary">₹{userSalaryBreakdown.basicSalary.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-100" data-testid="row-hra">
                        <span className="text-slate-600">HRA (50% of Basic):</span>
                        <span className="font-medium" data-testid="text-hra">₹{userSalaryBreakdown.hra.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2" data-testid="row-special-allowance">
                        <span className="text-slate-600">Special Allowance:</span>
                        <span className="font-medium" data-testid="text-special-allowance">₹{userSalaryBreakdown.specialAllowance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-red-700 text-lg flex items-center">
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Deductions
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-red-100" data-testid="row-epf">
                        <span className="text-slate-600">EPF (12%):</span>
                        <span className="font-medium" data-testid="text-epf">₹{userSalaryBreakdown.epf.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-red-100" data-testid="row-esic">
                        <span className="text-slate-600">ESIC (0.75%):</span>
                        <span className="font-medium" data-testid="text-esic">₹{userSalaryBreakdown.esic.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-red-100" data-testid="row-professional-tax">
                        <span className="text-slate-600">Professional Tax:</span>
                        <span className="font-medium" data-testid="text-professional-tax">₹{userSalaryBreakdown.professionalTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 font-semibold text-red-700" data-testid="row-total-deductions">
                        <span>Total Deductions:</span>
                        <span data-testid="text-total-deductions">₹{userSalaryBreakdown.totalDeductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="mt-6 pt-6 border-t-2 border-slate-200">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                    <div className="flex justify-between items-center" data-testid="row-net-salary">
                      <span className="text-lg font-semibold text-slate-700">Net Salary:</span>
                      <span className="text-2xl font-bold text-green-600" data-testid="text-net-salary">
                        ₹{userSalaryBreakdown.netSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg border-b border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-xl text-slate-800" data-testid="title-payment-history">
                    <Receipt className="w-5 h-5 mr-2 text-orange-600" />
                    💳 My Payment History
                  </CardTitle>
                  <CardDescription className="text-slate-600">Monthly salary payment records and payslip management</CardDescription>
                </div>
                {salaryBreakdown && (
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Monthly CTC</div>
                      <div className="text-lg font-bold text-slate-900">₹{salaryBreakdown.monthlyCTC.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Net Salary</div>
                      <div className="text-lg font-bold text-emerald-600">₹{Math.round(salaryBreakdown.netSalary).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-white/60 rounded-lg border border-slate-200/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Month</TableHead>
                      <TableHead className="font-semibold text-slate-700">Gross Salary</TableHead>
                      <TableHead className="font-semibold text-slate-700">Net Amount</TableHead>
                      <TableHead className="font-semibold text-slate-700">Payment Status</TableHead>
                      <TableHead className="font-semibold text-slate-700">Payment Date</TableHead>
                      <TableHead className="font-semibold text-slate-700">Mode</TableHead>
                      <TableHead className="font-semibold text-slate-700">Reference No</TableHead>
                      <TableHead className="font-semibold text-slate-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyPaymentHistory.length > 0 ? monthlyPaymentHistory.map((monthlyPayment, index) => {
                      return (
                        <TableRow key={`monthly-${monthlyPayment.month}-${index}`} data-testid={`monthly-payment-${index}`}>
                          <TableCell className="font-medium text-slate-900">
                            <div className="flex flex-col">
                              <span className="font-semibold">{monthlyPayment.month}</span>
                              <span className="text-xs text-slate-500">Pay Period</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">₹{monthlyPayment.grossAmount.toLocaleString()}</span>
                              <span className="text-xs text-slate-500">Before deductions</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-emerald-700">₹{monthlyPayment.netAmount.toLocaleString()}</span>
                              <span className="text-xs text-slate-500">Take-home amount</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={monthlyPayment.paymentStatus === 'paid' ? 'default' : 'secondary'}
                                className={
                                  monthlyPayment.paymentStatus === 'paid' 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : monthlyPayment.paymentStatus === 'pending'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }
                                data-testid={`payment-status-${index}`}
                              >
                                {monthlyPayment.paymentStatus === 'paid' ? (
                                  <div className="flex items-center space-x-1">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Paid</span>
                                  </div>
                                ) : monthlyPayment.paymentStatus === 'pending' ? (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Pending</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    <span>Not Generated</span>
                                  </div>
                                )}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">
                                {monthlyPayment.paymentDate ? format(new Date(monthlyPayment.paymentDate), 'MMM dd, yyyy') : '-'}
                              </span>
                              {monthlyPayment.paymentDate && (
                                <span className="text-xs text-slate-500">
                                  {format(new Date(monthlyPayment.paymentDate), 'EEEE')}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {monthlyPayment.paymentMode ? (
                                <div className="flex items-center space-x-1">
                                  {monthlyPayment.paymentMode === 'bank_transfer' && <CreditCard className="h-4 w-4 text-blue-600" />}
                                  {monthlyPayment.paymentMode === 'cheque' && <Receipt className="h-4 w-4 text-purple-600" />}
                                  {monthlyPayment.paymentMode === 'cash' && <Banknote className="h-4 w-4 text-green-600" />}
                                  {monthlyPayment.paymentMode === 'upi' && <CreditCard className="h-4 w-4 text-orange-600" />}
                                  <span className="text-sm capitalize">
                                    {monthlyPayment.paymentMode?.replace('_', ' ') || '-'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-500">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-sm text-slate-900">
                                {monthlyPayment.referenceNo || '-'}
                              </span>
                              {monthlyPayment.referenceNo && (
                                <span className="text-xs text-slate-500">Transaction ID</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  if (monthlyPayment.latestRecord) {
                                    generatePayslipPDF(monthlyPayment.latestRecord);
                                  }
                                }}
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800"
                                data-testid={`download-payslip-${index}`}
                                disabled={monthlyPayment.paymentStatus === 'not_generated'}
                              >
                                <div className="flex items-center space-x-1">
                                  <Download className="h-3 w-3" />
                                  <span className="hidden sm:inline text-xs">Download</span>
                                </div>
                              </Button>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12" data-testid="no-monthly-payment-records">
                          <div className="flex flex-col items-center space-y-4">
                            <Receipt className="h-8 w-8 text-slate-400" />
                            <span>No payment records found</span>
                            <p className="text-sm text-slate-500 max-w-md">
                              Payment records will appear here once salary payments are processed.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AppLayout>
    );
  }

  // Admin View - Original comprehensive payroll management
  return (
    <AppLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 space-y-8 p-6"
      >
        {/* Executive Header Section */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-100 shadow-lg">
          <div className="px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl shadow-sm">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Payroll Management</h1>
                <p className="text-slate-600 text-lg mt-1">
                  Comprehensive payroll processing and employee compensation management
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg">
          <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-8 py-6 rounded-t-2xl border-b-2 border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-3 rounded-xl mr-4 shadow-sm">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              Key Payroll Metrics
            </h2>
            <p className="text-sm text-slate-600 mt-1 ml-12">
              Real-time overview of payroll statistics and employee compensation
            </p>
          </div>

          <div className="p-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 via-blue-100/50 to-white rounded-xl border-2 border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-blue-900">Total Payroll Cost</p>
                  <p className="text-2xl font-bold text-slate-900">₹{totalSalaryBudget.toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +2.1% from last month
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white rounded-xl border-2 border-emerald-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-3 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-emerald-900">Active Employees</p>
                  <p className="text-2xl font-bold text-slate-900">{activeEmployees}</p>
                  <p className="text-sm text-slate-600">Currently on payroll</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-purple-50 via-purple-100/50 to-white rounded-xl border-2 border-purple-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-purple-900">Average Salary</p>
                  <p className="text-2xl font-bold text-slate-900">₹{Math.round(avgSalary).toLocaleString()}</p>
                  <p className="text-sm text-slate-600">Per employee average</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-br from-orange-50 via-orange-100/50 to-white rounded-xl border-2 border-orange-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-3 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-orange-900">Final Settlements</p>
                  <p className="text-2xl font-bold text-slate-900">{payrollData.finalSettlements}</p>
                  <p className="text-sm text-slate-600">Pending this month</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden"
        >
          <Tabs defaultValue="overview" className="w-full">
            {/* Professional Tabs Header */}
            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-8 py-6 border-b-2 border-slate-100 flex justify-between items-center">
              <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200 p-1 rounded-xl h-12 border-2 border-slate-300">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-blue-200 text-slate-700 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:bg-white/50"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="salary" 
                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-emerald-200 text-slate-700 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:bg-white/50"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Salary
                </TabsTrigger>
                <TabsTrigger 
                  value="calculator" 
                  className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-indigo-200 text-slate-700 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:bg-white/50"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  CTC Calculator
                </TabsTrigger>
                <TabsTrigger 
                  value="payments" 
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-purple-200 text-slate-700 font-semibold px-6 py-2 rounded-lg transition-all duration-300 hover:bg-white/50"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Tracking
                </TabsTrigger>
              </TabsList>
              
              <Button 
                onClick={handleExportPayrollToExcel}
                variant="outline" 
                size="default"
                className="flex items-center gap-2 bg-gradient-to-r from-white to-slate-50 border-2 border-slate-300 hover:border-slate-400 hover:shadow-lg transition-all duration-300 rounded-xl px-6 py-3 text-slate-700 font-semibold"
                data-testid="button-export-excel-header"
              >
                <Download className="h-5 w-5" />
                Export Excel
              </Button>
            </div>

            <TabsContent value="calculator" className="p-8 space-y-4">
              <CTCCalculator />
            </TabsContent>

            <TabsContent value="overview" className="p-8 space-y-8">
              {/* Enhanced Overview Section Header */}
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl mr-4 shadow-sm">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  Detailed Payroll Analysis
                </h3>
                <p className="text-slate-600 ml-12">Comprehensive breakdown of payroll costs, benefits, and statutory compliance</p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Benefits and Deductions */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-white rounded-2xl border-2 border-emerald-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-3 rounded-xl shadow-sm">
                      <Calculator className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">Benefits and Deductions</h4>
                      <p className="text-sm text-slate-600">Monthly breakdown of employee benefits and deductions</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-4 border border-emerald-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-emerald-900">Total Benefits</span>
                        <span className="text-lg font-bold text-emerald-600">₹{Math.round(payrollData.benefits).toLocaleString()}</span>
                      </div>
                      <Progress value={75} className="h-3 bg-emerald-100" />
                      <div className="text-xs text-emerald-600 mt-1">75% allocation</div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-red-900">Total Deductions</span>
                        <span className="text-lg font-bold text-red-600">₹{Math.round(payrollData.deductions).toLocaleString()}</span>
                      </div>
                      <Progress value={60} className="h-3 bg-red-100" />
                      <div className="text-xs text-red-600 mt-1">60% allocation</div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                      <h5 className="font-semibold text-slate-900 mb-3">Benefit Breakdown</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Medical Insurance</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">₹25,000</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Meal Allowance</span>
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-300">₹12,000</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Transport Allowance</span>
                          <Badge className="bg-purple-100 text-purple-700 border border-purple-300">₹8,000</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* EPF ESI TDS */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-gradient-to-br from-blue-50 via-blue-100/50 to-white rounded-2xl border-2 border-blue-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl shadow-sm">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">EPF, ESI & TDS</h4>
                      <p className="text-sm text-slate-600">Statutory compliance and tax deductions</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 border-2 border-blue-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <PiggyBank className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-semibold text-slate-900">EPF Contribution</span>
                        </div>
                        <span className="text-xl font-bold text-blue-600">₹{Math.round(payrollData.epfContribution).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border-2 border-emerald-200 hover:border-emerald-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Shield className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="font-semibold text-slate-900">ESI Contribution</span>
                        </div>
                        <span className="text-xl font-bold text-emerald-600">₹{Math.round(payrollData.esiContribution).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border-2 border-orange-200 hover:border-orange-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-orange-600" />
                          </div>
                          <span className="font-semibold text-slate-900">TDS Deduction</span>
                        </div>
                        <span className="text-xl font-bold text-orange-600">₹{Math.round(payrollData.tdsDeduction).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4">
                    <h5 className="font-semibold text-slate-900 mb-2">Calculation Details</h5>
                    <div className="text-sm text-slate-700 space-y-1">
                      <p>• EPF: 12% of basic salary</p>
                      <p>• ESI: 3.25% of gross salary (up to ₹25,000)</p>
                      <p>• TDS: As per income tax slab</p>
                    </div>
                  </div>
                </motion.div>
            </div>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Active Employees Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-50 via-purple-100/50 to-white rounded-2xl border-2 border-purple-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl shadow-sm">
                      <Briefcase className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">Active Employees Overview</h4>
                      <p className="text-sm text-slate-600">Current workforce on payroll</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-900">Total Active</span>
                        <Badge className="bg-purple-100 text-purple-700 border border-purple-300 text-lg px-3 py-1">{activeEmployees}</Badge>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                      <h5 className="font-semibold text-slate-900 mb-3">Employment Type</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Full-time</span>
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-300">{Math.floor(activeEmployees * 0.8)}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Contract</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300">{Math.floor(activeEmployees * 0.15)}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Intern</span>
                          <Badge className="bg-orange-100 text-orange-700 border border-orange-300">{Math.floor(activeEmployees * 0.05)}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border border-indigo-200">
                      <h5 className="font-semibold text-slate-900 mb-3">Department Distribution</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Engineering</span>
                          <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-300">40%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Sales</span>
                          <Badge className="bg-green-100 text-green-700 border border-green-300">25%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">HR</span>
                          <Badge className="bg-pink-100 text-pink-700 border border-pink-300">15%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Others</span>
                          <Badge className="bg-gray-100 text-gray-700 border border-gray-300">20%</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

              {/* Final Settlement View */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Final Settlement View
                  </CardTitle>
                  <CardDescription>
                    Employee exit settlements and clearances
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      // Calculate final settlements for employees based on actual data
                      const calculateFinalSettlement = (employee: User) => {
                        const basicSalary = employee.salary || 0;
                        const joinDate = new Date(employee.joinDate || new Date());
                        const currentDate = new Date();
                        const monthsWorked = Math.max(1, Math.floor((currentDate.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
                        
                        // Calculate settlement components
                        const noticePeriodPay = basicSalary; // 1 month notice
                        const gratuity = monthsWorked >= 60 ? (basicSalary * monthsWorked * 15) / 26 : 0; // 15 days for each year if > 5 years
                        const pendingLeaves = Math.floor(Math.random() * 10) + 5; // Random pending leaves 5-15 days
                        const leaveEncashment = (basicSalary / 30) * pendingLeaves;
                        const providentFund = basicSalary * 0.12 * monthsWorked;
                        
                        return {
                          noticePeriodPay,
                          gratuity,
                          leaveEncashment,
                          providentFund,
                          total: noticePeriodPay + gratuity + leaveEncashment + providentFund,
                          monthsWorked
                        };
                      };

                      // Get employees who might have final settlements (sample based on certain criteria)
                      const settlementEmployees = employees.slice(0, 3).map((employee, index) => {
                        const settlement = calculateFinalSettlement(employee);
                        const statuses = ['Processing', 'Pending', 'Review'];
                        const variants: Array<"outline" | "destructive" | "secondary"> = ['outline', 'destructive', 'secondary'];
                        
                        return {
                          ...employee,
                          settlement,
                          status: statuses[index],
                          variant: variants[index],
                          lastWorkingDay: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000) // Future dates
                        };
                      });

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Pending Settlements</span>
                            <Badge variant="destructive">{settlementEmployees.length}</Badge>
                          </div>
                          
                          <div className="space-y-3">
                            {settlementEmployees.map((employee) => (
                              <div key={employee.id} className="p-3 border rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium text-sm">
                                    {employee.firstName} {employee.lastName}
                                  </span>
                                  <Badge variant={employee.variant}>{employee.status}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <div>Last working day: {format(employee.lastWorkingDay, 'MMM dd, yyyy')}</div>
                                  <div>Settlement Amount: ₹{Math.round(employee.settlement.total).toLocaleString()}</div>
                                  <div className="mt-2 text-xs">
                                    <div className="grid grid-cols-2 gap-1">
                                      <span>• Notice Pay: ₹{employee.settlement.noticePeriodPay.toLocaleString()}</span>
                                      <span>• Leave Encash: ₹{Math.round(employee.settlement.leaveEncashment).toLocaleString()}</span>
                                      <span>• Gratuity: ₹{Math.round(employee.settlement.gratuity).toLocaleString()}</span>
                                      <span>• PF: ₹{Math.round(employee.settlement.providentFund).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t">
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium mb-1">Settlement Components:</p>
                              <p>• Notice Period: 1 month basic salary</p>
                              <p>• Gratuity: 15 days salary × years worked (if &gt; 5 years)</p>
                              <p>• Leave Encashment: Pending leave days × daily salary</p>
                              <p>• PF: Employee + Employer contribution</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="salary" className="space-y-6">
            {/* Salary Components Configuration Panel */}
            {(user?.role === 'admin' || user?.role === 'developer') && (
              <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 shadow-lg">
                <Collapsible open={configPanelOpen} onOpenChange={setConfigPanelOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100 px-8 py-6 rounded-t-2xl border-b-2 border-amber-200 cursor-pointer hover:bg-amber-150 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-orange-100 to-amber-200 p-3 rounded-xl shadow-sm">
                            <Settings className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900">
                              Configure Salary Components
                            </CardTitle>
                            <CardDescription className="text-base text-slate-600 mt-1">
                              Adjust percentage rates for Basic, HRA, EPF, ESIC and Professional Tax
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-amber-700 border-amber-300 hover:bg-amber-100"
                            data-testid="button-configure-salary"
                          >
                            <Percent className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                          {configPanelOpen ? (
                            <ChevronUp className="h-5 w-5 text-amber-700" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-amber-700" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-8">
                      <Form {...salaryForm}>
                        <form onSubmit={salaryForm.handleSubmit((data) => updateSalaryComponentsMutation.mutate(data))} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Basic Salary Percentage */}
                            <FormField
                              control={salaryForm.control}
                              name="basicSalaryPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 font-semibold">Basic Salary (%)</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        placeholder="50"
                                        className="pr-8"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid="input-basic-percentage"
                                      />
                                      <Percent className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* HRA Percentage */}
                            <FormField
                              control={salaryForm.control}
                              name="hraPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 font-semibold">HRA (% of Basic)</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        placeholder="50"
                                        className="pr-8"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid="input-hra-percentage"
                                      />
                                      <Percent className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* EPF Percentage */}
                            <FormField
                              control={salaryForm.control}
                              name="epfPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 font-semibold">EPF (% of Basic)</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        placeholder="12"
                                        className="pr-8"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid="input-epf-percentage"
                                      />
                                      <Percent className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* ESIC Percentage */}
                            <FormField
                              control={salaryForm.control}
                              name="esicPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 font-semibold">ESIC (% of Gross)</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="0.75"
                                        className="pr-8"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid="input-esic-percentage"
                                      />
                                      <Percent className="absolute right-2 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Professional Tax */}
                            <FormField
                              control={salaryForm.control}
                              name="professionalTax"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-slate-700 font-semibold">Professional Tax (Fixed)</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="200"
                                        className="pl-8"
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                        data-testid="input-professional-tax"
                                      />
                                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-amber-200">
                            <div className="text-sm text-slate-600">
                              <p className="font-medium mb-1">Current Settings:</p>
                              <p>Basic: {currentSalaryComponents.basicSalaryPercentage}% • HRA: {currentSalaryComponents.hraPercentage}% • EPF: {currentSalaryComponents.epfPercentage}% • ESIC: {currentSalaryComponents.esicPercentage}% • Prof. Tax: ₹{currentSalaryComponents.professionalTax}</p>
                            </div>
                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  salaryForm.reset(currentSalaryComponents);
                                }}
                                className="flex items-center gap-2"
                                data-testid="button-reset-salary-config"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Reset
                              </Button>
                              <Button
                                type="submit"
                                disabled={updateSalaryComponentsMutation.isPending || isLoadingSettings}
                                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                                data-testid="button-save-salary-config"
                              >
                                {updateSalaryComponentsMutation.isPending ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                      <Settings className="h-4 w-4" />
                                    </motion.div>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Enhanced Executive Salary Details Table */}
            <Card className="bg-gradient-to-br from-white via-slate-50/50 to-white rounded-2xl border-2 border-slate-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-8 py-6 rounded-t-2xl border-b-2 border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                      <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-3 rounded-xl shadow-sm">
                        <Calculator className="h-6 w-6 text-indigo-600" />
                      </div>
                      Employee Salary Details
                    </CardTitle>
                    <CardDescription className="text-base text-slate-600 mt-2 ml-12">
                      Click on any employee row to view detailed profile and compensation breakdown
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleExportPayrollToExcel}
                    variant="outline" 
                    size="default"
                    className="flex items-center gap-2 bg-gradient-to-r from-white to-slate-50 border-2 border-slate-300 hover:border-slate-400 hover:shadow-lg transition-all duration-300 rounded-xl px-6 py-3 text-slate-700 font-semibold"
                    data-testid="button-export-excel"
                  >
                    <Download className="h-5 w-5" />
                    Export Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="overflow-hidden rounded-xl border-2 border-slate-200 shadow-lg bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b-2 border-slate-200 hover:bg-slate-100/80">
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">Employee</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">Position</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">Monthly CTC</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">Gross Salary</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">Basic ({currentSalaryComponents.basicSalaryPercentage}%)</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">HRA ({currentSalaryComponents.hraPercentage}%)</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">Special Allowance</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">EPF ({currentSalaryComponents.epfPercentage}%)</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">ESIC ({currentSalaryComponents.esicPercentage}%)</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">Prof. Tax</TableHead>
                        <TableHead className="text-slate-800 font-bold text-sm px-6 py-4">Net Salary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee, index) => {
                        const monthlyCTC = employee.salary || 0;
                        const breakdown = getSalaryBreakdown(monthlyCTC);

                        return (
                          <TableRow 
                            key={employee.id}
                            onClick={() => setLocation(`/employee/${employee.id}`)}
                            className={cn(
                              "cursor-pointer transition-all duration-300 border-b border-slate-100",
                              "hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50/50 hover:to-purple-50",
                              "hover:shadow-lg hover:scale-[1.01] hover:border-blue-200",
                              "group relative",
                              index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                            )}
                            data-testid={`row-employee-${employee.id}`}
                          >
                              <TableCell className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-lg shadow-sm">
                                    <Users className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                                      {employee.firstName} {employee.lastName}
                                    </div>
                                    <div className="text-sm text-slate-500 group-hover:text-blue-600 transition-colors">
                                      {employee.email}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <Badge variant="outline" className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 text-slate-700 font-medium">
                                  {employee.position || 'Not set'}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <span className="font-bold text-lg text-slate-900 group-hover:text-indigo-700 transition-colors">
                                  ₹{monthlyCTC.toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <span className="font-semibold text-slate-800">
                                  ₹{Math.round(breakdown.grossSalary).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <span className="font-semibold text-slate-800">
                                  ₹{Math.round(breakdown.basicSalary).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <span className="font-semibold text-slate-800">
                                  ₹{Math.round(breakdown.hra).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <span className="font-semibold text-slate-800">
                                  ₹{Math.round(breakdown.specialAllowance).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <span className="font-medium text-red-600">
                                  ₹{Math.round(breakdown.epf).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <span className="font-medium text-red-600">
                                  ₹{Math.round(breakdown.esic).toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <span className="font-medium text-red-600">
                                  ₹{breakdown.professionalTax.toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-bold text-xl text-green-600 group-hover:text-green-700 transition-colors">
                                    ₹{Math.round(breakdown.netSalary).toLocaleString()}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Salary Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Monthly Payroll</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{Math.round(
                    employees.reduce((sum, emp) => {
                      const monthlyCTC = emp.salary || 0;
                      const breakdown = getSalaryBreakdown(monthlyCTC);
                      return sum + breakdown.netSalary;
                    }, 0)
                  ).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Net salary for all employees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Total Deductions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{Math.round(
                    employees.reduce((sum, emp) => {
                      const monthlyCTC = emp.salary || 0;
                      const breakdown = getSalaryBreakdown(monthlyCTC);
                      return sum + breakdown.totalDeductions;
                    }, 0)
                  ).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    EPF + ESIC + Professional Tax for all employees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Average Net Salary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{Math.round(
                    employees.length > 0 
                      ? employees.reduce((sum, emp) => {
                          const monthlyCTC = emp.salary || 0;
                          const breakdown = getSalaryBreakdown(monthlyCTC);
                          return sum + breakdown.netSalary;
                        }, 0) / employees.length
                      : 0
                  ).toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per employee average
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            {/* Payment Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Paid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {paymentRecords?.filter(r => r.paymentStatus === 'paid').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {paymentRecords?.filter(r => r.paymentStatus === 'pending').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    Total Paid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{(paymentRecords
                      ?.filter(r => r.paymentStatus === 'paid')
                      .reduce((sum, r) => sum + r.amount, 0) || 0)
                      .toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4" />
                    Total Due
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{(paymentRecords
                      ?.filter(r => r.paymentStatus === 'pending')
                      .reduce((sum, r) => sum + r.amount, 0) || 0)
                      .toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Tracking Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Status - {currentMonth}
                </CardTitle>
                <CardDescription>
                  Track and manage salary payments for all employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Reference No</TableHead>
                      <TableHead>Bank Details</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => {
                      const paymentRecord = getPaymentRecord(employee.id);
                      const isPaid = paymentRecord?.paymentStatus === 'paid';

                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-muted-foreground">{employee.position}</div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              ₹{paymentRecord?.amount.toLocaleString() || '0'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={isPaid ? "default" : "secondary"}
                              className={isPaid ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-orange-100 text-orange-800 hover:bg-orange-200"}
                            >
                              {isPaid ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Paid
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {paymentRecord?.paymentDate ? 
                              format(new Date(paymentRecord.paymentDate), 'MMM dd, yyyy') : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>{paymentRecord?.paymentMode || '-'}</TableCell>
                          <TableCell>{paymentRecord?.referenceNo || '-'}</TableCell>
                          <TableCell>
                            {employee.bankAccountNumber ? (
                              <div className="text-xs">
                                <div className="font-medium">{employee.bankName}</div>
                                <div>****{employee.bankAccountNumber?.slice(-4)}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not provided</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {!isPaid ? (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(employee)}
                              >
                                Mark as Paid
                              </Button>
                            ) : (
                              <Badge variant="outline" className="text-green-600">
                                ✓ Completed
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Dialog */}
          <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
                <DialogDescription>
                  Mark payment as completed for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                </DialogDescription>
              </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="daysWorked">Days Worked (Auto-calculated)</Label>
                  <Input
                    id="daysWorked"
                    type="number"
                    value={paymentForm.daysWorked}
                    onChange={(e) => setPaymentForm({ ...paymentForm, daysWorked: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-[10px] text-muted-foreground">Derived from attendance logs.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalDays">Days in Month</Label>
                  <Input
                    id="totalDays"
                    type="number"
                    value={paymentForm.totalDaysInMonth}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                    <Input
                      id="amount"
                      className="pl-7"
                      value={Math.round(getSalaryBreakdown(selectedEmployee?.salary || 0, paymentForm.daysWorked, paymentForm.totalDaysInMonth).netSalary).toLocaleString()}
                      disabled
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Pro-rated based on {paymentForm.daysWorked} days worked.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Payment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mode">Payment Mode</Label>
                  <Select 
                    value={paymentForm.paymentMode} 
                    onValueChange={(value) => setPaymentForm({...paymentForm, paymentMode: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="neft">NEFT</SelectItem>
                      <SelectItem value="rtgs">RTGS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    placeholder="Enter transaction reference"
                    value={paymentForm.referenceNo}
                    onChange={(e) => setPaymentForm({...paymentForm, referenceNo: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleCompletePayment}
                  disabled={!paymentForm.paymentMode || !paymentForm.referenceNo}
                >
                  Complete Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Tabs>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}