import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileCheck, Plus, CheckCircle, Clock, AlertCircle, Package, Search, Eye, Edit, Check, X, Laptop, Monitor, Smartphone, Keyboard } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ReturnRequest {
  id: number;
  employee: string;
  asset: string;
  assetId: string;
  assetType: string;
  reason: string;
  dueDate: string;
  status: "Pending" | "Overdue" | "Completed" | "Cancelled";
  notes: string;
  requestDate: string;
}

interface ProcessedReturn {
  id: number;
  employee: string;
  asset: string;
  assetId: string;
  returnDate: string;
  condition: "Good" | "Fair" | "Damaged" | "Needs Repair";
  processedBy: string;
  notes: string;
}

export default function AssetReturnsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [pendingReturns, setPendingReturns] = useState<ReturnRequest[]>([
    { id: 1, employee: "John Doe", asset: "MacBook Pro 14 inch", assetId: "LAP-001", assetType: "Laptop", reason: "Resignation", dueDate: "Jan 30, 2024", status: "Pending", notes: "Final day is Jan 30", requestDate: "Jan 20, 2024" },
    { id: 2, employee: "Jane Smith", asset: "iPhone 14 Pro", assetId: "PHN-012", assetType: "Phone", reason: "Upgrade", dueDate: "Jan 28, 2024", status: "Overdue", notes: "Upgrading to iPhone 15", requestDate: "Jan 15, 2024" },
    { id: 3, employee: "Mike Johnson", asset: "Dell Monitor 27 inch", assetId: "MON-008", assetType: "Monitor", reason: "Department Transfer", dueDate: "Feb 5, 2024", status: "Pending", notes: "Moving to remote work", requestDate: "Jan 25, 2024" },
    { id: 4, employee: "Sarah Wilson", asset: "Logitech Keyboard", assetId: "KEY-015", assetType: "Keyboard", reason: "Replacement", dueDate: "Feb 1, 2024", status: "Pending", notes: "Receiving ergonomic keyboard", requestDate: "Jan 22, 2024" },
    { id: 5, employee: "Robert Brown", asset: "Sony Headphones", assetId: "HDP-003", assetType: "Headphones", reason: "End of Contract", dueDate: "Jan 25, 2024", status: "Overdue", notes: "Contract ended", requestDate: "Jan 10, 2024" },
  ]);

  const [recentReturns, setRecentReturns] = useState<ProcessedReturn[]>([
    { id: 1, employee: "Tom Brown", asset: "ThinkPad X1", assetId: "LAP-022", returnDate: "Jan 25, 2024", condition: "Good", processedBy: "Admin", notes: "No issues" },
    { id: 2, employee: "Lisa Chen", asset: "HP Monitor", assetId: "MON-045", returnDate: "Jan 24, 2024", condition: "Good", processedBy: "Admin", notes: "Clean and functional" },
    { id: 3, employee: "David Kim", asset: "Webcam Pro", assetId: "CAM-008", returnDate: "Jan 23, 2024", condition: "Damaged", processedBy: "Admin", notes: "Lens has scratches" },
    { id: 4, employee: "Emily Davis", asset: "Dell Laptop", assetId: "LAP-018", returnDate: "Jan 22, 2024", condition: "Fair", processedBy: "Admin", notes: "Minor wear on keyboard" },
  ]);

  const [newReturnDialogOpen, setNewReturnDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [viewPendingDialogOpen, setViewPendingDialogOpen] = useState(false);
  const [viewProcessedDialogOpen, setViewProcessedDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState<ReturnRequest | null>(null);
  const [selectedProcessed, setSelectedProcessed] = useState<ProcessedReturn | null>(null);

  const [newReturn, setNewReturn] = useState({
    employee: "",
    asset: "",
    assetId: "",
    assetType: "",
    reason: "",
    dueDate: "",
    notes: "",
  });

  const [processForm, setProcessForm] = useState({
    condition: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    reason: "",
    dueDate: "",
    notes: "",
  });

  const employees = ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson", "Robert Brown", "Emily Davis", "David Lee"];
  const reasons = ["Resignation", "Department Transfer", "Upgrade", "Replacement", "End of Contract", "Remote Work", "Other"];
  const conditions = ["Good", "Fair", "Damaged", "Needs Repair"];
  const assetTypes = ["Laptop", "Monitor", "Phone", "Keyboard", "Headphones", "Webcam", "Mouse"];

  const returnStats = [
    { title: "Pending Returns", value: pendingReturns.filter(r => r.status === "Pending").length.toString(), icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { title: "Processed Today", value: recentReturns.filter(r => r.returnDate === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })).length.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    { title: "This Month", value: recentReturns.length.toString(), icon: <FileCheck className="h-5 w-5" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "Overdue", value: pendingReturns.filter(r => r.status === "Overdue").length.toString(), icon: <AlertCircle className="h-5 w-5" />, color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  ];

  const filteredPending = pendingReturns.filter(r => {
    const matchesSearch = 
      r.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.assetId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Overdue": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Completed": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Cancelled": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Good": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Fair": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Damaged": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Needs Repair": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "Laptop": return <Laptop className="h-4 w-4" />;
      case "Monitor": return <Monitor className="h-4 w-4" />;
      case "Phone": return <Smartphone className="h-4 w-4" />;
      case "Keyboard": return <Keyboard className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleCreateReturn = () => {
    if (!newReturn.employee || !newReturn.asset || !newReturn.assetId || !newReturn.reason || !newReturn.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const returnRequest: ReturnRequest = {
      id: Date.now(),
      employee: newReturn.employee,
      asset: newReturn.asset,
      assetId: newReturn.assetId,
      assetType: newReturn.assetType,
      reason: newReturn.reason,
      dueDate: new Date(newReturn.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Pending",
      notes: newReturn.notes,
      requestDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setPendingReturns([returnRequest, ...pendingReturns]);
    setNewReturnDialogOpen(false);
    setNewReturn({ employee: "", asset: "", assetId: "", assetType: "", reason: "", dueDate: "", notes: "" });
    toast({
      title: "Return Request Created",
      description: `Return request for ${returnRequest.asset} has been created.`,
    });
  };

  const handleProcessClick = (request: ReturnRequest) => {
    setSelectedPending(request);
    setProcessForm({ condition: "", notes: "" });
    setProcessDialogOpen(true);
  };

  const handleConfirmProcess = () => {
    if (!selectedPending || !processForm.condition) {
      toast({
        title: "Validation Error",
        description: "Please select the asset condition.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const processedReturn: ProcessedReturn = {
      id: Date.now(),
      employee: selectedPending.employee,
      asset: selectedPending.asset,
      assetId: selectedPending.assetId,
      returnDate: today,
      condition: processForm.condition as ProcessedReturn["condition"],
      processedBy: "Admin",
      notes: processForm.notes || "Processed successfully",
    };

    setRecentReturns([processedReturn, ...recentReturns]);
    setPendingReturns(pendingReturns.filter(r => r.id !== selectedPending.id));
    setProcessDialogOpen(false);
    toast({
      title: "Return Processed",
      description: `${selectedPending.asset} has been returned and marked as ${processForm.condition}.`,
    });
  };

  const handleViewPending = (request: ReturnRequest) => {
    setSelectedPending(request);
    setViewPendingDialogOpen(true);
  };

  const handleViewProcessed = (processed: ProcessedReturn) => {
    setSelectedProcessed(processed);
    setViewProcessedDialogOpen(true);
  };

  const handleEditPending = (request: ReturnRequest) => {
    setSelectedPending(request);
    setEditForm({
      reason: request.reason,
      dueDate: "",
      notes: request.notes,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedPending) return;

    setPendingReturns(pendingReturns.map(r => 
      r.id === selectedPending.id 
        ? { 
            ...r, 
            reason: editForm.reason || r.reason,
            dueDate: editForm.dueDate ? new Date(editForm.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : r.dueDate,
            notes: editForm.notes,
          }
        : r
    ));

    setEditDialogOpen(false);
    toast({
      title: "Request Updated",
      description: "Return request has been updated successfully.",
    });
  };

  const handleCancelRequest = (request: ReturnRequest) => {
    setPendingReturns(pendingReturns.filter(r => r.id !== request.id));
    setViewPendingDialogOpen(false);
    toast({
      title: "Request Cancelled",
      description: `Return request for ${request.asset} has been cancelled.`,
    });
  };

  const handleMarkOverdue = (request: ReturnRequest) => {
    setPendingReturns(pendingReturns.map(r => 
      r.id === request.id ? { ...r, status: "Overdue" } : r
    ));
    toast({
      title: "Status Updated",
      description: `${request.asset} has been marked as overdue.`,
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-page-title">Asset Returns</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Process and track asset returns</p>
          </div>
          <Button className="gap-2" onClick={() => setNewReturnDialogOpen(true)} data-testid="button-new-return">
            <Plus className="h-4 w-4" />
            New Return Request
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {returnStats.map((stat, index) => (
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
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
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
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Pending Returns
                </CardTitle>
                <CardDescription>Assets awaiting return</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search returns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPending.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No pending returns found
                </div>
              ) : (
                filteredPending.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    data-testid={`row-pending-${index}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-700 border dark:border-slate-600">
                          {getAssetIcon(item.assetType)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{item.employee}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{item.asset} ({item.assetId})</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Reason: {item.reason} | Due: {item.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => handleViewPending(item)} data-testid={`button-view-pending-${index}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditPending(item)} data-testid={`button-edit-pending-${index}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleProcessClick(item)} data-testid={`button-process-${index}`}>
                          <Check className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Recent Returns
            </CardTitle>
            <CardDescription>Recently processed returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReturns.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover-elevate cursor-pointer"
                  onClick={() => handleViewProcessed(item)}
                  data-testid={`row-recent-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-700 border dark:border-slate-600">
                      <Package className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.asset}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.employee} | {item.returnDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getConditionColor(item.condition)}>
                      {item.condition}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleViewProcessed(item); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Return Request Dialog */}
      <Dialog open={newReturnDialogOpen} onOpenChange={setNewReturnDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Return Request</DialogTitle>
            <DialogDescription>Create a new asset return request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee *</Label>
              <Select value={newReturn.employee} onValueChange={(value) => setNewReturn({ ...newReturn, employee: value })}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Asset Name *</Label>
              <Input
                placeholder="e.g., MacBook Pro 14 inch"
                value={newReturn.asset}
                onChange={(e) => setNewReturn({ ...newReturn, asset: e.target.value })}
                data-testid="input-asset-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Asset ID *</Label>
              <Input
                placeholder="e.g., LAP-001"
                value={newReturn.assetId}
                onChange={(e) => setNewReturn({ ...newReturn, assetId: e.target.value })}
                data-testid="input-asset-id"
              />
            </div>
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={newReturn.assetType} onValueChange={(value) => setNewReturn({ ...newReturn, assetType: value })}>
                <SelectTrigger data-testid="select-asset-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={newReturn.reason} onValueChange={(value) => setNewReturn({ ...newReturn, reason: value })}>
                <SelectTrigger data-testid="select-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map(reason => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={newReturn.dueDate}
                onChange={(e) => setNewReturn({ ...newReturn, dueDate: e.target.value })}
                data-testid="input-due-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={newReturn.notes}
                onChange={(e) => setNewReturn({ ...newReturn, notes: e.target.value })}
                data-testid="textarea-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewReturnDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateReturn} data-testid="button-create-return">Create Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Return Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
            <DialogDescription>
              Process return for {selectedPending?.asset}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">Employee</p>
              <p className="font-medium">{selectedPending?.employee}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Asset</p>
              <p className="font-medium">{selectedPending?.asset} ({selectedPending?.assetId})</p>
            </div>
            <div className="space-y-2">
              <Label>Asset Condition *</Label>
              <Select value={processForm.condition} onValueChange={(value) => setProcessForm({ ...processForm, condition: value })}>
                <SelectTrigger data-testid="select-condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map(cond => (
                    <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Condition notes, issues found, etc..."
                value={processForm.notes}
                onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
                data-testid="textarea-process-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmProcess} data-testid="button-confirm-process">
              <Check className="h-4 w-4 mr-2" />
              Complete Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Pending Return Dialog */}
      <Dialog open={viewPendingDialogOpen} onOpenChange={setViewPendingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return Request Details</DialogTitle>
            <DialogDescription>View pending return information</DialogDescription>
          </DialogHeader>
          {selectedPending && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Employee</p>
                  <p className="font-medium">{selectedPending.employee}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                  <Badge className={getStatusColor(selectedPending.status)}>{selectedPending.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Asset</p>
                  <p className="font-medium">{selectedPending.asset}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Asset ID</p>
                  <p className="font-mono font-medium">{selectedPending.assetId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Reason</p>
                  <p className="font-medium">{selectedPending.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Due Date</p>
                  <p className="font-medium">{selectedPending.dueDate}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Request Date</p>
                  <p className="font-medium">{selectedPending.requestDate}</p>
                </div>
              </div>
              {selectedPending.notes && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Notes</p>
                  <p className="text-sm mt-1">{selectedPending.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="text-red-600" onClick={() => selectedPending && handleCancelRequest(selectedPending)}>
              <X className="h-4 w-4 mr-2" />
              Cancel Request
            </Button>
            {selectedPending?.status === "Pending" && (
              <Button variant="outline" className="text-orange-600" onClick={() => selectedPending && handleMarkOverdue(selectedPending)}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Mark Overdue
              </Button>
            )}
            <Button onClick={() => { setViewPendingDialogOpen(false); selectedPending && handleProcessClick(selectedPending); }}>
              <Check className="h-4 w-4 mr-2" />
              Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Processed Return Dialog */}
      <Dialog open={viewProcessedDialogOpen} onOpenChange={setViewProcessedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Processed Return Details</DialogTitle>
            <DialogDescription>Completed return information</DialogDescription>
          </DialogHeader>
          {selectedProcessed && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Employee</p>
                  <p className="font-medium">{selectedProcessed.employee}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Condition</p>
                  <Badge className={getConditionColor(selectedProcessed.condition)}>{selectedProcessed.condition}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Asset</p>
                  <p className="font-medium">{selectedProcessed.asset}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Asset ID</p>
                  <p className="font-mono font-medium">{selectedProcessed.assetId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Return Date</p>
                  <p className="font-medium">{selectedProcessed.returnDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Processed By</p>
                  <p className="font-medium">{selectedProcessed.processedBy}</p>
                </div>
              </div>
              {selectedProcessed.notes && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Notes</p>
                  <p className="text-sm mt-1">{selectedProcessed.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProcessedDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pending Return Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Return Request</DialogTitle>
            <DialogDescription>Update return request details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={editForm.reason} onValueChange={(value) => setEditForm({ ...editForm, reason: value })}>
                <SelectTrigger data-testid="select-edit-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map(reason => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                data-testid="input-edit-due-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                data-testid="textarea-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
