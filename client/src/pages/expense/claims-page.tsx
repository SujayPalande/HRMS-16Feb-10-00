import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Receipt, Plus, IndianRupee, CheckCircle, Clock, Eye, Upload, Search, X, FileText, Calendar, ChevronRight, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ApprovalStep {
  role: "Manager" | "Senior Manager" | "Finance";
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
  approvedAt?: string;
}

interface ExpenseClaim {
  id: number;
  employee: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  receipts: number;
  receiptDetails?: string;
  notes?: string;
  // New approval workflow fields
  approvalLevel: number;
  currentApprovalStep: number;
  approvalSteps: ApprovalStep[];
  submittedBy?: string;
}

// Approval Rules Configuration - Easy to adjust later
const APPROVAL_RULES = {
  tier1: { maxAmount: 10000, roles: ["Manager"] },
  tier2: { maxAmount: 25000, roles: ["Manager", "Senior Manager"] },
  tier3: { maxAmount: Infinity, roles: ["Manager", "Senior Manager", "Finance"] }
};

// Helper Functions
const getApprovalLevels = (amount: number): ApprovalStep[] => {
  if (amount <= APPROVAL_RULES.tier1.maxAmount) {
    return [{ role: "Manager", status: "Pending" }];
  } else if (amount <= APPROVAL_RULES.tier2.maxAmount) {
    return [
      { role: "Manager", status: "Pending" },
      { role: "Senior Manager", status: "Pending" }
    ];
  } else {
    return [
      { role: "Manager", status: "Pending" },
      { role: "Senior Manager", status: "Pending" },
      { role: "Finance", status: "Pending" }
    ];
  }
};

const canApprove = (claim: ExpenseClaim, userRole: string, currentUser: string): boolean => {
  if (claim.status !== "Pending" || claim.submittedBy === currentUser) return false;
  const currentStep = claim.approvalSteps[claim.currentApprovalStep];
  return currentStep && currentStep.status === "Pending" && currentStep.role === userRole;
};

const getApprovalFlowDisplay = (claim: ExpenseClaim): string => {
  return claim.approvalSteps
    .map((step, idx) => {
      if (step.status === "Approved") return "✓";
      if (step.status === "Pending") return "⏳";
      return "✗";
    })
    .join(" → ");
};

