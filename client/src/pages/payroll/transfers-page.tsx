import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Download, CheckCircle, Clock, AlertCircle, IndianRupee, FileText, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, PaymentRecord } from "@shared/schema";
import { format } from "date-fns";

export default function BankTransfersPage() {
  const currentMonthStr = format(new Date(), 'MMM yyyy');
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  const { data: paymentRecords = [], isLoading: isLoadingPayments } = useQuery<PaymentRecord[]>({
    queryKey: ["/api/payment-records"],
  });

  const transfers = useMemo(() => {
    return employees.map(emp => {
      const record = paymentRecords.find(r => r.employeeId === emp.id && r.month === selectedMonth);
      return {
        id: emp.id,
        employee: `${emp.firstName} ${emp.lastName}`,
        bank: emp.bankName || "N/A",
        account: emp.bankAccountNumber ? `****${emp.bankAccountNumber.slice(-4)}` : "N/A",
        amount: record?.amount || 0,
        status: record?.paymentStatus === 'paid' ? 'Completed' : 'Pending',
        date: record?.paymentDate ? format(new Date(record.paymentDate), 'MMM dd, yyyy') : "-"
      };
    });
  }, [employees, paymentRecords, selectedMonth]);

  const transferStats = useMemo(() => {
    const completed = transfers.filter(t => t.status === "Completed");
    const totalAmount = completed.reduce((sum, t) => sum + t.amount, 0);
    return [
      { title: "Total Amount", value: `₹${totalAmount.toLocaleString()}`, icon: <IndianRupee className="h-5 w-5" /> },
      { title: "Completed", value: completed.length.toString(), icon: <CheckCircle className="h-5 w-5" /> },
      { title: "Pending", value: transfers.filter(t => t.status === "Pending").length.toString(), icon: <Clock className="h-5 w-5" /> },
      { title: "Avg Transfer", value: `₹${(completed.length ? Math.round(totalAmount / completed.length) : 0).toLocaleString()}`, icon: <Building2 className="h-5 w-5" /> },
    ];
  }, [transfers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Failed": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
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
            <h1 className="text-2xl font-bold text-slate-900">Bank Transfers</h1>
            <p className="text-slate-500 mt-1">Manage RTGS/NEFT salary disbursements</p>
          </div>
          <div className="flex gap-2">
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
              <Download className="h-4 w-4" />
              Export Batch
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {transferStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
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
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600" />
              Disbursement Register
            </CardTitle>
            <CardDescription>{selectedMonth} Payment Summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Employee</th>
                    <th className="text-left py-3 px-4 font-medium">Bank</th>
                    <th className="text-left py-3 px-4 font-medium">Account</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y">
                  {transfers.map((t, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium">{t.employee}</td>
                      <td className="py-3 px-4 text-slate-600">{t.bank}</td>
                      <td className="py-3 px-4 font-mono text-xs">{t.account}</td>
                      <td className="py-3 px-4 font-semibold">₹{t.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant={t.status === 'Completed' ? 'default' : 'secondary'} className="text-[10px]">
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
