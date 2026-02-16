import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Wallet, Download, IndianRupee, CheckCircle, Clock, Calendar, Building2, Search, Eye, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Reimbursement {
  id: number;
  employee: string;
  category: string;
  claimAmount: number;
  approvedAmount: number;
  status: "Pending" | "Processing" | "Paid";
  dueDate?: string;
  paidDate?: string;
  claimId?: string;
  department?: string;
  bankDetails?: string;
  notes?: string;
}

export default function ReimbursementsPage() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState("January 2024");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"process" | "paid" | null>(null);

  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([
    { id: 1, employee: "John Doe", category: "Travel", claimAmount: 25000, approvedAmount: 22500, status: "Pending", dueDate: "Jan 30, 2024", claimId: "CLM-001", department: "Sales", bankDetails: "HDFC Bank ****1234", notes: "Client meeting travel expenses" },
    { id: 2, employee: "Jane Smith", category: "Equipment", claimAmount: 15000, approvedAmount: 15000, status: "Paid", paidDate: "Jan 25, 2024", claimId: "CLM-002", department: "Engineering", bankDetails: "ICICI Bank ****5678", notes: "Laptop accessories purchase" },
    { id: 3, employee: "Mike Johnson", category: "Meals", claimAmount: 8500, approvedAmount: 8000, status: "Processing", dueDate: "Feb 5, 2024", claimId: "CLM-003", department: "Marketing", bankDetails: "SBI ****9012", notes: "Team lunch expenses" },
    { id: 4, employee: "Sarah Wilson", category: "Training", claimAmount: 35000, approvedAmount: 35000, status: "Paid", paidDate: "Jan 20, 2024", claimId: "CLM-004", department: "HR", bankDetails: "Axis Bank ****3456", notes: "Conference registration fee" },
    { id: 5, employee: "Tom Brown", category: "Travel", claimAmount: 18500, approvedAmount: 17000, status: "Pending", dueDate: "Feb 10, 2024", claimId: "CLM-005", department: "Operations", bankDetails: "HDFC Bank ****7890", notes: "Site visit travel expenses" },
  ]);

  const reimbursementStats = [
    { title: "Total Pending", value: `₹${reimbursements.filter(r => r.status === "Pending").reduce((sum, r) => sum + r.approvedAmount, 0).toLocaleString()}`, icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "Paid This Month", value: `₹${reimbursements.filter(r => r.status === "Paid").reduce((sum, r) => sum + r.approvedAmount, 0).toLocaleString()}`, icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Total Employees", value: new Set(reimbursements.map(r => r.employee)).size.toString(), icon: <Wallet className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
    { title: "Processing", value: reimbursements.filter(r => r.status === "Processing").length.toString(), icon: <Building2 className="h-5 w-5" />, color: "bg-purple-50 text-purple-600" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-700";
      case "Processing": return "bg-blue-100 text-blue-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const filteredReimbursements = reimbursements.filter(item => {
    const matchesSearch = item.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.claimId?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleProcess = (item: Reimbursement) => {
    setSelectedReimbursement(item);
    setConfirmAction("process");
    setIsConfirmDialogOpen(true);
  };

  const handleMarkPaid = (item: Reimbursement) => {
    setSelectedReimbursement(item);
    setConfirmAction("paid");
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedReimbursement(null);
      setConfirmAction(null);
    }
    setIsConfirmDialogOpen(open);
  };

  const confirmActionHandler = () => {
    if (selectedReimbursement && confirmAction) {
      if (confirmAction === "process") {
        setReimbursements(reimbursements.map(r => 
          r.id === selectedReimbursement.id 
            ? { ...r, status: "Processing" as const } 
            : r
        ));
        toast({ title: "Processing Started", description: `Reimbursement for ${selectedReimbursement.employee} is now being processed` });
      } else if (confirmAction === "paid") {
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        setReimbursements(reimbursements.map(r => 
          r.id === selectedReimbursement.id 
            ? { ...r, status: "Paid" as const, paidDate: today, dueDate: undefined } 
            : r
        ));
        toast({ title: "Payment Completed", description: `₹${selectedReimbursement.approvedAmount.toLocaleString()} has been paid to ${selectedReimbursement.employee}` });
      }
      setIsConfirmDialogOpen(false);
      setSelectedReimbursement(null);
      setConfirmAction(null);
    }
  };

  const handleView = (item: Reimbursement) => {
    setSelectedReimbursement(item);
    setIsViewOpen(true);
  };

  const handleExport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(0, 128, 128);
    doc.text("Reimbursement Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Period: ${selectedMonth}`, 14, 36);
    
    const tableData = filteredReimbursements.map(item => [
      item.employee,
      item.category,
      `₹${item.claimAmount.toLocaleString()}`,
      `₹${item.approvedAmount.toLocaleString()}`,
      item.status,
      item.status === "Paid" ? (item.paidDate || "-") : (item.dueDate || "-")
    ]);
    
    autoTable(doc, {
      head: [["Employee", "Category", "Claim Amount", "Approved Amount", "Status", "Date"]],
      body: tableData,
      startY: 42,
      theme: "striped",
      headStyles: { fillColor: [0, 128, 128], textColor: 255 },
      styles: { fontSize: 9 },
    });
    
    const totalPending = reimbursements.filter(r => r.status === "Pending").reduce((sum, r) => sum + r.approvedAmount, 0);
    const totalProcessing = reimbursements.filter(r => r.status === "Processing").reduce((sum, r) => sum + r.approvedAmount, 0);
    const totalPaid = reimbursements.filter(r => r.status === "Paid").reduce((sum, r) => sum + r.approvedAmount, 0);
    
    const finalY = (doc as any).lastAutoTable.finalY || 42;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Summary:`, 14, finalY + 10);
    doc.text(`Total Pending: ₹${totalPending.toLocaleString()}`, 14, finalY + 18);
    doc.text(`Total Processing: ₹${totalProcessing.toLocaleString()}`, 14, finalY + 24);
    doc.text(`Total Paid: ₹${totalPaid.toLocaleString()}`, 14, finalY + 30);
    
    doc.save(`reimbursement-report-${selectedMonth.replace(" ", "-")}.pdf`);
    toast({ title: "Export Complete", description: "Reimbursement report has been downloaded" });
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Reimbursements</h1>
            <p className="text-slate-500 mt-1">Track and process expense reimbursements</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40" data-testid="select-month">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="January 2024">January 2024</SelectItem>
                <SelectItem value="December 2023">December 2023</SelectItem>
                <SelectItem value="November 2023">November 2023</SelectItem>
                <SelectItem value="October 2023">October 2023</SelectItem>
                <SelectItem value="September 2023">September 2023</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleExport} data-testid="button-export">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reimbursementStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-teal-600" />
                  Reimbursement Status
                </CardTitle>
                <CardDescription>Track payment status for approved claims</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Claim Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Approved Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReimbursements.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50" data-testid={`row-reimbursement-${index}`}>
                      <td className="py-3 px-4 font-medium">{item.employee}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{item.category}</Badge>
                      </td>
                      <td className="py-3 px-4">₹{item.claimAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-medium">₹{item.approvedAmount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.status === "Paid" ? item.paidDate : `Due: ${item.dueDate}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleView(item)} data-testid={`button-view-${index}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.status === "Pending" && (
                            <Button size="sm" onClick={() => handleProcess(item)} data-testid={`button-process-${index}`}>Process</Button>
                          )}
                          {item.status === "Processing" && (
                            <Button size="sm" onClick={() => handleMarkPaid(item)} data-testid={`button-complete-${index}`}>Mark Paid</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredReimbursements.length === 0 && (
                <div className="text-center py-8 text-slate-500">No reimbursements found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Reimbursement Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Reimbursement Details
            </DialogTitle>
          </DialogHeader>
          {selectedReimbursement && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Employee</p>
                  <p className="font-medium">{selectedReimbursement.employee}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Claim ID</p>
                  <p className="font-medium">{selectedReimbursement.claimId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <Badge variant="secondary">{selectedReimbursement.category}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="font-medium">{selectedReimbursement.department}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Claim Amount</p>
                  <p className="font-medium">₹{selectedReimbursement.claimAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Approved Amount</p>
                  <p className="font-bold text-lg text-green-600">₹{selectedReimbursement.approvedAmount.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={getStatusColor(selectedReimbursement.status)}>{selectedReimbursement.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{selectedReimbursement.status === "Paid" ? "Paid Date" : "Due Date"}</p>
                  <p className="font-medium">{selectedReimbursement.status === "Paid" ? selectedReimbursement.paidDate : selectedReimbursement.dueDate}</p>
                </div>
              </div>
              {selectedReimbursement.bankDetails && (
                <div>
                  <p className="text-sm text-slate-500">Bank Details</p>
                  <p className="font-medium">{selectedReimbursement.bankDetails}</p>
                </div>
              )}
              {selectedReimbursement.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-slate-700">{selectedReimbursement.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            {selectedReimbursement?.status === "Pending" && (
              <Button onClick={() => { handleProcess(selectedReimbursement); setIsViewOpen(false); }}>Process Payment</Button>
            )}
            {selectedReimbursement?.status === "Processing" && (
              <Button onClick={() => { handleMarkPaid(selectedReimbursement); setIsViewOpen(false); }}>Mark as Paid</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={handleConfirmDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction === "process" ? (
                <><Clock className="h-5 w-5 text-blue-600" /> Start Processing</>
              ) : (
                <><CheckCircle className="h-5 w-5 text-green-600" /> Confirm Payment</>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "process" 
                ? `Are you sure you want to start processing the reimbursement for ${selectedReimbursement?.employee}?`
                : `Are you sure you want to mark the payment of ₹${selectedReimbursement?.approvedAmount.toLocaleString()} as completed for ${selectedReimbursement?.employee}?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmActionHandler} data-testid="button-confirm-action">
              {confirmAction === "process" ? "Start Processing" : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