export default function ExpenseClaimsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentUserRole] = useState("Manager"); // Would come from session
  const [currentUser] = useState("Current User"); // Would come from session

  const [claims, setClaims] = useState<ExpenseClaim[]>([
    { id: 1, employee: "John Doe", category: "Travel", description: "Client meeting travel", amount: 12500, date: "Jan 25, 2024", status: "Pending", receipts: 3, receiptDetails: "Flight tickets, Hotel bill, Cab receipts", notes: "Urgent client meeting in Mumbai", submittedBy: "john.doe@company.com", approvalLevel: 2, currentApprovalStep: 0, approvalSteps: [{ role: "Manager", status: "Pending" }, { role: "Senior Manager", status: "Pending" }] },
    { id: 2, employee: "Jane Smith", category: "Meals", description: "Team lunch", amount: 4500, date: "Jan 24, 2024", status: "Approved", receipts: 1, receiptDetails: "Restaurant bill", notes: "Team celebration lunch", submittedBy: "jane.smith@company.com", approvalLevel: 1, currentApprovalStep: 0, approvalSteps: [{ role: "Manager", status: "Approved", approvedBy: "Manager", approvedAt: "Jan 24, 2024" }] },
    { id: 3, employee: "Mike Johnson", category: "Equipment", description: "Laptop accessories", amount: 8000, date: "Jan 22, 2024", status: "Approved", receipts: 2, receiptDetails: "Mouse, Keyboard purchase receipts", notes: "Required for WFH setup", submittedBy: "mike.johnson@company.com", approvalLevel: 1, currentApprovalStep: 0, approvalSteps: [{ role: "Manager", status: "Approved", approvedBy: "Manager", approvedAt: "Jan 22, 2024" }] },
    { id: 4, employee: "Sarah Wilson", category: "Training", description: "Conference registration", amount: 35000, date: "Jan 20, 2024", status: "Pending", receipts: 1, receiptDetails: "Conference ticket", notes: "Annual tech conference", submittedBy: "sarah.wilson@company.com", approvalLevel: 3, currentApprovalStep: 0, approvalSteps: [{ role: "Manager", status: "Pending" }, { role: "Senior Manager", status: "Pending" }, { role: "Finance", status: "Pending" }] },
    { id: 5, employee: "Tom Brown", category: "Travel", description: "Site visit expenses", amount: 18500, date: "Jan 18, 2024", status: "Rejected", receipts: 4, receiptDetails: "Various travel receipts", notes: "Site inspection trip", submittedBy: "tom.brown@company.com", approvalLevel: 2, currentApprovalStep: 1, approvalSteps: [{ role: "Manager", status: "Approved", approvedBy: "Manager", approvedAt: "Jan 18, 2024" }, { role: "Senior Manager", status: "Rejected", approvedBy: "Senior Manager", approvedAt: "Jan 19, 2024" }] },
  ]);

  const [newClaim, setNewClaim] = useState({
    employee: "",
    category: "",
    description: "",
    amount: "",
    receipts: "",
    receiptDetails: "",
    notes: ""
  });

  const claimStats = [
    { title: "Total Claims", value: `₹${claims.reduce((sum, c) => sum + c.amount, 0).toLocaleString()}`, icon: <IndianRupee className="h-5 w-5" /> },
    { title: "Approved", value: `₹${claims.filter(c => c.status === "Approved").reduce((sum, c) => sum + c.amount, 0).toLocaleString()}`, icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Pending", value: `₹${claims.filter(c => c.status === "Pending").reduce((sum, c) => sum + c.amount, 0).toLocaleString()}`, icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "This Month", value: claims.length.toString(), icon: <Receipt className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Rejected": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || claim.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNewClaim = () => {
    if (!newClaim.employee || !newClaim.category || !newClaim.amount) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    const amount = parseFloat(newClaim.amount);
    const approvalSteps = getApprovalLevels(amount);
    
    const claim: ExpenseClaim = {
      id: claims.length + 1,
      employee: newClaim.employee,
      category: newClaim.category,
      description: newClaim.description,
      amount: amount,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Pending",
      receipts: parseInt(newClaim.receipts) || 0,
      receiptDetails: newClaim.receiptDetails,
      notes: newClaim.notes,
      submittedBy: currentUser,
      approvalLevel: approvalSteps.length,
      currentApprovalStep: 0,
      approvalSteps: approvalSteps
    };
    
    setClaims([claim, ...claims]);
    setNewClaim({ employee: "", category: "", description: "", amount: "", receipts: "", receiptDetails: "", notes: "" });
    setIsNewClaimOpen(false);
    toast({ title: "Success", description: `New expense claim submitted successfully. Requires ${approvalSteps.length} approval level(s)` });
  };

  const handleApprove = (claim: ExpenseClaim) => {
    // Security check: prevent self-approval
    if (claim.submittedBy === currentUser) {
      toast({ title: "Error", description: "You cannot approve your own expense claim", variant: "destructive" });
      return;
    }
    
    const currentStep = claim.currentApprovalStep;
    const updatedSteps = [...claim.approvalSteps];
    updatedSteps[currentStep] = {
      ...updatedSteps[currentStep],
      status: "Approved",
      approvedBy: currentUserRole,
      approvedAt: new Date().toLocaleDateString()
    };
    
    // Check if this is the final step
    const isFinalStep = currentStep === claim.approvalLevel - 1;
    const newStatus = isFinalStep ? "Approved" : "Pending";
    const nextStep = isFinalStep ? currentStep : currentStep + 1;
    
    setClaims(claims.map(c => 
      c.id === claim.id 
        ? { 
            ...c, 
            status: newStatus as "Approved" | "Pending",
            currentApprovalStep: nextStep,
            approvalSteps: updatedSteps
          } 
        : c
    ));
    
    const message = isFinalStep 
      ? `Expense claim for ₹${claim.amount.toLocaleString()} has been fully approved`
      : `Expense claim moved to next approval level (${updatedSteps[nextStep].role})`;
    
    toast({ title: "Approved", description: message });
  };

  const handleReject = (claim: ExpenseClaim) => {
    setSelectedClaim(claim);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedClaim) {
      if (!rejectReason.trim()) {
        toast({ title: "Error", description: "Please provide a reason for rejection", variant: "destructive" });
        return;
      }
      
      // Security check: prevent self-rejection of own claim
      if (selectedClaim.submittedBy === currentUser) {
        toast({ title: "Error", description: "You cannot reject your own expense claim", variant: "destructive" });
        return;
      }
      
      const currentStep = selectedClaim.currentApprovalStep;
      const updatedSteps = [...selectedClaim.approvalSteps];
      updatedSteps[currentStep] = {
        ...updatedSteps[currentStep],
        status: "Rejected",
        approvedBy: currentUserRole,
        approvedAt: new Date().toLocaleDateString()
      };
      
      setClaims(claims.map(c => 
        c.id === selectedClaim.id 
          ? { 
              ...c, 
              status: "Rejected" as "Rejected", 
              approvalSteps: updatedSteps,
              notes: `${selectedClaim.notes || ""}\nRejected by ${currentUserRole}: ${rejectReason}`.trim()
            } 
          : c
      ));
      
      toast({ title: "Rejected", description: `Expense claim has been rejected. Reason: ${rejectReason}`, variant: "destructive" });
      setIsRejectDialogOpen(false);
      setRejectReason("");
      setSelectedClaim(null);
    }
  };

  const handleRejectDialogClose = (open: boolean) => {
    if (!open) {
      setRejectReason("");
      setSelectedClaim(null);
    }
    setIsRejectDialogOpen(open);
  };

  const handleView = (claim: ExpenseClaim) => {
    setSelectedClaim(claim);
    setIsViewOpen(true);
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Expense Claims</h1>
            <p className="text-slate-500 mt-1">Submit and manage expense reimbursement claims</p>
          </div>
          <Button className="gap-2" onClick={() => setIsNewClaimOpen(true)} data-testid="button-new-claim">
            <Plus className="h-4 w-4" />
            New Claim
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {claimStats.map((stat, index) => (
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-teal-600" />
                  Expense Claims
                </CardTitle>
                <CardDescription>All expense claims and their approval status</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search claims..." 
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
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Receipts</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim, index) => (
                    <tr key={claim.id} className="border-b hover:bg-slate-50" data-testid={`row-claim-${index}`}>
                      <td className="py-3 px-4 font-medium">{claim.employee}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{claim.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{claim.description}</td>
                      <td className="py-3 px-4 font-medium">₹{claim.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">{claim.date}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="gap-1">
                          <Upload className="h-3 w-3" />
                          {claim.receipts}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <Badge className={getStatusColor(claim.status)}>{claim.status}</Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-slate-500 cursor-help">{getApprovalFlowDisplay(claim)}</span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">
                              <div className="space-y-1">
                                {claim.approvalSteps.map((step, i) => (
                                  <div key={i}>
                                    <span className="font-semibold">{step.role}:</span> {step.status}
                                    {step.approvedBy && <span className="text-xs"> - {step.approvedBy}</span>}
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleView(claim)} data-testid={`button-view-${index}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canApprove(claim, currentUserRole, currentUser) && (
                            <>
                              <Button size="sm" onClick={() => handleApprove(claim)} data-testid={`button-approve-${index}`}>Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => handleReject(claim)} data-testid={`button-reject-${index}`}>Reject</Button>
                            </>
                          )}
                          {claim.status === "Pending" && !canApprove(claim, currentUserRole, currentUser) && (
                            <span className="text-xs text-slate-500">Awaiting approval</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClaims.length === 0 && (
                <div className="text-center py-8 text-slate-500">No expense claims found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Claim Dialog */}
      <Dialog open={isNewClaimOpen} onOpenChange={setIsNewClaimOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-teal-600" />
              Submit New Expense Claim
            </DialogTitle>
            <DialogDescription>Fill in the details to submit a new expense claim</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee Name *</Label>
              <Input 
                id="employee" 
                placeholder="Enter employee name"
                value={newClaim.employee}
                onChange={(e) => setNewClaim({...newClaim, employee: e.target.value})}
                data-testid="input-employee"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={newClaim.category} onValueChange={(v) => setNewClaim({...newClaim, category: v})}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Meals">Meals</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                placeholder="Brief description of expense"
                value={newClaim.description}
                onChange={(e) => setNewClaim({...newClaim, description: e.target.value})}
                data-testid="input-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input 
                  id="amount" 
                  type="number"
                  placeholder="0.00"
                  value={newClaim.amount}
                  onChange={(e) => setNewClaim({...newClaim, amount: e.target.value})}
                  data-testid="input-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipts">Number of Receipts</Label>
                <Input 
                  id="receipts" 
                  type="number"
                  placeholder="0"
                  value={newClaim.receipts}
                  onChange={(e) => setNewClaim({...newClaim, receipts: e.target.value})}
                  data-testid="input-receipts"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiptDetails">Receipt Details</Label>
              <Input 
                id="receiptDetails" 
                placeholder="List of receipts attached"
                value={newClaim.receiptDetails}
                onChange={(e) => setNewClaim({...newClaim, receiptDetails: e.target.value})}
                data-testid="input-receipt-details"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional information"
                value={newClaim.notes}
                onChange={(e) => setNewClaim({...newClaim, notes: e.target.value})}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewClaimOpen(false)}>Cancel</Button>
            <Button onClick={handleNewClaim} data-testid="button-submit-claim">Submit Claim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Claim Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Expense Claim Details
            </DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Employee</p>
                  <p className="font-medium">{selectedClaim.employee}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Category</p>
                  <Badge variant="secondary">{selectedClaim.category}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="font-medium">{selectedClaim.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Amount</p>
                  <p className="font-bold text-lg">₹{selectedClaim.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {selectedClaim.date}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Receipts Attached</p>
                  <Badge variant="outline" className="gap-1">
                    <Upload className="h-3 w-3" />
                    {selectedClaim.receipts}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={getStatusColor(selectedClaim.status)}>{selectedClaim.status}</Badge>
                </div>
              </div>
              
              {/* Approval Flow Section */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Approval Flow ({selectedClaim.approvalLevel} levels)</p>
                <div className="space-y-2">
                  {selectedClaim.approvalSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded text-sm">
                      <div className="font-medium text-slate-700 w-24">{step.role}</div>
                      <div className="flex-1">
                        {step.status === "Approved" && <Badge className="bg-green-100 text-green-700">✓ Approved</Badge>}
                        {step.status === "Pending" && <Badge className="bg-yellow-100 text-yellow-700">⏳ Pending</Badge>}
                        {step.status === "Rejected" && <Badge className="bg-red-100 text-red-700">✗ Rejected</Badge>}
                      </div>
                      {step.approvedBy && <span className="text-xs text-slate-500">{step.approvedAt}</span>}
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedClaim.receiptDetails && (
                <div>
                  <p className="text-sm text-slate-500">Receipt Details</p>
                  <p className="text-slate-700">{selectedClaim.receiptDetails}</p>
                </div>
              )}
              {selectedClaim.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedClaim.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            {selectedClaim && canApprove(selectedClaim, currentUserRole, currentUser) && (
              <>
                <Button onClick={() => { handleApprove(selectedClaim); setIsViewOpen(false); }}>Approve</Button>
                <Button variant="destructive" onClick={() => { handleReject(selectedClaim); setIsViewOpen(false); }}>Reject</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={handleRejectDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Reject Expense Claim
            </DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} data-testid="button-confirm-reject">Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
