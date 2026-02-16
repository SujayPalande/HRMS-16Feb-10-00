import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Download, Eye, IndianRupee, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateProfessionalPayslip } from "@/lib/payslip-utils";

interface Payslip {
  id: number;
  month: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: string;
  basic: number;
  hra: number;
  allowances: number;
  pf: number;
  tax: number;
  other: number;
}

export default function MyPayslipsPage() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const { toast } = useToast();

  const payslips: Payslip[] = [
    { id: 1, month: "January 2024", grossPay: 100000, deductions: 15000, netPay: 85000, status: "Paid", basic: 50000, hra: 25000, allowances: 25000, pf: 6000, tax: 8000, other: 1000 },
    { id: 2, month: "December 2023", grossPay: 100000, deductions: 15000, netPay: 85000, status: "Paid", basic: 50000, hra: 25000, allowances: 25000, pf: 6000, tax: 8000, other: 1000 },
    { id: 3, month: "November 2023", grossPay: 100000, deductions: 15000, netPay: 85000, status: "Paid", basic: 50000, hra: 25000, allowances: 25000, pf: 6000, tax: 8000, other: 1000 },
    { id: 4, month: "October 2023", grossPay: 100000, deductions: 15000, netPay: 85000, status: "Paid", basic: 50000, hra: 25000, allowances: 25000, pf: 6000, tax: 8000, other: 1000 },
    { id: 5, month: "September 2023", grossPay: 100000, deductions: 15000, netPay: 85000, status: "Paid", basic: 50000, hra: 25000, allowances: 25000, pf: 6000, tax: 8000, other: 1000 },
    { id: 6, month: "August 2023", grossPay: 95000, deductions: 14000, netPay: 81000, status: "Paid", basic: 47500, hra: 23750, allowances: 23750, pf: 5700, tax: 7500, other: 800 },
  ];

  const payslipStats = [
    { title: "Current Month", value: "₹85,000", icon: <IndianRupee className="h-5 w-5" /> },
    { title: "YTD Earnings", value: "₹1,70,000", icon: <TrendingUp className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Tax Deducted", value: "₹15,000", icon: <IndianRupee className="h-5 w-5" />, color: "bg-red-50 text-red-600" },
    { title: "Total Payslips", value: payslips.length.toString(), icon: <FileText className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
  ];

  const filteredPayslips = payslips.filter(p => p.month.includes(selectedYear));

  const handleView = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setShowViewDialog(true);
  };

  const handleDownload = (payslip: Payslip) => {
    generateProfessionalPayslip({
      employeeName: "John Doe", // Mock data, ideally should come from auth
      employeeId: "EMP001",
      designation: "Engineering",
      department: "Engineering",
      dateOfJoining: "01 Jan 2024",
      bankAccountNo: "50100234567888",
      paidDays: 25,
      lopDays: 0,
      pfAccountNumber: "PU/PUN/EMP001",
      uan: "N/A",
      esiNumber: "N/A",
      pan: "N/A",
      workLocation: "Pune",
      month: payslip.month,
      breakdown: {
        gross: payslip.grossPay,
        basic: payslip.basic,
        hra: payslip.hra,
        specialAllowance: payslip.allowances,
        epf: payslip.pf,
        esic: 0,
        pt: payslip.tax / 2, // Mock breakdown
        deductions: payslip.deductions,
        net: payslip.netPay
      }
    });
    toast({
      title: "Downloaded",
      description: `Payslip for ${payslip.month} downloaded successfully.`
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">My Payslips</h1>
            <p className="text-slate-500 mt-1">View and download your monthly payslips</p>
          </div>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28" data-testid="select-year">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {payslipStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color || "bg-teal-50 text-teal-600"}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Payslip History
            </CardTitle>
            <CardDescription>Your monthly payslips for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Month</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Gross Pay</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Deductions</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Net Pay</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayslips.map((payslip, index) => (
                    <tr key={payslip.id} className="border-b hover:bg-slate-50" data-testid={`row-payslip-${index}`}>
                      <td className="py-3 px-4 font-medium">{payslip.month}</td>
                      <td className="py-3 px-4">₹{payslip.grossPay.toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-600">-₹{payslip.deductions.toLocaleString()}</td>
                      <td className="py-3 px-4 font-medium text-green-600">₹{payslip.netPay.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant="default">{payslip.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleView(payslip)} data-testid={`button-view-${index}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDownload(payslip)} data-testid={`button-download-${index}`}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
            <DialogTitle>Payslip - {selectedPayslip?.month}</DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-6 py-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">HRConnect Pvt. Ltd.</h2>
                <p className="text-slate-500">Pay Period: {selectedPayslip.month}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-600">Earnings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Basic Salary</span>
                      <span>₹{selectedPayslip.basic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">HRA</span>
                      <span>₹{selectedPayslip.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Other Allowances</span>
                      <span>₹{selectedPayslip.allowances.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Gross Earnings</span>
                      <span className="text-green-600">₹{selectedPayslip.grossPay.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-red-600">Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Provident Fund</span>
                      <span>₹{selectedPayslip.pf.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Income Tax</span>
                      <span>₹{selectedPayslip.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Other Deductions</span>
                      <span>₹{selectedPayslip.other.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Deductions</span>
                      <span className="text-red-600">₹{selectedPayslip.deductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Net Pay</span>
                  <span className="text-2xl font-bold text-green-600">₹{selectedPayslip.netPay.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            {selectedPayslip && (
              <Button onClick={() => handleDownload(selectedPayslip)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
