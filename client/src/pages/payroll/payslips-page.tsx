import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Search, Mail, Printer, CheckCircle, Clock, Calendar, IndianRupee, Eye, Loader2, Send, RefreshCw, Filter, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { User, PaymentRecord, Department } from "@shared/schema";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { generateProfessionalPayslip } from "@/lib/payslip-utils";

export default function PayslipsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentMonthStr = format(new Date(), 'MMM yyyy');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [newSalary, setNewSalary] = useState<string>("");

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  const { data: paymentRecords = [], isLoading: isLoadingPayments } = useQuery<PaymentRecord[]>({
    queryKey: ["/api/payment-records"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: systemSettings } = useQuery<any>({
    queryKey: ["/api/settings/system"],
  });

  const updateSalaryMutation = useMutation({
    mutationFn: async ({ id, salary }: { id: number, salary: number }) => {
      const res = await apiRequest("PATCH", `/api/employees/${id}`, { salary });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: "Success", description: "Employee salary updated successfully" });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const currentSalaryComponents = systemSettings?.salaryComponents || {
    basicSalaryPercentage: 50,
    hraPercentage: 50,
    epfPercentage: 12,
    esicPercentage: 0.75,
    professionalTax: 200
  };

  const getSalaryBreakdown = (monthlyCTC: number) => {
    // Gross Salary is effectively the monthly CTC
    const gross = monthlyCTC;
    
    // Components based on percentages of Gross
    const basic = gross * (currentSalaryComponents.basicSalaryPercentage / 100);
    const hra = basic * (currentSalaryComponents.hraPercentage / 100);
    
    // Fixed allowances as per previous logic
    const da = basic * 0.1; 
    const conveyance = 1600;
    const medical = 1250;
    
    // Deductions
    const epf = basic * (currentSalaryComponents.epfPercentage / 100);
    const esic = gross <= 21000 ? gross * (currentSalaryComponents.esicPercentage / 100) : 0;
    const pt = currentSalaryComponents.professionalTax;
    
    // Special Allowance = Gross - (Basic + DA + HRA + Conveyance + Medical)
    const earningsBeforeSpecial = basic + da + hra + conveyance + medical;
    const specialAllowance = Math.max(0, gross - earningsBeforeSpecial);
    
    const deductions = epf + esic + pt;
    const net = gross - deductions;

    return { gross, basic, da, hra, conveyance, medical, specialAllowance, epf, esic, pt, deductions, net };
  };

  const payslips = useMemo(() => {
    return employees.map(emp => {
      const record = paymentRecords.find(r => r.employeeId === emp.id && r.month === selectedMonth);
      const breakdown = getSalaryBreakdown(emp.salary || 0);
      const dept = departments.find(d => d.id === emp.departmentId);

      return {
        ...emp,
        id: emp.id,
        employee: `${emp.firstName} ${emp.lastName}`,
        empId: emp.employeeId || `EMP${emp.id}`,
        department: dept?.name || "N/A",
        netPay: record?.amount || breakdown.net,
        status: record?.paymentStatus === 'paid' ? 'Generated' : 'Pending',
        emailed: false, 
        breakdown
      };
    });
  }, [employees, paymentRecords, selectedMonth, departments, currentSalaryComponents]);

  const filteredPayslips = payslips.filter(p => {
    const matchesSearch = p.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.empId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const payslipStats = useMemo(() => {
    return [
      { title: "Total Payslips", value: payslips.length.toString(), icon: <FileText className="h-5 w-5" /> },
      { title: "Generated", value: payslips.filter(p => p.status === "Generated").length.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
      { title: "Pending", value: payslips.filter(p => p.status === "Pending").length.toString(), icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
      { title: "Total Value", value: `₹${(payslips.reduce((sum, p) => sum + p.netPay, 0) / 100000).toFixed(1)}L`, icon: <IndianRupee className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
    ];
  }, [payslips]);

  const handleDownload = (payslip: any) => {
    const b = payslip.breakdown;
    generateProfessionalPayslip({
      employeeName: payslip.employee,
      employeeId: payslip.empId,
      designation: payslip.position || "N/A",
      department: payslip.department,
      dateOfJoining: payslip.joinDate || new Date(),
      bankAccountNo: payslip.bankAccountNumber || "N/A",
      paidDays: 25,
      lopDays: 0,
      pfAccountNumber: "PU/PUN/" + payslip.empId,
      uan: payslip.uanNumber || "N/A",
      esiNumber: payslip.esicNumber || "N/A",
      pan: payslip.panCard || "N/A",
      workLocation: payslip.workLocation || "Pune",
      month: selectedMonth,
      breakdown: b
    });
  };

  const handleGeneratePayslip = (payslip: any) => {
    toast({ title: "Processing", description: `Generating payslip for ${payslip.employee}...` });
  };

  const handleEditSalary = (payslip: any) => {
    const emp = employees.find(e => e.id === payslip.id);
    if (emp) {
      setEditingEmployee(emp);
      setNewSalary(emp.salary?.toString() || "");
      setShowEditDialog(true);
    }
  };

  const handleSaveSalary = () => {
    if (editingEmployee && newSalary) {
      updateSalaryMutation.mutate({ 
        id: editingEmployee.id, 
        salary: parseInt(newSalary) 
      });
    }
  };

  if (isLoadingEmployees || isLoadingPayments) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Payslip Generation</h1>
            <p className="text-slate-500 mt-1">Generate and distribute monthly employee payslips</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentMonthStr}>{currentMonthStr}</SelectItem>
                <SelectItem value={format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'MMM yyyy')}>
                  {format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'MMM yyyy')}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Email All
            </Button>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Generate All
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {payslipStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color || "bg-teal-50 text-teal-600"}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Payslips - {selectedMonth}
                </CardTitle>
                <CardDescription>Monthly disbursement status</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search employee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="generated">Generated</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr className="text-xs uppercase text-slate-500 font-medium">
                    <th className="text-left py-4 px-6">Employee</th>
                    <th className="text-left py-4 px-6">Emp ID</th>
                    <th className="text-left py-4 px-6">Department</th>
                    <th className="text-left py-4 px-6">Net Pay</th>
                    <th className="text-left py-4 px-6">Status</th>
                    <th className="text-right py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredPayslips.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-medium">{p.employee}</td>
                      <td className="py-4 px-6 text-slate-600">{p.empId}</td>
                      <td className="py-4 px-6 text-slate-600">{p.department}</td>
                      <td className="py-4 px-6 font-semibold">₹{Math.round(p.netPay).toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <Badge variant={p.status === 'Generated' ? 'default' : 'secondary'} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditSalary(p)} title="Edit Salary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {p.status === "Pending" ? (
                          <Button size="sm" onClick={() => handleGeneratePayslip(p)}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Generate
                          </Button>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedPayslip(p); setShowViewDialog(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(p)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Detail - {selectedPayslip?.employee}</DialogTitle>
            <DialogDescription>{selectedMonth}</DialogDescription>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-slate-500 mb-1">Earnings</p>
                  <div className="flex justify-between py-1"><span>Basic</span> <span>₹{Math.round(selectedPayslip.breakdown.basic).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span>DA</span> <span>₹{Math.round(selectedPayslip.breakdown.da).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span>HRA</span> <span>₹{Math.round(selectedPayslip.breakdown.hra).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span>Conveyance</span> <span>₹{Math.round(selectedPayslip.breakdown.conveyance).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span>Medical</span> <span>₹{Math.round(selectedPayslip.breakdown.medical).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span>Special</span> <span>₹{Math.round(selectedPayslip.breakdown.specialAllowance).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-bold border-t mt-1 pt-1"><span>Total Gross</span> <span>₹{Math.round(selectedPayslip.breakdown.gross).toLocaleString()}</span></div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <p className="text-slate-500 mb-1">Deductions</p>
                  <div className="flex justify-between py-1"><span>PF</span> <span>₹{Math.round(selectedPayslip.breakdown.epf).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1"><span>PT</span> <span>₹{selectedPayslip.breakdown.pt}</span></div>
                  <div className="flex justify-between py-1"><span>ESIC</span> <span>₹{Math.round(selectedPayslip.breakdown.esic).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-bold border-t mt-1 pt-1"><span>Total Ded.</span> <span>₹{Math.round(selectedPayslip.breakdown.deductions).toLocaleString()}</span></div>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-teal-50 rounded-lg">
                <span className="font-bold text-teal-800">Net Payable Amount</span>
                <span className="text-xl font-bold text-teal-800">₹{Math.round(selectedPayslip.netPay).toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee Salary</DialogTitle>
            <DialogDescription>Adjust the Monthly CTC for {editingEmployee?.firstName} {editingEmployee?.lastName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Monthly CTC</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="salary"
                  type="number"
                  className="pl-10"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  placeholder="Enter monthly CTC"
                />
              </div>
              <p className="text-[10px] text-slate-500">Note: This is the actual monthly gross salary used for calculations.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSaveSalary} 
              disabled={updateSalaryMutation.isPending}
              className="gap-2"
            >
              {updateSalaryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
